/**
 * Environment configuration
 * All runtime config is read from Vite environment variables.
 * Set VITE_API_URL in your .env file (or .env.local for local dev).
 */
export const env = {
    /** Base URL for all API requests, e.g. http://localhost:8080/api/v1 */
    apiUrl: import.meta.env.VITE_API_URL as string || 'http://localhost:8080/api/v1',

    /** Node environment – "development" | "production" | "test" */
    mode: import.meta.env.MODE as string,

    /** Handy booleans */
    isDev: import.meta.env.DEV as boolean,
    isProd: import.meta.env.PROD as boolean,
} as const;
