package pdf

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/jung-kurt/gofpdf"
)

type TicketData struct {
	TicketCode       string
	TicketType       string
	EventName        string
	EventDescription string
	EventTime        string
	Price            string
	UserEmail        string
	QRBytes          []byte
}

func GenerateTicketPDF(data TicketData) (string, error) {
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.AddPage()

	// Margin and Border
	pdf.SetMargins(15, 15, 15)
	pdf.SetFillColor(240, 240, 240)
	pdf.Rect(10, 10, 190, 120, "D") // Main ticket box

	// Header - Event Name
	pdf.SetFont("Arial", "B", 24)
	pdf.SetTextColor(0, 51, 102) // Dark Blue
	pdf.CellFormat(0, 20, data.EventName, "", 1, "C", false, 0, "")

	// Separator Line
	pdf.SetDrawColor(0, 51, 102)
	pdf.Line(20, 32, 190, 32)
	pdf.Ln(10)

	// Ticket Details
	pdf.SetTextColor(0, 0, 0)
	pdf.SetFont("Arial", "B", 12)
	pdf.Cell(40, 10, "Date & Time:")
	pdf.SetFont("Arial", "", 12)
	pdf.Cell(0, 10, data.EventTime)
	pdf.Ln(8)

	pdf.SetFont("Arial", "B", 12)
	pdf.Cell(40, 10, "Attendee:")
	pdf.SetFont("Arial", "", 12)
	pdf.Cell(0, 10, data.UserEmail)
	pdf.Ln(8)

	pdf.SetFont("Arial", "B", 12)
	pdf.Cell(40, 10, "Ticket Type:")
	pdf.SetFont("Arial", "", 12)
	pdf.Cell(0, 10, data.TicketType)
	pdf.Ln(8)

	pdf.SetFont("Arial", "B", 12)
	pdf.Cell(40, 10, "Price:")
	pdf.SetFont("Arial", "", 12)
	pdf.Cell(0, 10, data.Price)
	pdf.Ln(8)

	pdf.SetFont("Arial", "B", 12)
	pdf.Cell(40, 10, "Ticket Code:")
	pdf.SetFont("Arial", "", 12)
	pdf.Cell(0, 10, data.TicketCode)
	pdf.Ln(12)

	// Description (Multi-line)
	pdf.SetFont("Arial", "I", 10)
	pdf.SetTextColor(100, 100, 100)
	pdf.MultiCell(120, 5, data.EventDescription, "", "L", false)

	// QR Code Position
	pdf.SetY(45)
	pdf.SetX(150)

	// Write QR bytes to a temp file
	qrPath := filepath.Join(os.TempDir(), fmt.Sprintf("qr_%s.png", data.TicketCode))
	if err := os.WriteFile(qrPath, data.QRBytes, 0644); err != nil {
		return "", fmt.Errorf("failed to write temp QR: %w", err)
	}
	defer os.Remove(qrPath)

	imageOptions := gofpdf.ImageOptions{ImageType: "PNG", ReadDpi: true}
	pdf.ImageOptions(qrPath, 145, 45, 45, 45, false, imageOptions, 0, "")

	// Save PDF
	fileName := fmt.Sprintf("ticket_%s.pdf", data.TicketCode)
	outputPath := filepath.Join("tmp", "tickets", fileName)

	// Ensure directory exists
	if err := os.MkdirAll(filepath.Dir(outputPath), 0755); err != nil {
		return "", err
	}

	err := pdf.OutputFileAndClose(outputPath)
	if err != nil {
		return "", fmt.Errorf("failed to save PDF: %w", err)
	}

	return outputPath, nil
}
