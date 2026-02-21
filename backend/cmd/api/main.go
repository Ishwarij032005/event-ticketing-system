package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/patrickmn/go-cache"
	"github.com/username/event-ticketing-system/internal/api/handler"
	"github.com/username/event-ticketing-system/internal/api/middleware"
	"github.com/username/event-ticketing-system/internal/config"
	"github.com/username/event-ticketing-system/internal/domain"
	"github.com/username/event-ticketing-system/internal/repository"
	"github.com/username/event-ticketing-system/internal/service"
	"github.com/username/event-ticketing-system/internal/worker"
	"github.com/username/event-ticketing-system/pkg/email"
	"github.com/username/event-ticketing-system/pkg/utils"
	"golang.org/x/time/rate"
)

func main() {
	cfg := config.LoadConfig()

	utils.InitLogger()
	defer utils.Logger.Sync()

	db := repository.InitDB(cfg)

	// Initialize Cache
	eventCache := cache.New(5*time.Minute, 10*time.Minute)

	emailService := email.NewEmailService(cfg.SMTPHost, cfg.SMTPPort, cfg.SMTPUser, cfg.SMTPPass, cfg.EmailFrom)
	workerPool := worker.NewWorkerPool(5, 100)
	workerPool.Start(context.Background())
	defer workerPool.Shutdown()

	ticketService := service.NewTicketService(db)
	registrationService := service.NewRegistrationService(db, ticketService, emailService, workerPool)
	analyticsService := service.NewAnalyticsService(db)
	auditService := service.NewAuditService(db)

	auditHandler := handler.NewAuditHandler(auditService)
	userHandler := handler.NewUserHandler(db)
	loadTestHandler := handler.NewLoadTestHandler(registrationService)
	feedbackHandler := handler.NewFeedbackHandler(db)

	authHandler := handler.NewAuthHandler(db, cfg, emailService)
	eventHandler := handler.NewEventHandler(db, workerPool, emailService, eventCache)
	registrationHandler := handler.NewRegistrationHandler(registrationService)

	r := gin.New()
	r.Use(middleware.Logger(), gin.Recovery(), middleware.RateLimitMiddleware(rate.Limit(5), 10))

	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	setupRoutes(r, authHandler, eventHandler, registrationHandler, auditHandler, userHandler, loadTestHandler, feedbackHandler, analyticsService, cfg)

	// Background worker
	workerCtx, cancelWorker := context.WithCancel(context.Background())
	notificationWorker := worker.NewNotificationWorker(db, emailService, 30*time.Minute, workerPool)
	go notificationWorker.Start(workerCtx)

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "UP",
			"time":   time.Now().Format(time.RFC3339),
		})
	})

	r.Static("/tickets", "./tmp/tickets")
	r.Static("/uploads", "./uploads")

	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: r,
	}

	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen: %s\n", err)
		}
	}()

	log.Printf("Server started on port %s", cfg.Port)

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	cancelWorker() // Signal worker to stop
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}

	log.Println("Server exiting")
}

func setupRoutes(r *gin.Engine, ah *handler.AuthHandler, eh *handler.EventHandler, rh *handler.RegistrationHandler, adh *handler.AuditHandler, uh *handler.UserHandler, lth *handler.LoadTestHandler, fbh *handler.FeedbackHandler, as *service.AnalyticsService, cfg *config.Config) {
	api := r.Group("/api")
	{
		v1 := api.Group("/v1")
		{
			auth := v1.Group("/auth")
			{
				auth.POST("/register", ah.Register)
				auth.POST("/login", ah.Login)
				auth.POST("/forgot-password", ah.ForgotPassword)
				auth.POST("/reset-password", ah.ResetPassword)
			}

			events := v1.Group("/events")
			{
				events.GET("/", eh.ListEvents)
				events.GET("/:id", eh.GetEvent)
				events.GET("/:id/seats", eh.GetRemainingSeats)
			}

			user := v1.Group("/")
			user.Use(middleware.AuthMiddleware(cfg))
			{
				registrations := user.Group("/registrations")
				{
					registrations.GET("/", rh.GetMyRegistrations)
					registrations.POST("/", rh.RegisterForEvent)
					registrations.DELETE("/:id", rh.CancelRegistration)
					registrations.POST("/:id/transfer", rh.TransferTicket)
					registrations.PUT("/:id/rsvp", rh.UpdateRSVP)
					registrations.GET("/:id/qr", rh.GetQR)
					registrations.POST("/feedback", fbh.SubmitFeedback)
				}
			}

			admin := v1.Group("/admin")
			admin.Use(middleware.AuthMiddleware(cfg), middleware.RBACMiddleware(domain.RoleAdmin))
			{
				eventAdmin := admin.Group("/events")
				{
					eventAdmin.POST("/", eh.CreateEvent)
					eventAdmin.PUT("/:id", eh.UpdateEvent)
					eventAdmin.DELETE("/:id", eh.DeleteEvent)
					eventAdmin.GET("/:id/attendees", rh.GetAttendees)
				}

				admin.POST("/upload", eh.UploadImage)

				admin.GET("/analytics", func(c *gin.Context) {
					stats, err := as.GetEventStats()
					if err != nil {
						utils.ErrorResponse(c, 500, "Failed to fetch event stats")
						return
					}
					utils.SuccessResponse(c, 200, "Event stats fetched successfully", stats)
				})

				admin.GET("/analytics/summary", func(c *gin.Context) {
					stats, err := as.GetSystemStats()
					if err != nil {
						utils.ErrorResponse(c, 500, "Failed to fetch system stats")
						return
					}
					utils.SuccessResponse(c, 200, "System stats fetched successfully", stats)
				})

				admin.GET("/audit-logs", adh.GetLogs)
				admin.POST("/load-test", lth.LoadTest)
				admin.GET("/events/:id/feedback", fbh.GetEventFeedback)

				userAdmin := admin.Group("/users")
				{
					userAdmin.GET("/", uh.ListUsers)
					userAdmin.PUT("/:id/role", uh.UpdateUserRole)
					userAdmin.DELETE("/:id", uh.DeleteUser)
				}

				eventAdminTiers := admin.Group("/events/:id/ticket-types")
				{
					eventAdminTiers.POST("/", eh.CreateTicketType)
					eventAdminTiers.PUT("/:tt_id", eh.UpdateTicketType)
					eventAdminTiers.DELETE("/:tt_id", eh.DeleteTicketType)
				}
			}
		}
	}
}
