import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(undefined);
const API_URL = 'http://localhost:8001/api';
const TOKEN_KEY = 'skillmeter_tokens';
const USER_KEY = 'skillmeter_user';
const ONBOARDING_KEY = 'skillmeter_onboarding';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [onboardingData, setOnboardingData] = useState(null);

    // Helper to make authenticated requests with auto-refresh
    const authFetch = async (url, options = {}) => {
        const getTokens = () => JSON.parse(localStorage.getItem(TOKEN_KEY) || '{}');
        let tokens = getTokens();

        const getHeaders = (accessToken) => ({
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            ...options.headers,
        });

        // 1. Try initial request
        let response = await fetch(url, {
            ...options,
            headers: getHeaders(tokens.access)
        });

        // 2. If 401 Unauthorized, try to refresh token
        if (response.status === 401 && tokens.refresh) {
            try {
                const refreshRes = await fetch(`${API_URL}/auth/refresh/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh: tokens.refresh }),
                });

                if (refreshRes.ok) {
                    const data = await refreshRes.json();

                    // Update tokens in storage
                    const newTokens = {
                        ...tokens,
                        access: data.access,
                        refresh: data.refresh || tokens.refresh // Keep old refresh if not rotated
                    };
                    localStorage.setItem(TOKEN_KEY, JSON.stringify(newTokens));

                    // Retry original request with new token
                    response = await fetch(url, {
                        ...options,
                        headers: getHeaders(newTokens.access)
                    });
                } else {
                    // Refresh failed (token expired/invalid) -> Logout
                    await logout();
                }
            } catch (refreshError) {
                console.error('Token refresh error:', refreshError);
                await logout();
            }
        }

        return response;
    };

    // Check for stored auth on mount
    useEffect(() => {
        const storedUser = localStorage.getItem(USER_KEY);
        const storedTokens = localStorage.getItem(TOKEN_KEY);
        const storedOnboarding = localStorage.getItem(ONBOARDING_KEY);

        if (storedUser && storedTokens) {
            try {
                const parsed = JSON.parse(storedUser);
                setUser({
                    ...parsed,
                    createdAt: parsed.date_joined ? new Date(parsed.date_joined) : new Date(),
                });
            } catch (e) {
                localStorage.removeItem(USER_KEY);
                localStorage.removeItem(TOKEN_KEY);
            }
        }

        if (storedOnboarding) {
            try {
                setOnboardingData(JSON.parse(storedOnboarding));
            } catch (e) {
                localStorage.removeItem(ONBOARDING_KEY);
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const response = await fetch(`${API_URL}/auth/login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Login failed');
            }

            const data = await response.json();

            // Store tokens
            localStorage.setItem(TOKEN_KEY, JSON.stringify({
                access: data.access,
                refresh: data.refresh,
            }));

            // Store user
            const userData = {
                ...data.user,
                name: data.user.first_name || data.user.username,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.username}`,
                role: 'student',
                isMentor: data.user.isMentor || false,
                onboardingCompleted: false,
            };
            localStorage.setItem(USER_KEY, JSON.stringify(userData));
            setUser(userData);

            return true;
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    };

    const signup = async (name, email, password, isMentorSignup = false) => {
        try {
            const response = await fetch(`${API_URL}/auth/register/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: email.split('@')[0],
                    email,
                    password,
                    password2: password,
                    first_name: name,
                    is_mentor: isMentorSignup, // Pass mentor flag to backend
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(JSON.stringify(error) || 'Signup failed');
            }

            const data = await response.json();

            // Store tokens
            localStorage.setItem(TOKEN_KEY, JSON.stringify({
                access: data.access,
                refresh: data.refresh,
            }));

            // Store user
            const userData = {
                ...data.user,
                name: data.user.first_name || data.user.username,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.username}`,
                role: isMentorSignup ? 'mentor' : 'student',
                isMentor: data.user.isMentor || isMentorSignup,
                onboardingCompleted: isMentorSignup ? true : false, // Mentors skip onboarding
            };
            localStorage.setItem(USER_KEY, JSON.stringify(userData));
            setUser(userData);

            return true;
        } catch (error) {
            console.error('Signup error:', error);
            return false;
        }
    };

    const logout = async () => {
        try {
            const tokens = JSON.parse(localStorage.getItem(TOKEN_KEY) || '{}');
            if (tokens.refresh) {
                await authFetch(`${API_URL}/auth/logout/`, {
                    method: 'POST',
                    body: JSON.stringify({ refresh: tokens.refresh }),
                });
            }
        } catch (e) {
            console.error('Logout error:', e);
        }

        setUser(null);
        setOnboardingData(null);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(ONBOARDING_KEY);
    };

    const updateUser = (updates) => {
        if (user) {
            const updated = { ...user, ...updates };
            setUser(updated);
            localStorage.setItem(USER_KEY, JSON.stringify(updated));
        }
    };

    const completeOnboarding = (data) => {
        setOnboardingData(data);
        localStorage.setItem(ONBOARDING_KEY, JSON.stringify(data));
        if (user) {
            updateUser({ onboardingCompleted: true });
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                signup,
                logout,
                updateUser,
                completeOnboarding,
                onboardingData,
                authFetch,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
