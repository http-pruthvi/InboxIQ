
import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
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
        return response.data.data;
    },
    send: async (to: string, subject: string, body: string, replyToEmailId?: string) => {
        const response = await api.post('/emails/send', { to, subject, body, replyToEmailId });
        return response.data;
    }
};

export const taskApi = {
    getAll: async () => {
        try {
            const response = await api.get('/tasks');
            // console.log('GET /tasks response:', response.data);
            return response.data?.data || [];
        } catch (error) {
            console.error('API Error fetching tasks:', error);
            return [];
        }
    },
    update: async (id: string, updates: Partial<{ status: 'PENDING' | 'COMPLETED', dueDate: string | null }>) => {
        const response = await api.patch(`/tasks/${id}`, updates);
        return response.data;
    }
};

export const authApi = {
    checkContext: async () => {
        try {
            const response = await api.get('/user');
            return response.data; // Returns { isAuthenticated: boolean, user: ... }
        } catch {
            return { isAuthenticated: false };
        }
    },
    logout: async () => {
        await api.get('/auth/logout');
    }
};
export const chatApi = {
    sendMessage: async (message: string) => {
        const response = await api.post('/chat', { message });
        return response.data.data; // { response: string, contextUsed: boolean }
    }
};

export const aiApi = {
    rewrite: async (text: string, tone: 'FORMAL' | 'CASUAL' | 'CONCISE' | 'CHECK_GRAMMAR') => {
        const response = await api.post('/ai/rewrite', { text, tone });
        return response.data.data; // { rewritten: string }
    }
};

export default api;
