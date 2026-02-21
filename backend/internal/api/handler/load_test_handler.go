package handler

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/username/event-ticketing-system/internal/service"
	"github.com/username/event-ticketing-system/pkg/utils"
)

type LoadTestHandler struct {
	RegistrationService *service.RegistrationService
}

func NewLoadTestHandler(rs *service.RegistrationService) *LoadTestHandler {
	return &LoadTestHandler{RegistrationService: rs}
}

func (h *LoadTestHandler) LoadTest(c *gin.Context) {
	var req struct {
		EventID      uuid.UUID `json:"event_id" binding:"required"`
		TicketTypeID uuid.UUID `json:"ticket_type_id" binding:"required"`
		Concurrency  int       `json:"concurrency" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	if req.Concurrency <= 0 {
		utils.ErrorResponse(c, http.StatusBadRequest, "Concurrency must be greater than 0")
		return
	}

	var wg sync.WaitGroup
	var mu sync.Mutex
	successCount := 0
	failureCount := 0
	startTime := time.Now()

	// Simulate concurrent requests
	for i := 0; i < req.Concurrency; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()

			// Using a random user ID for each request to simulate different users
			randomUserID := uuid.New()
			_, err := h.RegistrationService.Register(randomUserID, req.EventID, req.TicketTypeID)

			mu.Lock()
			if err == nil {
				successCount++
			} else {
				failureCount++
			}
			mu.Unlock()
		}()
	}

	wg.Wait()
	duration := time.Since(startTime)

	c.JSON(http.StatusOK, gin.H{
		"message":      "Load test completed",
		"total":        req.Concurrency,
		"success":      successCount,
		"failed":       failureCount,
		"time_taken":   duration.String(),
		"avg_req_time": (duration / time.Duration(req.Concurrency)).String(),
	})
}
