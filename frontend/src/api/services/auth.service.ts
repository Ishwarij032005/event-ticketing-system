import { apiClient, APIResponse } from '../client';
import {
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
} from '../types';

export const authService = {
    /**
     * Authenticate with email + password.
     * Returns a JWT token on success.
     */
    login(body: LoginRequest) {
        return apiClient.post<APIResponse<LoginResponse>>('/auth/login', body);
    },

    /**
     * Create a new user account.
     */
    register(body: RegisterRequest) {
        return apiClient.post<APIResponse>('/auth/register', body);
    },

    /**
     * Send a password-reset link to the given email.
     */
    forgotPassword(body: ForgotPasswordRequest) {
        return apiClient.post<APIResponse>('/auth/forgot-password', body);
    },

    /**
     * Complete password reset using the token from the email link.
     */
    resetPassword(body: ResetPasswordRequest) {
        return apiClient.post<APIResponse>('/auth/reset-password', body);
    },
};
