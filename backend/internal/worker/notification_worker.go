package worker

import (
	"context"
	"time"

	"github.com/username/event-ticketing-system/internal/domain"
	"github.com/username/event-ticketing-system/pkg/email"
	"github.com/username/event-ticketing-system/pkg/utils"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type NotificationWorker struct {
	DB           *gorm.DB
	EmailService email.EmailService
	Interval     time.Duration
	Pool         *WorkerPool
}

func NewNotificationWorker(db *gorm.DB, es email.EmailService, interval time.Duration, pool *WorkerPool) *NotificationWorker {
	return &NotificationWorker{
		DB:           db,
		EmailService: es,
		Interval:     interval,
		Pool:         pool,
	}
}

func (w *NotificationWorker) Start(ctx context.Context) {
	ticker := time.NewTicker(w.Interval)
	defer ticker.Stop()

	utils.Logger.Info("Notification worker started", zap.Duration("interval", w.Interval))

	for {
		select {
		case <-ctx.Done():
			utils.Logger.Info("Notification worker stopping")
			return
		case <-ticker.C:
			w.ProcessReminders()
		}
	}
}

func (w *NotificationWorker) ProcessReminders() {
	now := time.Now()
	upcoming := now.Add(24 * time.Hour)

	var events []domain.Event
	err := w.DB.Where("status = ? AND start_time > ? AND start_time <= ? AND reminder_sent = ?",
		domain.StatusPublished, now, upcoming, false).Find(&events).Error

	if err != nil {
		utils.Logger.Error("Failed to fetch upcoming events for reminders", zap.Error(err))
		return
	}

	for _, event := range events {
		w.processEventReminders(event)
	}
}

func (w *NotificationWorker) processEventReminders(event domain.Event) {
	utils.Logger.Info("Processing reminders for event", zap.String("id", event.ID.String()), zap.String("title", event.Title))

	var registrations []domain.Registration
	err := w.DB.Preload("User").Where("event_id = ? AND status = ?", event.ID, domain.RegistrationConfirmed).Find(&registrations).Error
	if err != nil {
		utils.Logger.Error("Failed to fetch registrations for event reminder", zap.String("event_id", event.ID.String()), zap.Error(err))
		return
	}

	for _, reg := range registrations {
		w.Pool.Submit(Task{
			Type: TaskReminder,
			Payload: map[string]interface{}{
				"email":           reg.User.Email,
				"registration_id": reg.ID.String(),
				"event_title":     event.Title,
			},
			Callback: func(t Task) error {
				return w.EmailService.SendTicketEmail(
					t.Payload["email"].(string),
					t.Payload["registration_id"].(string),
					t.Payload["event_title"].(string),
				)
			},
		})
	}

	// Wait a bit or use a waitgroup if we want strictness, but for now fire and forget is okay for reminders in a worker.
	// Update event to mark reminder as sent
	if err := w.DB.Model(&event).Update("reminder_sent", true).Error; err != nil {
		utils.Logger.Error("Failed to mark event reminder as sent", zap.String("event_id", event.ID.String()), zap.Error(err))
	}
}
