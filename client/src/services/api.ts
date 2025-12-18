
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3000/api', // Hardcoded for MVP, better in env
    headers: {
        'Content-Type': 'application/json',
    },
});

export const emailApi = {
    sync: async () => {
        const response = await api.post('/emails/sync');
        return response.data;
    },
    getAll: async () => {
        const response = await api.get('/emails');
        // Backend returns { status: 'success', data: [...] }
        return response.data.data;
    },
    send: async (to: string, subject: string, body: string, replyToEmailId?: string) => {
        const response = await api.post('/emails/send', { to, subject, body, replyToEmailId });
        return response.data;
    }
};

export const taskApi = {
    getAll: async () => {
        const response = await api.get('/tasks');
        return response.data;
    }
};

export default api;
