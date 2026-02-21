package handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/username/event-ticketing-system/internal/domain"
	"github.com/username/event-ticketing-system/pkg/utils"
	"gorm.io/gorm"
)

type FeedbackHandler struct {
	DB *gorm.DB
}

func NewFeedbackHandler(db *gorm.DB) *FeedbackHandler {
	return &FeedbackHandler{DB: db}
}

func (h *FeedbackHandler) SubmitFeedback(c *gin.Context) {
	var input struct {
		EventID uuid.UUID `json:"event_id" binding:"required"`
		Rating  int       `json:"rating" binding:"required,min=1,max=5"`
		Comment string    `json:"comment"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	userIDStr, _ := c.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))

	// Check if user attended the event
	var reg domain.Registration
	if err := h.DB.Where("user_id = ? AND event_id = ? AND status IN (?, ?, ?)",
		userID, input.EventID, domain.RegistrationConfirmed, domain.RegistrationRSVPYes, domain.RegistrationRSVPMaybe).
		First(&reg).Error; err != nil {
		utils.ErrorResponse(c, http.StatusForbidden, "You must be a confirmed attendee to leave feedback")
		return
	}

	// Check if event has already started
	var event domain.Event
	if err := h.DB.First(&event, "id = ?", input.EventID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Event not found")
		return
	}

	if time.Now().Before(event.StartTime) {
		utils.ErrorResponse(c, http.StatusBadRequest, "You can only leave feedback after the event starts")
		return
	}

	feedback := domain.Feedback{
		ID:        uuid.New(),
		EventID:   input.EventID,
		UserID:    userID,
		Rating:    input.Rating,
		Comment:   input.Comment,
		CreatedAt: time.Now(),
	}

	if err := h.DB.Create(&feedback).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to submit feedback")
		return
	}

	utils.SuccessResponse(c, http.StatusCreated, "Feedback submitted successfully", feedback)
}

func (h *FeedbackHandler) GetEventFeedback(c *gin.Context) {
	eventID := c.Param("id")
	var feedbacks []domain.Feedback
	if err := h.DB.Preload("User").Where("event_id = ?", eventID).Order("created_at desc").Find(&feedbacks).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch feedback")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Feedback fetched successfully", feedbacks)
}
