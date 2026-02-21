# JWT Authentication & RBAC Middleware

This document explains the security architecture implemented for the Event Registration system, focusing on JWT and Role-Based Access Control (RBAC).

## 1. JWT Implementation
The system uses the `golang-jwt/jwt/v5` package for secure token generation and parsing.

### Token Generation
The `GenerateJWT` utility creates a token containing the `user_id`, `role`, and expiration time.
- **Location**: [jwt.go](file:///d:/Projects/WEB/event-ticketing-system/pkg/utils/jwt.go)

### Authentication Middleware
The `AuthMiddleware` verifies the `Authorization: Bearer <token>` header on every protected request.
- **Validates**: Token signature against the `JWT_SECRET`.
- **Exposes**: `user_id` and `role` to subsequent handlers via the Gin context.
- **Location**: [auth.go](file:///d:/Projects/WEB/event-ticketing-system/internal/api/middleware/auth.go#14-55)

## 2. RBAC Implementation
Role-Based Access Control is enforced through a secondary middleware that checks the role extracted by the `AuthMiddleware`.

### Roles
Defined in [models.go](file:///d:/Projects/WEB/event-ticketing-system/internal/domain/models.go):
- `admin`: Full access to create/update/delete events and view analytics.
- `user`: Standard registration and profile access.

### Usage
In [main.go](file:///d:/Projects/WEB/event-ticketing-system/cmd/api/main.go), routes are grouped and protected by role:

```go
// User protected routes
user := api.Group("/")
user.Use(middleware.AuthMiddleware(cfg))
{
    user.POST("/registrations", rh.RegisterForEvent)
}

// Admin protected routes
admin := api.Group("/admin")
admin.Use(middleware.AuthMiddleware(cfg), middleware.RBACMiddleware(domain.RoleAdmin))
{
    admin.POST("/events", eh.CreateEvent)
    // ...
}
```

## 3. Security Best Practices Included
- **HMAC-SHA256**: Strong cryptographic signing.
- **Token Expiry**: Configurable expiry via `.env`.
- **Context Injection**: Safe propagation of user identity across the request lifecycle.
- **Role Scoping**: Granular control over administrative actions.
