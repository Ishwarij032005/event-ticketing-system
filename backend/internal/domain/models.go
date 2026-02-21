package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserRole string

const (
	RoleAdmin UserRole = "admin"
	RoleUser  UserRole = "user"
)

type User struct {
	ID                   uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Email                string    `gorm:"uniqueIndex;not null"`
	PasswordHash         string    `gorm:"not null"`
	Name                 string    `gorm:"type:string"`
	Role                 UserRole  `gorm:"type:string;default:user"`
	PasswordResetToken   string    `gorm:"type:string;index"`
	PasswordResetExpires time.Time `gorm:"type:timestamp"`
	CreatedAt            time.Time
	UpdatedAt            time.Time
	DeletedAt            gorm.DeletedAt `gorm:"index"`
}

type EventStatus string

const (
	StatusDraft     EventStatus = "draft"
	StatusPublished EventStatus = "published"
	StatusCancelled EventStatus = "cancelled"
)

type Event struct {
	ID               uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Title            string         `gorm:"not null" json:"title"`
	Description      string         `json:"description"`
	Category         string         `gorm:"type:string;index" json:"category"`
	Status           EventStatus    `gorm:"type:string;default:draft;index" json:"status"`
	StartTime        time.Time      `gorm:"not null" json:"start_time"`
	TotalTickets     int            `gorm:"not null" binding:"required,gt=0" json:"total_tickets"`
	RemainingTickets int            `gorm:"not null" json:"remaining_tickets"`
	Price            float64        `gorm:"not null" binding:"required,min=0" json:"price"`
	ImageURL         string         `json:"image_url"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"-"`
	TicketTypes      []TicketType   `gorm:"foreignKey:EventID" json:"ticket_types,omitempty"`
	ReminderSent     bool           `gorm:"default:false" json:"reminder_sent,omitempty"`
}

type TicketType struct {
	ID               uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	EventID          uuid.UUID      `gorm:"type:uuid;not null;index" json:"event_id"`
	Name             string         `gorm:"not null" json:"name"`
	Price            float64        `gorm:"not null" binding:"required,min=0" json:"price"`
	Capacity         int            `gorm:"not null" binding:"required,gt=0" json:"capacity"`
	RemainingTickets int            `gorm:"not null" json:"remaining_tickets"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"-"`
}

type RegistrationStatus string

const (
	RegistrationConfirmed RegistrationStatus = "confirmed"
	RegistrationCancelled RegistrationStatus = "cancelled"
	RegistrationRSVPYes   RegistrationStatus = "rsvp_yes"
	RegistrationRSVPNo    RegistrationStatus = "rsvp_no"
	RegistrationRSVPMaybe RegistrationStatus = "rsvp_maybe"
)

type Registration struct {
	ID           uuid.UUID          `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID       uuid.UUID          `gorm:"type:uuid;not null;index" json:"user_id"`
	EventID      uuid.UUID          `gorm:"type:uuid;not null;index" json:"event_id"`
	TicketTypeID uuid.UUID          `gorm:"type:uuid;not null;index" json:"ticket_type_id"`
	Status       RegistrationStatus `gorm:"type:string;default:confirmed" json:"status"`
	CreatedAt    time.Time          `json:"created_at"`
	UpdatedAt    time.Time          `json:"updated_at"`
	User         User               `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Event        Event              `gorm:"foreignKey:EventID" json:"event,omitempty"`
	TicketType   TicketType         `gorm:"foreignKey:TicketTypeID" json:"ticket_type,omitempty"`
	Ticket       *Ticket            `gorm:"foreignKey:RegistrationID" json:"ticket,omitempty"`
}

type Ticket struct {
	ID             uuid.UUID    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	RegistrationID uuid.UUID    `gorm:"type:uuid;not null;uniqueIndex" json:"registration_id"`
	TicketCode     string       `gorm:"uniqueIndex;not null" json:"ticket_code"`
	QRCodeURL      string       `json:"qr_code_url"`
	PdfURL         string       `json:"pdf_url"`
	CreatedAt      time.Time    `json:"created_at"`
	Registration   Registration `gorm:"foreignKey:RegistrationID" json:"registration,omitempty"`
}

type AuditLog struct {
	ID         uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID     uuid.UUID `gorm:"type:uuid;index"`
	Action     string    `gorm:"not null;index"`
	EntityType string    `gorm:"not null;index"`
	EntityID   uuid.UUID `gorm:"type:uuid;index"`
	OldValues  string    `gorm:"type:jsonb"`
	NewValues  string    `gorm:"type:jsonb"`
	CreatedAt  time.Time
}

func (a *AuditLog) BeforeCreate(tx *gorm.DB) (err error) {
	if a.OldValues == "" {
		a.OldValues = "{}"
	}
	if a.NewValues == "" {
		a.NewValues = "{}"
	}
	return
}

type Feedback struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	EventID   uuid.UUID `gorm:"type:uuid;not null;index"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index"`
	Rating    int       `gorm:"not null"`
	Comment   string
	CreatedAt time.Time
	User      User  `gorm:"foreignKey:UserID"`
	Event     Event `gorm:"foreignKey:EventID"`
}
