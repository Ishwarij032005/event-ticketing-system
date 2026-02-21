import { apiClient, APIResponse } from '../client';
import { Registration, CreateRegistrationRequest } from '../types';

export const registrationsService = {
    /**
     * Get all registrations for the currently authenticated user.
     */
    getMyRegistrations() {
        return apiClient.get<APIResponse<Registration[]>>('/registrations/');
    },

    /**
     * Register the current user for an event.
     */
    create(body: CreateRegistrationRequest) {
        return apiClient.post<APIResponse<Registration>>('/registrations/', body);
    },

    /**
     * Cancel a registration by ID.
     */
    cancel(id: string) {
        return apiClient.delete<APIResponse>(`/registrations/${id}`);
    },

    /**
     * Update the RSVP status of a registration.
     * status: "rsvp_yes" | "rsvp_no" | "rsvp_maybe"
     */
    updateRsvp(id: string, status: 'rsvp_yes' | 'rsvp_no' | 'rsvp_maybe') {
        return apiClient.put<APIResponse<Registration>>(`/registrations/${id}/rsvp`, { status });
    },

    /**
     * Transfer a ticket to another user by email.
     */
    transfer(id: string, toEmail: string) {
        return apiClient.post<APIResponse>(`/registrations/${id}/transfer`, { to_email: toEmail });
    },
};
