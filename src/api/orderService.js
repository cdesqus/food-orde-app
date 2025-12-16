import api from './client';

export const OrderService = {
    createOrder: async (orderData) => {
        const response = await api.post('/orders', orderData);
        return response.data;
    },

    getMyOrders: async () => {
        const response = await api.get('/orders');
        return response.data;
    },

    updateStatus: async (orderId, status, rejectionReason) => {
        const response = await api.put(`/orders/${orderId}/status`, { status, rejectionReason });
        return response.data;
    }
};
