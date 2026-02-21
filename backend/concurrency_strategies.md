# Concurrency-Safe Booking Strategies in Go

To prevent overbooking in a ticketing system, you must ensure that checking for available seats and decrementing the count is an **atomic operation**. Here are the two primary ways to achieve this.

## 1. Database Transactions (Pessimistic Locking)
This is the **production-ready** approach for distributed systems. It uses the database's locking mechanism (`SELECT ... FOR UPDATE`) to lock the specific event row during the transaction.

### Advantages:
- Works across multiple server instances (distributed locking).
- Handles server crashes gracefully (database releases locks on connection loss).

### Implementation (GORM):
```go
func (s *RegistrationService) Register(userID uuid.UUID, eventID uuid.UUID) error {
    return s.DB.Transaction(func(tx *gorm.DB) error {
        var event domain.Event
        
        // 1. SELECT ... FOR UPDATE: Locks the row for this transaction
        if err := tx.Set("gorm:query_option", "FOR UPDATE").First(&event, "id = ?", eventID).Error; err != nil {
            return errors.New("event not found")
        }

        // 2. Check availability
        if event.RemainingTickets <= 0 {
            return errors.New("no tickets available")
        }

        // 3. Update count
        event.RemainingTickets--
        if err := tx.Save(&event).Error; err != nil {
            return err
        }

        // 4. Create registration record
        // ... (remaining logic)
        return nil
    })
}
```

---

## 2. Mutex Locking (In-Memory)
This approach uses a Go `sync.Mutex` or `sync.RWMutex`. It is suitable for single-instance monoliths or when the scale is small.

### Disadvantages:
- **Does not work** across multiple server instances (each instance has its own memory).
- Causes bottlenecks if a single global mutex is used for all events.

### Implementation:
```go
import "sync"

type BookingService struct {
    mu sync.Mutex // A global mutex (not recommended) or a map of mutexes per event
}

func (s *BookingService) Register(userID uuid.UUID, eventID uuid.UUID) error {
    s.mu.Lock()         // Lock everyone out 
    defer s.mu.Unlock() // Ensure it unlocks even on panic

    // Perform database check and update here
    // ...
}
```

> [!TIP]
> Always prefer **Database Transactions** for systems where data integrity is critical and scalability (running multiple containers/servers) is expected.
