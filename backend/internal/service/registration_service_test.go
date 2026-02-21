package service

import (
	"context"
	"regexp"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/google/uuid"
	"github.com/username/event-ticketing-system/internal/worker"
	"github.com/username/event-ticketing-system/pkg/email"
	"github.com/username/event-ticketing-system/pkg/utils"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func TestRegistrationService_Register_Success(t *testing.T) {
	// Initialize Logger for test to prevent nil pointer in async workers
	utils.InitLogger()

	// Setup sqlmock
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to open sqlmock: %s", err)
	}
	defer db.Close()

	gormDB, err := gorm.Open(postgres.New(postgres.Config{
		Conn: db,
	}), &gorm.Config{
		SkipDefaultTransaction: true,
	})
	if err != nil {
		t.Fatalf("failed to open gorm: %s", err)
	}

	// Mock Services
	pool := worker.NewWorkerPool(1, 10)
	pool.Start(context.Background())
	defer pool.Shutdown()

	ts := NewTicketService(gormDB)
	es := email.NewEmailService("smtp.test.com", "587", "user", "pass", "test@test.com")
	svc := NewRegistrationService(gormDB, ts, es, pool)

	userID := uuid.New()
	eventID := uuid.New()
	ticketTypeID := uuid.New()
	eventTitle := "Test Event"
	ticketTypeName := "VIP"

	// Expectations
	// 1. Fetch User (now at start of Register)
	mock.ExpectQuery(`SELECT \* FROM "users" WHERE id = \$1 AND "users"\."deleted_at" IS NULL ORDER BY "users"\."id" LIMIT \$2`).
		WithArgs(userID, 1).
		WillReturnRows(sqlmock.NewRows([]string{"id", "email"}).AddRow(userID, "user@test.com"))

	mock.ExpectBegin()

	// 2. Fetch Event with Lock
	mock.ExpectQuery(`SELECT \* FROM "events" WHERE id = \$1 AND "events"\."deleted_at" IS NULL ORDER BY "events"\."id" LIMIT \$2 FOR UPDATE`).
		WithArgs(eventID, 1).
		WillReturnRows(sqlmock.NewRows([]string{"id", "title", "status", "remaining_tickets", "total_tickets"}).
			AddRow(eventID, eventTitle, "published", 10, 10))

	// 3. Fetch TicketType with Lock
	mock.ExpectQuery(`SELECT \* FROM "ticket_types"`).
		WithArgs(ticketTypeID, eventID, 1).
		WillReturnRows(sqlmock.NewRows([]string{"id", "event_id", "name", "price", "remaining_tickets"}).
			AddRow(ticketTypeID, eventID, ticketTypeName, 100.0, 5))

	// 4. Update TicketType
	mock.ExpectExec(regexp.QuoteMeta(`UPDATE "ticket_types"`)).
		WillReturnResult(sqlmock.NewResult(1, 1))

	// 5. Update Event
	mock.ExpectExec(regexp.QuoteMeta(`UPDATE "events"`)).
		WillReturnResult(sqlmock.NewResult(1, 1))

	// 6. Create Registration
	mock.ExpectQuery(regexp.QuoteMeta(`INSERT INTO "registrations"`)).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(uuid.New()))

	// 7. TicketService.GenerateTicket Preloads
	mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "registrations"`)).
		WithArgs(sqlmock.AnyArg(), 1).
		WillReturnRows(sqlmock.NewRows([]string{"id", "user_id", "event_id", "ticket_type_id"}).AddRow(uuid.New(), userID, eventID, ticketTypeID))

	// Preload Event
	mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "events" WHERE "events"."id" = $1 AND "events"."deleted_at" IS NULL`)).
		WithArgs(eventID).
		WillReturnRows(sqlmock.NewRows([]string{"id", "title", "category", "status"}).AddRow(eventID, eventTitle, "", "published"))

	// Preload TicketType
	mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "ticket_types" WHERE "ticket_types"."id" = $1 AND "ticket_types"."deleted_at" IS NULL`)).
		WithArgs(ticketTypeID).
		WillReturnRows(sqlmock.NewRows([]string{"id", "name", "price"}).AddRow(ticketTypeID, ticketTypeName, 100.0))

	// Preload User
	mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "users" WHERE "users"."id" = $1 AND "users"."deleted_at" IS NULL`)).
		WithArgs(userID).
		WillReturnRows(sqlmock.NewRows([]string{"id", "email"}).AddRow(userID, "user@test.com"))

	// 8. Create Ticket
	mock.ExpectQuery(regexp.QuoteMeta(`INSERT INTO "tickets"`)).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(uuid.New()))

	// 9. Create Audit Log
	mock.ExpectQuery(regexp.QuoteMeta(`INSERT INTO "audit_logs"`)).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(uuid.New()))

	mock.ExpectCommit()

	// Fetch Event for email capture
	mock.ExpectQuery(`SELECT \* FROM "events" WHERE id = \$1 AND "events"\."deleted_at" IS NULL ORDER BY "events"\."id" LIMIT \$2`).
		WithArgs(eventID, 1).
		WillReturnRows(sqlmock.NewRows([]string{"id", "title", "category", "status"}).AddRow(eventID, eventTitle, "", "published"))

	// Execute
	reg, err := svc.Register(userID, eventID, ticketTypeID)

	// Assert
	if err != nil {
		t.Errorf("Unexpected error: %s", err)
	}
	if reg == nil {
		t.Error("Expected registration to be returned")
	}

	// Wait for async email goroutine
	time.Sleep(100 * time.Millisecond)

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("Expectations were not met: %s", err)
	}
}
