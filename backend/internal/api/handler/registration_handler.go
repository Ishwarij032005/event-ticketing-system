package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/username/event-ticketing-system/internal/domain"
	"github.com/username/event-ticketing-system/internal/service"
	"github.com/username/event-ticketing-system/pkg/qr"
	"github.com/username/event-ticketing-system/pkg/utils"
)

type RegistrationHandler struct {
	Service *service.RegistrationService
}

func NewRegistrationHandler(s *service.RegistrationService) *RegistrationHandler {
	return &RegistrationHandler{Service: s}
}

func (h *RegistrationHandler) RegisterForEvent(c *gin.Context) {
	userIDStr, _ := c.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))

	var req struct {
		EventID      uuid.UUID `json:"event_id" binding:"required"`
		TicketTypeID uuid.UUID `json:"ticket_type_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	registration, err := h.Service.Register(userID, req.EventID, req.TicketTypeID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	// Preload for frontend display consistency
	h.Service.DB.Preload("Event").Preload("TicketType").First(registration, registration.ID)

	utils.SuccessResponse(c, http.StatusCreated, "Registration confirmed", registration)
}

func (h *RegistrationHandler) GetMyRegistrations(c *gin.Context) {
	userIDStr, _ := c.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))

	var registrations []domain.Registration
	if err := h.Service.DB.Where("user_id = ?", userID).
		Preload("Event").
		Preload("TicketType").
		Preload("Ticket").
		Find(&registrations).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch registrations")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Registrations fetched successfully", registrations)
}

func (h *RegistrationHandler) CancelRegistration(c *gin.Context) {
	userIDStr, _ := c.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))
	registrationID, _ := uuid.Parse(c.Param("id"))

	if err := h.Service.CancelRegistration(userID, registrationID); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Registration cancelled successfully", nil)
}

func (h *RegistrationHandler) TransferTicket(c *gin.Context) {
	userIDStr, _ := c.Get("user_id")
	senderID, _ := uuid.Parse(userIDStr.(string))
	registrationID, _ := uuid.Parse(c.Param("id"))

	var req struct {
		RecipientEmail string `json:"recipient_email" binding:"required,email"`
	}

	if err := h.Service.TransferTicket(senderID, registrationID, req.RecipientEmail); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Ticket transferred successfully", nil)
}

func (h *RegistrationHandler) GetAttendees(c *gin.Context) {
	eventID, _ := uuid.Parse(c.Param("id"))

	attendees, err := h.Service.GetEventAttendees(eventID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch attendees")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Attendees fetched successfully", attendees)
}

func (h *RegistrationHandler) UpdateRSVP(c *gin.Context) {
	regID, _ := uuid.Parse(c.Param("id"))
	var input struct {
		Status domain.RegistrationStatus `json:"status" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	userIDStr, _ := c.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))

	if err := h.Service.UpdateRSVP(userID, regID, input.Status); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update RSVP status")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "RSVP status updated successfully", nil)
}

func (h *RegistrationHandler) GetQR(c *gin.Context) {
	registrationID, _ := uuid.Parse(c.Param("id"))

	var ticket domain.Ticket
	if err := h.Service.DB.First(&ticket, "registration_id = ?", registrationID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Ticket not found")
		return
	}

	qrBytes, err := qr.GenerateQRCode(ticket.QRCodeURL)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to generate QR code")
		return
	}

	c.Data(http.StatusOK, "image/png", qrBytes)
}
