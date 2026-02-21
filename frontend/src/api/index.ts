/**
 * Central barrel export for the API service layer.
 *
 * Usage:
 *   import { authService, eventsService, registrationsService, adminService } from '@/api';
 *   import type { Event, Registration, LoginRequest } from '@/api';
 */

// HTTP client & env config
export { apiClient, AUTH_EXPIRED_EVENT } from './client';
export type { APIResponse } from './client';
export { env } from '@/config/env';

// Domain services
export { authService } from './services/auth.service';
export { eventsService, adminEventsService } from './services/events.service';
export { registrationsService } from './services/registrations.service';
export { adminService } from './services/admin.service';

// Shared types — re-exported so callers only need one import path
export type {
    // Auth
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    // Events
    Event,
    EventListParams,
    CreateEventRequest,
    UpdateEventRequest,
    TicketType,
    // Registrations
    Registration,
    CreateRegistrationRequest,
    // Admin
    EventStats,
    SystemStats,
    Attendee,
} from './types';
