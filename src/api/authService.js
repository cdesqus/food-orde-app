import api from './client';

export const AuthService = {
    login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        return response.data;
    },

    register: async (userData) => {
        const response = await api.post('/auth/register', userData);
        return response.data;
    },

    getCurrentUser: async () => {
        // If you implemented a /me endpoint in backend, use it.
        // For now, consistent with logic, we might rely on the stored user object or decode token
        // But ideally:
        // const response = await api.get('/auth/me');
        // return response.data;
        return null; // Placeholder
    }
};
