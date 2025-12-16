import axios from 'axios';

// Create Axios Instance
// In production, BASE_URL should come from env var (VITE_API_URL)
// For local dev, assuming backend runs on port 3000
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attach Token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Handle Auth Errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token expired or invalid
            // Optional: Redirect to login or clear storage
            // window.location.href = '/login'; 
        }
        return Promise.reject(error);
    }
);

export default api;
