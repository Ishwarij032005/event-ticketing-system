package handler

import (
	"math"
	"net/http"
	"strconv"
	"time"

	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/patrickmn/go-cache"
	"github.com/username/event-ticketing-system/internal/domain"
	"github.com/username/event-ticketing-system/internal/worker"
	"github.com/username/event-ticketing-system/pkg/email"
	"github.com/username/event-ticketing-system/pkg/utils"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type EventHandler struct {
	DB           *gorm.DB
	Pool         *worker.WorkerPool
	EmailService email.EmailService
	Cache        *cache.Cache
}

func NewEventHandler(db *gorm.DB, pool *worker.WorkerPool, es email.EmailService, c *cache.Cache) *EventHandler {
	return &EventHandler{DB: db, Pool: pool, EmailService: es, Cache: c}
}

func (h *EventHandler) CreateEvent(c *gin.Context) {
	var req struct {
		Title        string  `json:"title" binding:"required"`
		Description  string  `json:"description"`
		Category     string  `json:"category"`
		StartTime    string  `json:"start_time" binding:"required"`
		TotalTickets int     `json:"total_tickets" binding:"required,gt=0"`
		Price        float64 `json:"price" binding:"min=0"`
		ImageURL     string  `json:"image_url"`
		Status       string  `json:"status"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	startTime, err := time.Parse(time.RFC3339, req.StartTime)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid start_time format. Use RFC3339 (e.g. 2026-05-01T10:00:00Z)")
		return
	}

	status := domain.StatusDraft
	if req.Status == string(domain.StatusPublished) {
		status = domain.StatusPublished
	}

	event := domain.Event{
		ID:               uuid.New(),
		Title:            req.Title,
		Description:      req.Description,
		Category:         req.Category,
		StartTime:        startTime,
		TotalTickets:     req.TotalTickets,
		RemainingTickets: req.TotalTickets,
		Price:            req.Price,
		ImageURL:         req.ImageURL,
		Status:           status,
	}

	if err := h.DB.Create(&event).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create event")
		return
	}

	// Audit Log
	userIDStr, _ := c.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))
	audit := domain.AuditLog{
		ID:         uuid.New(),
		UserID:     userID,
		Action:     "CREATE_EVENT",
		EntityType: "event",
		EntityID:   event.ID,
		NewValues:  utils.ToJSON(event),
		CreatedAt:  time.Now(),
	}
	h.DB.Create(&audit)

	// Invalidate cache
	h.Cache.Delete("events_list_default")

	utils.SuccessResponse(c, http.StatusCreated, "Event created successfully", event)
}

func (h *EventHandler) UploadImage(c *gin.Context) {
	file, err := c.FormFile("image")
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Image file is required")
		return
	}

	// Validate file extension
	ext := filepath.Ext(file.Filename)
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid file format. Only JPG, JPEG, and PNG are allowed.")
		return
	}

	// Create uploads directory if it doesn't exist
	uploadDir := "./uploads/events"
	if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
		os.MkdirAll(uploadDir, 0755)
	}

	// Generate unique filename
	filename := uuid.New().String() + ext
	filePath := filepath.Join(uploadDir, filename)

	if err := c.SaveUploadedFile(file, filePath); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to save image")
		return
	}

	// Return URL (relative for simplicity, should be full URL in production)
	imageURL := "/uploads/events/" + filename
	utils.SuccessResponse(c, http.StatusOK, "Image uploaded successfully", gin.H{"url": imageURL})
}

func (h *EventHandler) ListEvents(c *gin.Context) {
	// Check if this is a default listing (no filters) to use cache
	isDefaultListing := c.Request.URL.RawQuery == ""
	if isDefaultListing {
		if cachedEvents, found := h.Cache.Get("events_list_default"); found {
			utils.Logger.Info("Serving events list from cache")
			utils.SuccessResponse(c, http.StatusOK, "Events fetched successfully (cached)", cachedEvents)
			return
		}
	}

	query := h.DB.Model(&domain.Event{})

	// keyword search
	if q := c.Query("q"); q != "" {
		searchTerm := "%" + q + "%"
		query = query.Where("title ILIKE ? OR description ILIKE ?", searchTerm, searchTerm)
	}

	// category filter
	if category := c.Query("category"); category != "" {
		query = query.Where("category = ?", category)
	}

	// status filter: default to Published for public users
	status := c.Query("status")
	if status != "" {
		query = query.Where("status = ?", status)
	} else {
		query = query.Where("status = ?", domain.StatusPublished)
	}

	// availability filter
	if available := c.Query("available"); available == "true" {
		query = query.Where("remaining_tickets > 0")
	}

	// date range filter
	if startDate := c.Query("start_date"); startDate != "" {
		query = query.Where("start_time >= ?", startDate)
	}
	if endDate := c.Query("end_date"); endDate != "" {
		query = query.Where("start_time <= ?", endDate)
	}

	var total int64
	query.Count(&total)

	// Pagination
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if page < 1 {
		page = 1
	}
	offset := (page - 1) * limit

	var events []domain.Event
	if err := query.Preload("TicketTypes").Limit(limit).Offset(offset).Find(&events).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch events")
		return
	}

	// Store in cache if default
	if isDefaultListing {
		h.Cache.Set("events_list_default", events, cache.DefaultExpiration)
	}

	utils.SuccessResponseWithMeta(c, http.StatusOK, "Events fetched successfully", events, gin.H{
		"total":       total,
		"page":        page,
		"limit":       limit,
		"total_pages": int(math.Ceil(float64(total) / float64(limit))),
	})
}

func (h *EventHandler) GetEvent(c *gin.Context) {
	id := c.Param("id")
	var event domain.Event
	if err := h.DB.Preload("TicketTypes").First(&event, "id = ?", id).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Event not found")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Event fetched successfully", event)
}

func (h *EventHandler) UpdateEvent(c *gin.Context) {
	id := c.Param("id")
	var event domain.Event
	if err := h.DB.First(&event, "id = ?", id).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Event not found")
		return
	}

	var updateData struct {
		Title            string             `json:"title"`
		Description      string             `json:"description"`
		Category         string             `json:"category"`
		Status           domain.EventStatus `json:"status"`
		StartTime        time.Time          `json:"start_time"`
		TotalTickets     int                `json:"total_tickets"`
		RemainingTickets int                `json:"remaining_tickets"`
		Price            float64            `json:"price"`
		ImageURL         string             `json:"image_url"`
	}

	if err := c.ShouldBindJSON(&updateData); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	// Validate status transition if provided
	if updateData.Status != "" {
		if updateData.Status != domain.StatusDraft &&
			updateData.Status != domain.StatusPublished &&
			updateData.Status != domain.StatusCancelled {
			utils.ErrorResponse(c, http.StatusBadRequest, "Invalid status")
			return
		}

		// Simple transition rules
		if event.Status == domain.StatusCancelled && updateData.Status != domain.StatusCancelled {
			utils.ErrorResponse(c, http.StatusBadRequest, "Cannot change status of a cancelled event")
			return
		}

		event.Status = updateData.Status
	}

	// Update only provided fields
	if updateData.Title != "" {
		event.Title = updateData.Title
	}
	if updateData.Description != "" {
		event.Description = updateData.Description
	}
	if updateData.Category != "" {
		event.Category = updateData.Category
	}
	if !updateData.StartTime.IsZero() {
		event.StartTime = updateData.StartTime
	}
	if updateData.TotalTickets != 0 {
		event.TotalTickets = updateData.TotalTickets
	}
	if updateData.RemainingTickets != 0 {
		event.RemainingTickets = updateData.RemainingTickets
	}
	if updateData.Price != 0 {
		event.Price = updateData.Price
	}
	if updateData.ImageURL != "" {
		event.ImageURL = updateData.ImageURL
	}

	oldEvent := event // shallow copy for record
	if err := h.DB.Save(&event).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update event")
		return
	}

	// Audit Log
	userIDStr, _ := c.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))
	audit := domain.AuditLog{
		ID:         uuid.New(),
		UserID:     userID,
		Action:     "UPDATE_EVENT",
		EntityType: "event",
		EntityID:   event.ID,
		OldValues:  utils.ToJSON(oldEvent),
		NewValues:  utils.ToJSON(event),
		CreatedAt:  time.Now(),
	}
	h.DB.Create(&audit)

	// Background Notifications
	if updateData.Status == domain.StatusCancelled || (updateData.Title != "" || updateData.StartTime.IsZero() == false) {
		h.notifyAttendees(event, "Event Update: "+event.Title)
	}

	// Invalidate cache
	h.Cache.Delete("events_list_default")

	utils.SuccessResponse(c, http.StatusOK, "Event updated successfully", event)
}

func (h *EventHandler) notifyAttendees(event domain.Event, subject string) {
	var registrations []domain.Registration
	if err := h.DB.Preload("User").Where("event_id = ? AND status = ?", event.ID, domain.RegistrationConfirmed).Find(&registrations).Error; err != nil {
		utils.Logger.Error("Failed to fetch attendees for event notification", zap.Error(err))
		return
	}

	for _, reg := range registrations {
		h.Pool.Submit(worker.Task{
			Type: worker.TaskUpdate,
			Payload: map[string]interface{}{
				"email":       reg.User.Email,
				"event_title": event.Title,
				"subject":     subject,
			},
			Callback: func(t worker.Task) error {
				// We can reuse SendTicketEmail if it's generic enough or add a more generic one.
				// For now, let's assume we want a generic "Event Notification" email.
				return h.EmailService.SendTicketEmail(t.Payload["email"].(string), "N/A", t.Payload["subject"].(string))
			},
		})
	}
}

func (h *EventHandler) DeleteEvent(c *gin.Context) {
	id := c.Param("id")
	var event domain.Event
	if err := h.DB.First(&event, "id = ?", id).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Event not found")
		return
	}

	// Notify before deletion
	h.notifyAttendees(event, "Event Cancelled: "+event.Title)

	if err := h.DB.Delete(&domain.Event{}, "id = ?", id).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to delete event")
		return
	}

	// Audit Log
	userIDStr, _ := c.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))
	eventID, _ := uuid.Parse(id)
	audit := domain.AuditLog{
		ID:         uuid.New(),
		UserID:     userID,
		Action:     "DELETE_EVENT",
		EntityType: "event",
		EntityID:   eventID,
		CreatedAt:  time.Now(),
	}
	h.DB.Create(&audit)

	// Invalidate cache
	h.Cache.Delete("events_list_default")

	utils.SuccessResponse(c, http.StatusOK, "Event deleted successfully", nil)
}

func (h *EventHandler) GetRemainingSeats(c *gin.Context) {
	id := c.Param("id")
	var event domain.Event
	if err := h.DB.Select("remaining_tickets").First(&event, "id = ?", id).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Event not found")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Seats fetched successfully", gin.H{"remaining_seats": event.RemainingTickets})
}

func (h *EventHandler) CreateTicketType(c *gin.Context) {
	eventID, _ := uuid.Parse(c.Param("id"))
	var tt domain.TicketType
	if err := c.ShouldBindJSON(&tt); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	tt.ID = uuid.New()
	tt.EventID = eventID
	tt.RemainingTickets = tt.Capacity

	if err := h.DB.Create(&tt).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create ticket type")
		return
	}

	// Audit Log
	userIDStr, _ := c.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))
	audit := domain.AuditLog{
		ID:         uuid.New(),
		UserID:     userID,
		Action:     "CREATE_TICKET_TYPE",
		EntityType: "ticket_type",
		EntityID:   tt.ID,
		NewValues:  utils.ToJSON(tt),
		CreatedAt:  time.Now(),
	}
	h.DB.Create(&audit)

	utils.SuccessResponse(c, http.StatusCreated, "Ticket type created successfully", tt)
}

func (h *EventHandler) UpdateTicketType(c *gin.Context) {
	id := c.Param("tt_id")
	var tt domain.TicketType
	if err := h.DB.First(&tt, "id = ?", id).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Ticket type not found")
		return
	}

	oldTT := tt
	if err := c.ShouldBindJSON(&tt); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.DB.Save(&tt).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update ticket type")
		return
	}

	// Audit Log
	userIDStr, _ := c.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))
	audit := domain.AuditLog{
		ID:         uuid.New(),
		UserID:     userID,
		Action:     "UPDATE_TICKET_TYPE",
		EntityType: "ticket_type",
		EntityID:   tt.ID,
		OldValues:  utils.ToJSON(oldTT),
		NewValues:  utils.ToJSON(tt),
		CreatedAt:  time.Now(),
	}
	h.DB.Create(&audit)

	utils.SuccessResponse(c, http.StatusOK, "Ticket type updated successfully", tt)
}

func (h *EventHandler) DeleteTicketType(c *gin.Context) {
	id := c.Param("tt_id")
	if err := h.DB.Delete(&domain.TicketType{}, "id = ?", id).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to delete ticket type")
		return
	}

	// Audit Log
	userIDStr, _ := c.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))
	ttID, _ := uuid.Parse(id)
	audit := domain.AuditLog{
		ID:         uuid.New(),
		UserID:     userID,
		Action:     "DELETE_TICKET_TYPE",
		EntityType: "ticket_type",
		EntityID:   ttID,
		CreatedAt:  time.Now(),
	}
	h.DB.Create(&audit)

	utils.SuccessResponse(c, http.StatusOK, "Ticket type deleted successfully", nil)
}
