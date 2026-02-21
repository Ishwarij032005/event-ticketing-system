package repository

import (
	"fmt"
	"log"

	"github.com/username/event-ticketing-system/internal/config"
	"github.com/username/event-ticketing-system/internal/domain"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func InitDB(cfg *config.Config) *gorm.DB {
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=%s",
		cfg.DBHost, cfg.DBUser, cfg.DBPassword, cfg.DBName, cfg.DBPort, cfg.DBSSLMode)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Auto Migration
	err = db.AutoMigrate(
		&domain.User{},
		&domain.Event{},
		&domain.Registration{},
		&domain.Ticket{},
		&domain.AuditLog{},
	)
	if err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	return db
}
