package main

import (
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/username/event-ticketing-system/internal/config"
	"github.com/username/event-ticketing-system/internal/domain"
	"github.com/username/event-ticketing-system/internal/repository"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func main() {
	cfg := config.LoadConfig()
	db := repository.InitDB(cfg)

	log.Println("Starting database seeding...")

	// 1. Seed Users
	users := seedUsers(db)
	log.Printf("Seeded %d users\n", len(users))

	// 2. Seed Events and Ticket Types
	events := seedEvents(db)
	log.Printf("Seeded %d events\n", len(events))

	// 3. Seed Registrations and Tickets
	seedRegistrations(db, users, events)
	log.Println("Seeded registrations and tickets")

	log.Println("Database seeding completed successfully!")
}

func seedUsers(db *gorm.DB) []domain.User {
	password := "Password123!"
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)

	users := []domain.User{
		{
			ID:           uuid.New(),
			Email:        "admin@event-system.com",
			Name:         "Admin User",
			PasswordHash: string(hashedPassword),
			Role:         domain.RoleAdmin,
		},
		{
			ID:           uuid.New(),
			Email:        "sarah.doe@example.com",
			Name:         "Sarah Doe",
			PasswordHash: string(hashedPassword),
			Role:         domain.RoleUser,
		},
		{
			ID:           uuid.New(),
			Email:        "john.smith@example.com",
			Name:         "John Smith",
			PasswordHash: string(hashedPassword),
			Role:         domain.RoleUser,
		},
		{
			ID:           uuid.New(),
			Email:        "emily.jones@example.com",
			Name:         "Emily Jones",
			PasswordHash: string(hashedPassword),
			Role:         domain.RoleUser,
		},
		{
			ID:           uuid.New(),
			Email:        "michael.brown@example.com",
			Name:         "Michael Brown",
			PasswordHash: string(hashedPassword),
			Role:         domain.RoleUser,
		},
	}

	for _, u := range users {
		var existing domain.User
		if err := db.Where("email = ?", u.Email).First(&existing).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				db.Create(&u)
			}
		}
	}

	var allUsers []domain.User
	db.Find(&allUsers)
	return allUsers
}

func seedEvents(db *gorm.DB) []domain.Event {
	eventsData := []struct {
		Title       string
		Description string
		Category    string
		Price       float64
		Tickets     int
		ImageURL    string
	}{
		{"Global Tech Summit 2026", "Leading technology conference exploring AI and Future Tech.", "Tech Conference", 299.0, 500, "https://images.unsplash.com/photo-1540575861501-7ad060e39fe5?auto=format&fit=crop&w=800&q=80"},
		{"Jazz Under the Stars", "A magical evening of live jazz music in the central park.", "Concert", 45.0, 200, "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=800&q=80"},
		{"Entrepreneurship Workshop", "Hands-on workshop for aspiring startup founders.", "Workshop", 150.0, 50, "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=800&q=80"},
		{"Modern Art Exhibition", "Showcasing works from contemporary artists worldwide.", "Art", 25.0, 300, "https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&w=800&q=80"},
		{"City Marathon 2026", "The annual city marathon for professional and amateur runners.", "Sports", 60.0, 1000, "https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&w=800&q=80"},
		{"Cloud Native Day", "Deep dive into Kubernetes and Cloud Native technologies.", "Conference", 199.0, 150, "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80"},
		{"Rock Festival Weekend", "Three days of non-stop rock music from top bands.", "Concert", 120.0, 5000, "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80"},
		{"Digital Marketing Masterclass", "Learn the latest trends in SEO, SEM, and social media.", "Workshop", 250.0, 100, "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80"},
		{"Photography Workshop", "Master the art of landscape and portrait photography.", "Workshop", 80.0, 30, "https://images.unsplash.com/photo-1452784444945-3f422708bcea?auto=format&fit=crop&w=800&q=80"},
		{"Final Cup Basketball", "The championship final of the national basketball league.", "Sports", 95.0, 20000, "https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&w=800&q=80"},
		{"AI Builders Hackathon", "48-hour challenge to build innovative AI solutions.", "Hackathon", 0.0, 100, "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80"},
		{"Frontend Developers Meetup", "Networking and lightning talks for the local frontend community.", "Meetup", 0.0, 60, "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=800&q=80"},
		{"Blockchain Innovators Summit", "Exploring the next generation of decentralized applications.", "Conference", 350.0, 250, "https://images.unsplash.com/photo-1516245834210-c4c142787335?auto=format&fit=crop&w=800&q=80"},
		{"Salsa Night Carnival", "Dance, music, and food celebrating Latin culture.", "Concert", 35.0, 500, "https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?auto=format&fit=crop&w=800&q=80"},
		{"Backend Performance Workshop", "Optimization techniques for high-scale Go applications.", "Workshop", 180.0, 40, "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=800&q=80"},
		{"Startup Networking Mixer", "Connect with investors and fellow entrepreneurs in a casual setting.", "Meetup", 15.0, 150, "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=800&q=80"},
		{"Game Dev Hackathon", "Create a playable game prototype in a weekend.", "Hackathon", 10.0, 80, "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80"},
		{"Open Source Contributor Day", "Workshop and mentoring for new open source contributors.", "Workshop", 0.0, 50, "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=800&q=80"},
		{"Cybersecurity Forum 2026", "Protecting digital assets in an increasingly connected world.", "Conference", 450.0, 200, "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80"},
		{"Python Community Meetup", "Share projects and learn from fellow Pythonistas.", "Meetup", 0.0, 100, "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=800&q=80"},
	}

	var seededEvents []domain.Event

	for i, ed := range eventsData {
		var existing domain.Event
		if err := db.Where("title = ?", ed.Title).First(&existing).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				// Create new event
				e := domain.Event{
					ID:               uuid.New(),
					Title:            ed.Title,
					Description:      ed.Description,
					Category:         ed.Category,
					Status:           domain.StatusPublished,
					StartTime:        time.Now().AddDate(0, 0, (i+1)*10), // Future dates
					TotalTickets:     ed.Tickets,
					RemainingTickets: ed.Tickets,
					Price:            ed.Price,
					ImageURL:         ed.ImageURL,
				}
				db.Create(&e)

				// Create Ticket Types
				ttVIP := domain.TicketType{
					ID:               uuid.New(),
					EventID:          e.ID,
					Name:             "VIP",
					Price:            e.Price * 2.5,
					Capacity:         int(float64(ed.Tickets) * 0.1),
					RemainingTickets: int(float64(ed.Tickets) * 0.1),
				}
				ttRegular := domain.TicketType{
					ID:               uuid.New(),
					EventID:          e.ID,
					Name:             "Regular",
					Price:            e.Price,
					Capacity:         int(float64(ed.Tickets) * 0.9),
					RemainingTickets: int(float64(ed.Tickets) * 0.9),
				}
				db.Create(&ttVIP)
				db.Create(&ttRegular)

				e.TicketTypes = []domain.TicketType{ttVIP, ttRegular}
				seededEvents = append(seededEvents, e)
			}
		} else {
			// Update existing event's ImageURL
			db.Model(&existing).Update("image_url", ed.ImageURL)
			seededEvents = append(seededEvents, existing)
		}
	}

	return seededEvents
}

func seedRegistrations(db *gorm.DB, users []domain.User, events []domain.Event) {
	for i, u := range users {
		if u.Role == domain.RoleAdmin {
			continue
		}

		// Each user registers for 2 random events
		event1 := events[i%len(events)]
		event2 := events[(i+1)%len(events)]

		registerUserForEvent(db, u, event1)
		registerUserForEvent(db, u, event2)
	}
}

func registerUserForEvent(db *gorm.DB, user domain.User, event domain.Event) {
	var tt domain.TicketType
	db.Where("event_id = ? AND name = ?", event.ID, "Regular").First(&tt)

	var existing domain.Registration
	if err := db.Where("user_id = ? AND event_id = ?", user.ID, event.ID).First(&existing).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			reg := domain.Registration{
				ID:           uuid.New(),
				UserID:       user.ID,
				EventID:      event.ID,
				TicketTypeID: tt.ID,
				Status:       domain.RegistrationConfirmed,
			}
			db.Create(&reg)

			// Create Ticket
			ticket := domain.Ticket{
				ID:             uuid.New(),
				RegistrationID: reg.ID,
				TicketCode:     fmt.Sprintf("TICK-%s-%s", event.ID.String()[:4], user.ID.String()[:4]),
				QRCodeURL:      fmt.Sprintf("/tickets/%s/qr.png", reg.ID),
				PdfURL:         fmt.Sprintf("/tickets/%s/ticket.pdf", reg.ID),
			}
			db.Create(&ticket)

			// Update remaining tickets (simplified)
			db.Model(&event).Update("remaining_tickets", event.RemainingTickets-1)
			db.Model(&tt).Update("remaining_tickets", tt.RemainingTickets-1)

			// Seed Audit Log
			audit := domain.AuditLog{
				ID:         uuid.New(),
				UserID:     user.ID,
				Action:     "EVENT_REGISTRATION",
				EntityType: "registration",
				EntityID:   reg.ID,
				CreatedAt:  time.Now(),
			}
			db.Create(&audit)
		}
	}
}
