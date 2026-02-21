package service

import (
	"github.com/username/event-ticketing-system/internal/domain"
	"gorm.io/gorm"
)

type AnalyticsService struct {
	DB *gorm.DB
}

func NewAnalyticsService(db *gorm.DB) *AnalyticsService {
	return &AnalyticsService{DB: db}
}

type EventStats struct {
	EventID          string  `json:"event_id"`
	Title            string  `json:"title"`
	Category         string  `json:"category"`
	TotalBookings    int64   `json:"total_bookings"`
	Revenue          float64 `json:"revenue"`
	TicketsRemaining int     `json:"tickets_remaining"`
}

type SystemStats struct {
	TotalRegistrations  int64   `json:"total_registrations"`
	OccupancyPercentage float64 `json:"occupancy_percentage"`
	CancellationRate    float64 `json:"cancellation_rate"`
}

func (s *AnalyticsService) GetEventStats() ([]EventStats, error) {
	var stats []EventStats

	// Complex query for analytics
	err := s.DB.Model(&domain.Event{}).
		Select("events.id as event_id, events.title, events.category, count(registrations.id) as total_bookings, sum(events.price) as revenue, events.remaining_tickets as tickets_remaining").
		Joins("left join registrations on registrations.event_id = events.id and registrations.status = 'confirmed'").
		Group("events.id, events.title, events.category, events.remaining_tickets").
		Scan(&stats).Error

	return stats, err
}

func (s *AnalyticsService) GetSystemStats() (SystemStats, error) {
	var stats SystemStats

	var totalConfirmed int64
	var totalCancelled int64
	var totalCapacity int64

	// Get confirmed registrations
	if err := s.DB.Model(&domain.Registration{}).Where("status = ?", domain.RegistrationConfirmed).Count(&totalConfirmed).Error; err != nil {
		return stats, err
	}

	// Get cancelled registrations
	if err := s.DB.Model(&domain.Registration{}).Where("status = ?", domain.RegistrationCancelled).Count(&totalCancelled).Error; err != nil {
		return stats, err
	}

	// Get total capacity
	if err := s.DB.Model(&domain.Event{}).Select("sum(total_tickets)").Scan(&totalCapacity).Error; err != nil {
		return stats, err
	}

	stats.TotalRegistrations = totalConfirmed

	totalRegistrationsIncludingCancelled := totalConfirmed + totalCancelled
	if totalRegistrationsIncludingCancelled > 0 {
		stats.CancellationRate = (float64(totalCancelled) / float64(totalRegistrationsIncludingCancelled)) * 100
	}

	if totalCapacity > 0 {
		stats.OccupancyPercentage = (float64(totalConfirmed) / float64(totalCapacity)) * 100
	}

	return stats, nil
}
