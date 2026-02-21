package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/username/event-ticketing-system/internal/domain"
	"github.com/username/event-ticketing-system/pkg/utils"
	"gorm.io/gorm"
)

type UserHandler struct {
	DB *gorm.DB
}

func NewUserHandler(db *gorm.DB) *UserHandler {
	return &UserHandler{DB: db}
}

func (h *UserHandler) ListUsers(c *gin.Context) {
	var users []domain.User
	if err := h.DB.Find(&users).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch users")
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Users fetched successfully", users)
}

func (h *UserHandler) UpdateUserRole(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Role domain.UserRole `json:"role" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	if req.Role != domain.RoleAdmin && req.Role != domain.RoleUser {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid role")
		return
	}

	if err := h.DB.Model(&domain.User{}).Where("id = ?", id).Update("role", req.Role).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update user role")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "User role updated successfully", nil)
}

func (h *UserHandler) DeleteUser(c *gin.Context) {
	id := c.Param("id")
	if err := h.DB.Delete(&domain.User{}, "id = ?", id).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to delete user")
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "User deleted successfully", nil)
}
