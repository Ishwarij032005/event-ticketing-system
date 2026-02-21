package handler

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/username/event-ticketing-system/internal/config"
	"github.com/username/event-ticketing-system/internal/domain"
	"github.com/username/event-ticketing-system/pkg/email"
	"github.com/username/event-ticketing-system/pkg/utils"
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthHandler struct {
	DB           *gorm.DB
	Config       *config.Config
	EmailService email.EmailService
}

func NewAuthHandler(db *gorm.DB, cfg *config.Config, es email.EmailService) *AuthHandler {
	return &AuthHandler{DB: db, Config: cfg, EmailService: es}
}

type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Name     string `json:"name"`
	Role     string `json:"role"`
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to hash password")
		return
	}

	role := domain.RoleUser
	if req.Role != "" {
		if req.Role != string(domain.RoleAdmin) && req.Role != string(domain.RoleUser) {
			utils.ErrorResponse(c, http.StatusBadRequest, "Invalid role")
			return
		}
		role = domain.UserRole(req.Role)
	}

	user := domain.User{
		ID:           uuid.New(),
		Email:        req.Email,
		Name:         req.Name,
		PasswordHash: string(hashedPassword),
		Role:         role,
	}

	if err := h.DB.Create(&user).Error; err != nil {
		if strings.Contains(err.Error(), "unique") {
			utils.ErrorResponse(c, http.StatusConflict, "Email already exists")
		} else {
			utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create user")
		}
		return
	}

	// Audit Log
	audit := domain.AuditLog{
		ID:         uuid.New(),
		UserID:     user.ID,
		Action:     "USER_REGISTER",
		EntityType: "user",
		EntityID:   user.ID,
		CreatedAt:  time.Now(),
	}
	h.DB.Create(&audit)

	utils.SuccessResponse(c, http.StatusCreated, "User registered successfully", nil)
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	var user domain.User
	if err := h.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Invalid email or password")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Invalid email or password")
		return
	}

	token, err := utils.GenerateJWT(user.ID, user.Role, h.Config.JWTSecret, h.Config.JWTExpiryHours)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	// Audit Log
	audit := domain.AuditLog{
		ID:         uuid.New(),
		UserID:     user.ID,
		Action:     "USER_LOGIN",
		EntityType: "user",
		EntityID:   user.ID,
		CreatedAt:  time.Now(),
	}
	h.DB.Create(&audit)

	utils.SuccessResponse(c, http.StatusOK, "Login successful", gin.H{"token": token})
}

type ForgotPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}

func (h *AuthHandler) ForgotPassword(c *gin.Context) {
	var req ForgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	var user domain.User
	if err := h.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		// return success to prevent email enumeration
		utils.SuccessResponse(c, http.StatusOK, "If your email exists in our system, you will receive a reset link shortly", nil)
		return
	}

	// Generate reset token
	tokenBytes := make([]byte, 32)
	if _, err := rand.Read(tokenBytes); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	token := hex.EncodeToString(tokenBytes)

	// Set expiry (1 hour)
	user.PasswordResetToken = token
	user.PasswordResetExpires = time.Now().Add(1 * time.Hour)

	if err := h.DB.Save(&user).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to save reset token")
		return
	}

	// Send email
	// In a real app, this would be a full URL like https://myapp.com/reset-password?token=XYZ
	if err := h.EmailService.SendPasswordResetEmail(user.Email, token); err != nil {
		utils.Logger.Error("Failed to send password reset email", zap.Error(err))
	}

	utils.SuccessResponse(c, http.StatusOK, "If your email exists in our system, you will receive a reset link shortly", nil)
}

type ResetPasswordRequest struct {
	Token    string `json:"token" binding:"required"`
	Password string `json:"password" binding:"required,min=6"`
}

func (h *AuthHandler) ResetPassword(c *gin.Context) {
	var req ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	var user domain.User
	if err := h.DB.Where("password_reset_token = ? AND password_reset_expires > ?", req.Token, time.Now()).First(&user).Error; err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid or expired token")
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to hash password")
		return
	}

	// Update user record
	user.PasswordHash = string(hashedPassword)
	user.PasswordResetToken = ""
	user.PasswordResetExpires = time.Time{} // Clear expiry

	if err := h.DB.Save(&user).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update password")
		return
	}

	// Audit Log
	audit := domain.AuditLog{
		ID:         uuid.New(),
		UserID:     user.ID,
		Action:     "PASSWORD_RESET",
		EntityType: "user",
		EntityID:   user.ID,
		CreatedAt:  time.Now(),
	}
	h.DB.Create(&audit)

	utils.SuccessResponse(c, http.StatusOK, "Password reset successfully", nil)
}
