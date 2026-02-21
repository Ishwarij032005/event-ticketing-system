import { env } from '@/config/env';
import { APIResponse } from './types';

// Global 401 event — AuthContext subscribes to this to clear state & redirect
export const AUTH_EXPIRED_EVENT = 'auth:expired';

class APIClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(isFormData: boolean = false): HeadersInit {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = {};
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const text = await response.text();
    let data: any;

    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      data = { error: 'Failed to parse server response' };
    }

    if (env.isDev) {
      console.log(`[API ${response.status}]`, data);
    }

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
      }

      const errorMessage = data.error || data.message || `Request failed with status ${response.status}`;
      const error = new Error(errorMessage) as any;
      error.status = response.status;
      // Mark as retriable if it's a server error (5xx)
      error.isRetriable = response.status >= 500;
      throw error;
    }

    return data as T;
  }

  private async request<T>(method: string, endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    if (env.isDev) {
      const bodyLog = options.body instanceof FormData ? '[FormData]' : (options.body ? JSON.parse(options.body as string) : '');
      console.log(`[API ${method}] ${url}`, bodyLog);
    }

    const isFormData = options.body instanceof FormData;
    const response = await fetch(url, {
      method,
      headers: {
        ...this.getHeaders(isFormData),
        ...options.headers,
      },
      ...options,
    });

    return this.handleResponse<T>(response);
  }

  async get<T>(endpoint: string, params?: Record<string, string | number | undefined>): Promise<T> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) url += `?${queryString}`;
    }
    return this.request<T>('GET', url);
  }

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', endpoint, {
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>('PUT', endpoint, {
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', endpoint, {
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>('DELETE', endpoint);
  }

  async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    return this.request<T>('POST', endpoint, {
      body: formData,
    });
  }
}

export const apiClient = new APIClient(env.apiUrl);
export type { APIResponse };
