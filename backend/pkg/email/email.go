package email

import (
	"bytes"
	"fmt"
	"html/template"
	"net/smtp"

	"github.com/username/event-ticketing-system/pkg/utils"
	"go.uber.org/zap"
)

type EmailService interface {
	SendTicketEmail(to, ticketCode, eventName string) error
	SendPasswordResetEmail(to, resetURL string) error
}

type smtpEmailService struct {
	Host     string
	Port     string
	User     string
	Password string
	From     string
}

func NewEmailService(host, port, user, password, from string) EmailService {
	return &smtpEmailService{
		Host:     host,
		Port:     port,
		User:     user,
		Password: password,
		From:     from,
	}
}

func (s *smtpEmailService) sendHTML(to, subject, body string) error {
	addr := fmt.Sprintf("%s:%s", s.Host, s.Port)
	auth := smtp.PlainAuth("", s.User, s.Password, s.Host)

	header := make(map[string]string)
	header["From"] = s.From
	header["To"] = to
	header["Subject"] = subject
	header["MIME-Version"] = "1.0"
	header["Content-Type"] = "text/html; charset=\"utf-8\""

	message := ""
	for k, v := range header {
		message += fmt.Sprintf("%s: %s\r\n", k, v)
	}
	message += "\r\n" + body

	err := smtp.SendMail(addr, auth, s.From, []string{to}, []byte(message))
	if err != nil {
		utils.Logger.Error("Failed to send email",
			zap.String("to", to),
			zap.Error(err),
		)
		return err
	}

	utils.Logger.Info("Email sent successfully", zap.String("to", to), zap.String("subject", subject))
	return nil
}

func (s *smtpEmailService) SendTicketEmail(to, ticketCode, eventName string) error {
	tmpl, err := template.New("ticket").Parse(ticketEmailTemplate)
	if err != nil {
		return err
	}

	var body bytes.Buffer
	data := struct {
		EventName  string
		TicketCode string
	}{
		EventName:  eventName,
		TicketCode: ticketCode,
	}

	if err := tmpl.Execute(&body, data); err != nil {
		return err
	}

	return s.sendHTML(to, "Your Ticket Confirmation - "+eventName, body.String())
}

func (s *smtpEmailService) SendPasswordResetEmail(to, resetURL string) error {
	tmpl, err := template.New("reset").Parse(passwordResetTemplate)
	if err != nil {
		return err
	}

	var body bytes.Buffer
	data := struct {
		ResetURL string
	}{
		ResetURL: resetURL,
	}

	if err := tmpl.Execute(&body, data); err != nil {
		return err
	}

	return s.sendHTML(to, "Password Reset Request", body.String())
}
