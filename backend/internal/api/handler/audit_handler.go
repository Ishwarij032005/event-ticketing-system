package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/username/event-ticketing-system/internal/service"
	"github.com/username/event-ticketing-system/pkg/utils"
)

type AuditHandler struct {
	Service *service.AuditService
}

func NewAuditHandler(s *service.AuditService) *AuditHandler {
	return &AuditHandler{Service: s}
}

func (h *AuditHandler) GetLogs(c *gin.Context) {
	action := c.Query("action")
	entityType := c.Query("entity_type")

	logs, err := h.Service.GetAuditLogs(action, entityType)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch audit logs")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Audit logs fetched successfully", logs)
}
