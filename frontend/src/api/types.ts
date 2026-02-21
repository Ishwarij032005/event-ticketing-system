/**
 * Shared API response wrapper — matches the backend's APIResponse struct.
 */
export interface APIResponse<T = unknown> {
    success: boolean;
    message?: string;
    data?: T;
    meta?: {
        total: number;
        page: number;
        limit: number;
        total_pages: number;
    };
    error?: string;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    /** Optional – backend accepts name field */
    name?: string;
    role?: 'user' | 'admin';
}

export interface LoginResponse {
    token: string;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ResetPasswordRequest {
    token: string;
    password: string;
}

// ─── Events ──────────────────────────────────────────────────────────────────

export interface TicketType {
    id: string;
    event_id: string;
    name: string;
    price: number;
    capacity: number;
    remaining_tickets: number;
}

export interface Event {
    id: string;
    title: string;
    description: string;
    category: string;
    location: string;
    start_time: string;
    end_time?: string;
    total_tickets: number;
    remaining_tickets: number;
    price: number;
    status: string;
    image_url?: string;
    ticket_types?: TicketType[];
}

export interface EventListParams {
    category?: string;
    q?: string;
    page?: number;
    limit?: number;
}

export interface CreateEventRequest {
    title: string;
    description: string;
    category: string;
    location?: string;
    start_time: string;
    end_time?: string;
    total_tickets: number;
    price: number;
    image_url?: string;
    status?: 'published' | 'draft';
}

export interface UpdateEventRequest extends Partial<CreateEventRequest> { }

// ─── Registrations ───────────────────────────────────────────────────────────

export interface TicketDetail {
    id: string;
    registration_id: string;
    ticket_code: string;
    qr_code_url: string;
    pdf_url: string;
}

export interface Registration {
    id: string;
    event_id: string;
    user_id: string;
    ticket_type_id?: string;
    status: string;
    created_at: string;
    event: Event;
    ticket_type?: TicketType;
    ticket?: TicketDetail;
}

export interface CreateRegistrationRequest {
    event_id: string;
    ticket_type_id?: string;
}

// ─── Admin Analytics ─────────────────────────────────────────────────────────

export interface EventStats {
    event_id: string;
    title: string;
    category?: string;
    total_bookings: number;
    revenue: number;
    tickets_remaining: number;
}

export interface SystemStats {
    total_registrations: number;
    occupancy_percentage: number;
    cancellation_rate: number;
}

// ─── Attendees ───────────────────────────────────────────────────────────────

export interface Attendee {
    id: string;
    email: string;
    role: string;
}
