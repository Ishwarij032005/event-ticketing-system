import { apiClient, APIResponse } from '../client';
import {
    Event,
    EventListParams,
    CreateEventRequest,
    UpdateEventRequest,
    TicketType,
} from '../types';

export const eventsService = {
    /**
     * List all events, optionally filtered by category and/or search term.
     */
    list(params?: EventListParams) {
        return apiClient.get<APIResponse<Event[]>>('/events/', {
            category: params?.category,
            q: params?.q,
            page: params?.page,
            limit: params?.limit,
        });
    },

    /**
     * Fetch a single event by ID (includes ticket_types array).
     */
    get(id: string) {
        return apiClient.get<APIResponse<Event>>(`/events/${id}`);
    },

    /**
     * Get remaining seat count for an event.
     */
    getSeats(id: string) {
        return apiClient.get<APIResponse<{ remaining_seats: number }>>(`/events/${id}/seats`);
    },

    /**
     * Fetch available ticket types for an event.
     */
    getTicketTypes(id: string) {
        return apiClient.get<APIResponse<TicketType[]>>(`/events/${id}/ticket-types`);
    },
};

// ─── Admin event mutations ────────────────────────────────────────────────────

export const adminEventsService = {
    /**
     * Create a new event (admin only).
     */
    create(body: CreateEventRequest) {
        return apiClient.post<APIResponse<{ id: string }>>('/admin/events/', body);
    },

    /**
     * Update an existing event (admin only).
     */
    update(id: string, body: UpdateEventRequest) {
        return apiClient.put<APIResponse<Event>>(`/admin/events/${id}`, body);
    },

    /**
     * Delete an event (admin only).
     */
    delete(id: string) {
        return apiClient.delete<APIResponse>(`/admin/events/${id}`);
    },

    /**
     * Upload an event cover image (admin only).
     */
    uploadImage(file: File) {
        const formData = new FormData();
        formData.append('image', file);
        return apiClient.upload<APIResponse<{ url: string }>>('/admin/upload', formData);
    },
};
