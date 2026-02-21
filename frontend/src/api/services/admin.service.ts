import { apiClient, APIResponse } from '../client';
import { EventStats, SystemStats, Attendee } from '../types';

export const adminService = {
    /**
     * Get per-event analytics (tickets sold, revenue, status).
     */
    getAnalytics() {
        return apiClient.get<APIResponse<EventStats[]>>('/admin/analytics');
    },

    /**
     * Get high-level system-wide statistics.
     */
    getAnalyticsSummary() {
        return apiClient.get<APIResponse<SystemStats>>('/admin/analytics/summary');
    },

    /**
     * List confirmed attendees for a specific event.
     */
    getAttendees(eventId: string) {
        return apiClient.get<APIResponse<Attendee[]>>(`/admin/events/${eventId}/attendees`);
    },
};
