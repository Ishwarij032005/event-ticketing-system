import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient, AUTH_EXPIRED_EVENT } from '@/api/client';

export type UserRole = 'admin' | 'user';

export interface User {
    id: string;
    email: string;
    role: UserRole;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isLoading: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Decode JWT payload and return exp claim (seconds since epoch)
function getTokenExpiry(token: string): number | null {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return typeof payload.exp === 'number' ? payload.exp : null;
    } catch {
        return null;
    }
}

function isTokenExpired(token: string): boolean {
    const exp = getTokenExpiry(token);
    if (exp == null) return false; // can't tell, let server decide
    return Date.now() / 1000 >= exp;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const clearAuth = useCallback(() => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
    }, []);

    // Restore persisted session on mount
    useEffect(() => {
        const storedToken = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('auth_user');

        if (storedToken && storedUser) {
            if (isTokenExpired(storedToken)) {
                // Token already expired — remove and start fresh
                clearAuth();
            } else {
                try {
                    setToken(storedToken);
                    setUser(JSON.parse(storedUser));
                } catch {
                    clearAuth();
                }
            }
        }
        setIsLoading(false);
    }, [clearAuth]);

    // Listen for global 401 events fired by apiClient
    useEffect(() => {
        const handle = () => {
            clearAuth();
            // Navigate to login with session-expired flag
            window.location.href = '/login?session=expired';
        };
        window.addEventListener(AUTH_EXPIRED_EVENT, handle);
        return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handle);
    }, [clearAuth]);

    // Schedule automatic logout when token is about to expire
    useEffect(() => {
        if (!token) return;
        const exp = getTokenExpiry(token);
        if (!exp) return;

        const msUntilExpiry = exp * 1000 - Date.now();
        if (msUntilExpiry <= 0) {
            clearAuth();
            return;
        }

        // Clear auth 30 seconds before actual expiry so the user gets a clean logout
        const timer = setTimeout(() => {
            clearAuth();
            window.location.href = '/login?session=expired';
        }, Math.max(0, msUntilExpiry - 30_000));

        return () => clearTimeout(timer);
    }, [token, clearAuth]);

    const login = useCallback((newToken: string, newUser: User) => {
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('auth_token', newToken);
        localStorage.setItem('auth_user', JSON.stringify(newUser));
    }, []);

    const logout = useCallback(() => {
        clearAuth();
    }, [clearAuth]);

    const value: AuthContextType = {
        user,
        token,
        isAuthenticated: !!token,
        isAdmin: user?.role === 'admin',
        isLoading,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
