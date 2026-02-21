package service

import (
	"github.com/username/event-ticketing-system/internal/domain"
	"gorm.io/gorm"
)

type AuditService struct {
	DB *gorm.DB
}

func NewAuditService(db *gorm.DB) *AuditService {
	return &AuditService{DB: db}
}

func (s *AuditService) GetAuditLogs(action, entityType string) ([]domain.AuditLog, error) {
	var logs []domain.AuditLog
	query := s.DB.Order("created_at desc")

	if action != "" {
		query = query.Where("action = ?", action)
	}
	if entityType != "" {
		query = query.Where("entity_type = ?", entityType)
	}

	err := query.Find(&logs).Error
	return logs, err
}
