# System Validation Guide

This guide provides step-by-step instructions to validate the production-ready Event Registration and Ticketing System.

## 1. Local Setup
1. **Clone the repository**: Ensure you are in the project root.
2. **Install dependencies**:
   ```bash
   go mod download
   ```
3. **Build the application**:
   ```bash
   make build
   ```

## 2. Environment Configuration
Create a `.env` file in the root directory based on `.env.example`:
```ini
PORT=8080
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=event_ticketing
DB_SSLMODE=disable

JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRY_HOURS=24

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

## 3. Database Migrations
The application uses GORM's Auto-Migration feature. To set up your database:
1. Ensure PostgreSQL is running and the database `event_ticketing` exists.
2. Run the application; it will automatically create the tables and indexes:
   ```bash
   make run
   ```
3. (Optional) For formal schema reference, see `internal/repository/schema.sql`.

## 4. Sample API Requests
You can use `curl` or Postman.

### A. Register a User
```bash
curl -X POST http://localhost:8080/api/auth/register \
-H "Content-Type: application/json" \
-d '{"email": "user@example.com", "password": "password123"}'
```

### B. Login (Get Token)
```bash
curl -X POST http://localhost:8080/api/auth/login \
-H "Content-Type: application/json" \
-d '{"email": "user@example.com", "password": "password123"}'
# Copy the token from the response
```

### C. Create an Event (Admin only)
*Note: You may need to manually update your user role to 'admin' in the database for this.*
```bash
curl -X POST http://localhost:8080/api/admin/events \
-H "Authorization: Bearer <YOUR_TOKEN>" \
-H "Content-Type: application/json" \
-d '{"title": "Rock Concert", "total_tickets": 100, "price": 50.0}'
```

---

## 5. Testing Concurrency Booking
To verify that the system prevents overbooking:
1. Create an event with only **1 ticket** left.
2. Run a load testing tool (like `ab` or `k6`) or a simple script to send **10 simultaneous registration requests**.
3. **Expected Result**: Only 1 request should succeed (201 Created), and the other 9 should receive a "no tickets available" error (500 Internal Server Error).
4. Verify the `registrations` table has only 1 entry for that event.

## 6. Testing Email Notifications
1. Ensure your `.env` has valid SMTP credentials (use an App Password for Gmail).
2. Register for an event.
3. Check the console logs. Even if SMTP is not configured, the logger will output:
   `INFO: Sending email {"to": "user@example.com", ...}`
4. This confirms the asynchronous notification worker is triggered in the background.

## 7. Known Limitations & Assumptions
- **Database**: Assumes PostgreSQL 12+.
- **QR Codes**: QR codes are currently simulated as console output or generated local data strings; in production, these should be uploaded to S3/GCS.
- **Email**: The email service is a skeleton integration. For production, replace `pkg/email` logic with a real SMTP client or API (SendGrid/Mailgun).
- **Audit Logs**: Current implementation logs basic state changes as JSONB, which is efficient but requires SQL knowledge to query meaningfully.
