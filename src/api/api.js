import axios from 'axios';

const API_URL = 'http://localhost:8001/api';
const TOKEN_KEY = 'skillmeter_tokens';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
    (config) => {
        try {
            const tokens = JSON.parse(localStorage.getItem(TOKEN_KEY) || '{}');
            if (tokens.access) {
                config.headers.Authorization = `Bearer ${tokens.access}`;
            }
        } catch (e) {
            console.error('Error reading tokens:', e);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle 401 and refresh token
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If 401 and not already retried
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const tokens = JSON.parse(localStorage.getItem(TOKEN_KEY) || '{}');
                if (tokens.refresh) {
                    const refreshResponse = await axios.post(`${API_URL}/auth/refresh/`, {
                        refresh: tokens.refresh,
                    });

                    const newAccessToken = refreshResponse.data.access;
                    const newTokens = {
                        ...tokens,
                        access: newAccessToken,
                    };
                    localStorage.setItem(TOKEN_KEY, JSON.stringify(newTokens));

                    // Retry original request with new token
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
                // Clear tokens and redirect to login
                localStorage.removeItem(TOKEN_KEY);
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

export default api;
