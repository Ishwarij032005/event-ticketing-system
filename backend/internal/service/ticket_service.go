package service

import (
	"fmt"

	"github.com/google/uuid"
	"github.com/username/event-ticketing-system/internal/domain"
	"github.com/username/event-ticketing-system/pkg/pdf"
	"github.com/username/event-ticketing-system/pkg/qr"
	"gorm.io/gorm"
)

type TicketService struct {
	DB *gorm.DB
}

func NewTicketService(db *gorm.DB) *TicketService {
	return &TicketService{DB: db}
}

func (s *TicketService) GenerateTicket(tx *gorm.DB, registrationID uuid.UUID) (*domain.Ticket, error) {
	if tx == nil {
		tx = s.DB
	}

	// Fetch registration with preloaded User, Event and TicketType
	var reg domain.Registration
	if err := tx.Preload("User").Preload("Event").Preload("TicketType").First(&reg, "id = ?", registrationID).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch registration: %w", err)
	}

	ticketCode := fmt.Sprintf("E-%s-%s", uuid.New().String()[:4], uuid.New().String()[:8])

	// Generate QR Code
	qrContent := fmt.Sprintf("https://tkt.system/v1/verify/%s", ticketCode)
	qrBytes, err := qr.GenerateQRCode(qrContent)
	if err != nil {
		return nil, fmt.Errorf("failed to generate QR code: %w", err)
	}

	// Generate PDF
	_, err = pdf.GenerateTicketPDF(pdf.TicketData{
		TicketCode:       ticketCode,
		TicketType:       reg.TicketType.Name,
		EventName:        reg.Event.Title,
		EventDescription: reg.Event.Description,
		EventTime:        reg.Event.StartTime.Format("Jan 02, 2006 15:04 MST"),
		Price:            fmt.Sprintf("%.2f", reg.TicketType.Price),
		UserEmail:        reg.User.Email,
		QRBytes:          qrBytes,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to generate PDF: %w", err)
	}

	ticket := &domain.Ticket{
		ID:             uuid.New(),
		RegistrationID: registrationID,
		TicketCode:     ticketCode,
		QRCodeURL:      qrContent, // Placeholder URL for verification
		PdfURL:         fmt.Sprintf("/tickets/ticket_%s.pdf", ticketCode),
	}

	if err := tx.Create(ticket).Error; err != nil {
		return nil, err
	}

	return ticket, nil
}
