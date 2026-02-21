package service

import (
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/username/event-ticketing-system/internal/domain"
	"github.com/username/event-ticketing-system/internal/worker"
	"github.com/username/event-ticketing-system/pkg/email"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type RegistrationService struct {
	DB            *gorm.DB
	TicketService *TicketService
	EmailService  email.EmailService
	Pool          *worker.WorkerPool
}

func NewRegistrationService(db *gorm.DB, ts *TicketService, es email.EmailService, pool *worker.WorkerPool) *RegistrationService {
	return &RegistrationService{DB: db, TicketService: ts, EmailService: es, Pool: pool}
}

func (s *RegistrationService) Register(userID uuid.UUID, eventID uuid.UUID, ticketTypeID uuid.UUID) (*domain.Registration, error) {
	var registration domain.Registration

	var user domain.User
	if err := s.DB.First(&user, "id = ?", userID).Error; err != nil {
		return nil, errors.New("user not found")
	}

	err := s.DB.Transaction(func(tx *gorm.DB) error {
		var event domain.Event
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&event, "id = ?", eventID).Error; err != nil {
			return errors.New("event not found")
		}

		if event.Status != domain.StatusPublished {
			return errors.New("cannot register for an event that is not published")
		}

		// Fetch and lock specific TicketType
		var ticketType domain.TicketType
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			First(&ticketType, "id = ? AND event_id = ?", ticketTypeID, eventID).Error; err != nil {
			return errors.New("ticket type not found for this event")
		}

		if ticketType.RemainingTickets <= 0 {
			return errors.New("no tickets available for this ticket type")
		}

		// Decrement tiered and event aggregate
		ticketType.RemainingTickets--
		if err := tx.Save(&ticketType).Error; err != nil {
			return err
		}

		event.RemainingTickets--
		if err := tx.Save(&event).Error; err != nil {
			return err
		}

		registration = domain.Registration{
			ID:           uuid.New(),
			UserID:       userID,
			EventID:      eventID,
			TicketTypeID: ticketTypeID,
			Status:       domain.RegistrationConfirmed,
		}
		if err := tx.Create(&registration).Error; err != nil {
			return err
		}

		_, err := s.TicketService.GenerateTicket(tx, registration.ID)
		if err != nil {
			return err
		}

		audit := domain.AuditLog{
			ID:         uuid.New(),
			UserID:     userID,
			Action:     "CREATE_REGISTRATION",
			EntityType: "registration",
			EntityID:   registration.ID,
			NewValues:  fmt.Sprintf(`{"event_id": "%s", "ticket_type_id": "%s"}`, eventID, ticketTypeID),
			CreatedAt:  time.Now(),
		}
		if err := tx.Create(&audit).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	// Async email notification
	eventTitle := ""
	var event domain.Event
	if err := s.DB.First(&event, "id = ?", eventID).Error; err == nil {
		eventTitle = event.Title
	}

	s.Pool.Submit(worker.Task{
		Type: worker.TaskReminder,
		Payload: map[string]interface{}{
			"email":           user.Email,
			"registration_id": registration.ID.String(),
			"event_title":     eventTitle,
		},
		Callback: func(t worker.Task) error {
			return s.EmailService.SendTicketEmail(
				t.Payload["email"].(string),
				t.Payload["registration_id"].(string),
				t.Payload["event_title"].(string),
			)
		},
	})

	return &registration, nil
}

func (s *RegistrationService) TransferTicket(senderID uuid.UUID, registrationID uuid.UUID, recipientEmail string) error {
	var recipient domain.User
	if err := s.DB.First(&recipient, "email = ?", recipientEmail).Error; err != nil {
		return errors.New("recipient user not found")
	}

	err := s.DB.Transaction(func(tx *gorm.DB) error {
		var registration domain.Registration
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Preload("Event").
			First(&registration, "id = ? AND user_id = ?", registrationID, senderID).Error; err != nil {
			return errors.New("registration not found or you are not the owner")
		}

		if registration.Status != domain.RegistrationConfirmed {
			return errors.New("cannot transfer a registration that is not confirmed")
		}

		if registration.Event.Status != domain.StatusPublished {
			return errors.New("cannot transfer registration for an event that is not published")
		}

		oldUserID := registration.UserID
		registration.UserID = recipient.ID
		if err := tx.Save(&registration).Error; err != nil {
			return err
		}

		// Delete old ticket record and file path references to trigger regeneration
		// Actually, we'll just let GenerateTicket handle the update or we can manually delete and recreate.
		// Let's delete the old ticket so GenerateTicket creates a fresh one with new user data in PDF.
		if err := tx.Where("registration_id = ?", registration.ID).Delete(&domain.Ticket{}).Error; err != nil {
			return fmt.Errorf("failed to clear old ticket: %w", err)
		}

		// Regenerate PDF for the new owner
		_, err := s.TicketService.GenerateTicket(tx, registration.ID)
		if err != nil {
			return fmt.Errorf("failed to regenerate ticket for recipient: %w", err)
		}

		// Audit Log
		audit := domain.AuditLog{
			ID:         uuid.New(),
			UserID:     senderID,
			Action:     "TRANSFER_TICKET",
			EntityType: "registration",
			EntityID:   registration.ID,
			OldValues:  fmt.Sprintf(`{"user_id": "%s"}`, oldUserID),
			NewValues:  fmt.Sprintf(`{"user_id": "%s", "recipient_email": "%s"}`, recipient.ID, recipientEmail),
			CreatedAt:  time.Now(),
		}
		if err := tx.Create(&audit).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return err
	}

	// Async email notifications
	s.Pool.Submit(worker.Task{
		Type: worker.TaskReminder,
		Payload: map[string]interface{}{
			"email":           recipientEmail,
			"registration_id": registrationID.String(),
			"event_title":     "Transferred Ticket",
		},
		Callback: func(t worker.Task) error {
			return s.EmailService.SendTicketEmail(
				t.Payload["email"].(string),
				t.Payload["registration_id"].(string),
				t.Payload["event_title"].(string),
			)
		},
	})

	return nil
}

func (s *RegistrationService) CancelRegistration(userID uuid.UUID, registrationID uuid.UUID) error {
	return s.DB.Transaction(func(tx *gorm.DB) error {
		var registration domain.Registration
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&registration, "id = ? AND user_id = ?", registrationID, userID).Error; err != nil {
			return errors.New("registration not found")
		}

		if registration.Status == domain.RegistrationCancelled {
			return errors.New("registration already cancelled")
		}

		var event domain.Event
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&event, "id = ?", registration.EventID).Error; err != nil {
			return errors.New("event not found")
		}

		// Update status
		registration.Status = domain.RegistrationCancelled
		if err := tx.Save(&registration).Error; err != nil {
			return err
		}

		// Return seat to pools
		event.RemainingTickets++
		if err := tx.Save(&event).Error; err != nil {
			return err
		}

		var ticketType domain.TicketType
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&ticketType, "id = ?", registration.TicketTypeID).Error; err == nil {
			ticketType.RemainingTickets++
			if err := tx.Save(&ticketType).Error; err != nil {
				return err
			}
		}

		// Audit Log
		audit := domain.AuditLog{
			ID:         uuid.New(),
			UserID:     userID,
			Action:     "CANCEL_REGISTRATION",
			EntityType: "registration",
			EntityID:   registration.ID,
			NewValues:  `{"status": "cancelled"}`,
			CreatedAt:  time.Now(),
		}
		if err := tx.Create(&audit).Error; err != nil {
			return err
		}

		return nil
	})
}

func (s *RegistrationService) GetEventAttendees(eventID uuid.UUID) ([]domain.User, error) {
	var users []domain.User
	err := s.DB.Model(&domain.User{}).
		Joins("JOIN registrations ON registrations.user_id = users.id").
		Where("registrations.event_id = ? AND registrations.status = ?", eventID, domain.RegistrationConfirmed).
		Find(&users).Error
	return users, err
}

func (s *RegistrationService) UpdateRSVP(userID uuid.UUID, registrationID uuid.UUID, status domain.RegistrationStatus) error {
	return s.DB.Model(&domain.Registration{}).
		Where("id = ? AND user_id = ?", registrationID, userID).
		Update("status", status).Error
}
