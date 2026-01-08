
import 'dotenv/config'; // Load env vars before any other imports
import express from 'express';
import cors from 'cors';
import './firebase'; // Initialize Firebase
import { db } from './firebase';
import { emailService } from './services/emailService';
import { taskService } from './services/taskService';

const app = express();
const PORT = process.env.PORT || 3000;
// Restart trigger for .env update
// Trigger restart for new route


import { authService } from './services/authService';
import { chatController } from './controllers/chatController';
import { aiController } from './controllers/aiController';

app.use(cors());
app.use(express.json());
// Serve uploaded attachments/images
app.use('/uploads', express.static('public/uploads'));
// Serve uploaded attachments/images
app.use('/uploads', express.static('public/uploads'));

// --- ROUTES ---
app.post('/api/chat', chatController.handleChat);
app.post('/api/ai/rewrite', aiController.handleRewrite);
console.log('Routes registered: /api/chat, /api/ai/rewrite');

app.get('/auth/google', (req, res) => {
    const url = authService.generateAuthUrl();
    res.redirect(url);
});

app.get('/auth/google/callback', async (req, res) => {
    try {
        const { code } = req.query;
        if (code) {
            await authService.getTokens(code as string);
            // Redirect back to frontend
            res.redirect('http://localhost:5173');
        } else {
            throw new Error('No code received');
        }
    } catch (error) {
        console.error('Auth error:', error);
        res.redirect('http://localhost:5173?error=auth_failed');
    }
});

app.get('/api/user', (req, res) => {
    const isAuthenticated = authService.isAuthenticated();
    res.json({
        isAuthenticated,
        user: isAuthenticated ? { email: 'User' } : null
    });
});

app.get('/api/auth/logout', (req, res) => {
    authService.logout();
    res.json({ status: 'success', message: 'Logged out' });
});


app.get('/', (req, res) => {
    res.send('AI Email Assistant Server Running');
});

// Mock API route for testing connection
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend is connected' });
});

app.get('/api/test-db', async (req, res) => {
    try {
        const docRef = db.collection('test').doc('ping');
        await docRef.set({
            timestamp: new Date().toISOString(),
            message: 'Firebase is connected!'
        });
        const doc = await docRef.get();
        res.json({ status: 'success', data: doc.data() });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.post('/api/emails/sync', async (req, res) => {
    console.log('Received sync request');
    try {
        const result = await emailService.syncEmails();
        // const result = "Skipped sync";
        res.json({ status: 'success', message: result });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.get('/api/emails', async (req, res) => {
    try {
        const emails = await emailService.getEmails();
        res.json({ status: 'success', data: emails });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Email Send Endpoint
app.post('/api/emails/send', async (req, res) => {
    try {
        console.log('API Send Request Body:', req.body);
        const { to, subject, body, replyToEmailId } = req.body;
        if (!to || !subject || !body) {
            return res.status(400).json({ status: 'error', message: 'Missing required fields' });
        }
        await emailService.sendEmail(to, subject, body, replyToEmailId);
        res.json({ status: 'success', message: 'Email sent' });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.get('/api/tasks', async (req, res) => {
    try {
        const tasks = await taskService.getTasks();
        res.json({ status: 'success', data: tasks });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.patch('/api/tasks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        await taskService.updateTask(id, updates);
        res.json({ status: 'success', message: 'Task updated' });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});


const server = app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});


// Keep process alive just in case
// Run automation every hour (3600000 ms)
setInterval(() => {
    const { automationService } = require('./services/automationService'); // Lazy load
    automationService.checkUnansweredEmails();
}, 1000 * 60 * 60);

// Run once on startup for demo purposes (wait 5s for DB connection)
setTimeout(() => {
    const { automationService } = require('./services/automationService');
    automationService.checkUnansweredEmails();
}, 5000);

process.on('SIGTERM', () => {
    server.close(() => {
        console.log('Process terminated');
    });
});
