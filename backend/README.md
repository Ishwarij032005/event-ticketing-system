# Event Registration and Ticketing System

A production-ready backend built with Go, Gin, and PostgreSQL.

## Features

- **Layered Architecture**: Clean separation of concerns.
- **Concurrency-Safe Registration**: Transactional locking with `FOR UPDATE`.
- **JWT & RBAC**: Secure authentication and role-based access.
- **Graceful Shutdown**: Safe exits with active request handling.
- **Analytics**: Revenue and registration statistics.
- **Registration Service**: QR code generation for reservations.

## Prerequisites

- Go 1.21+
- PostgreSQL

## Setup

1. **Clone and Install**:
   ```bash
   go mod download
   ```

2. **Environment**:
   ```bash
   cp .env.example .env
   # Update .env with your DB credentials
   ```

3. **Run**:
   ```bash
   go run cmd/api/main.go
   ```

## Development

Use the provided `Makefile` for common tasks:
- `make build`: Build the API binary.
- `make run`: Run the API.
- `make test`: Run unit tests.

## API Documentation

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | User registration | No |
| POST | `/api/auth/login` | User login | No |
| GET | `/api/events` | List events | No |
| POST | `/api/registrations` | Register for event | User |
| POST | `/api/admin/events` | Create event | Admin |
| GET | `/api/admin/analytics`| Revenue stats | Admin |
