import api from './client';

export const FoodService = {
    getAllFoods: async (merchantId) => {
        const params = merchantId ? { merchantId } : {};
        const response = await api.get('/foods', { params });
        return response.data;
    },

    createFood: async (foodData) => {
        const response = await api.post('/foods', foodData);
        return response.data;
    }
};
