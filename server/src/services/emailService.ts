import imap from 'imap-simple';
import { simpleParser } from 'mailparser';
import { db } from '../firebase';
import { Email } from '../types';
import { aiService } from './aiService';
import { taskService } from './taskService';
import { ragService } from './ragService';

export class EmailService {
    private collection = db.collection('emails');

    private getConfig() {
        return {
            imap: {
                user: process.env.EMAIL_USER || '',
                password: process.env.EMAIL_PASSWORD || '',
                host: process.env.EMAIL_HOST || 'imap.gmail.com',
                port: parseInt(process.env.EMAIL_PORT || '993'),
                tls: true,
                tlsOptions: { rejectUnauthorized: false },
                authTimeout: 10000
            }
        };
    }

    async syncEmails(): Promise<string> {
        console.log('syncEmails called');
        const config = this.getConfig();

        if (!config.imap.user || !config.imap.password) {
            throw new Error('Email credentials not configured in .env');
        }

        let connection;
        try {
            console.log('Connecting to IMAP...');
            connection = await imap.connect(config);
            await connection.openBox('INBOX');
            console.log('IMAP Connected. Searching...');

            // Fetch headers of recent emails (last 48 hours) to avoid hanging on large inboxes
            const delay = 48 * 60 * 60 * 1000;
            const yesterday = new Date();
            yesterday.setTime(Date.now() - delay);
            const sinceDate = yesterday.toISOString().split('T')[0]; // Format YYYY-MM-DD not strictly required by node-imap, usually Date object or string

            // node-imap accepts Date object for SINCE
            const searchCriteria = [['SINCE', yesterday]];

            console.log(`Searching for emails since ${yesterday.toDateString()}...`);
            const allMessages = await connection.search(searchCriteria, { bodies: ['HEADER'] });

            if (allMessages.length === 0) {
                connection.end();
                return 'No emails found';
            }

            // Get last 5 UIDs
            const last5 = allMessages.slice(-5).map(m => m.attributes.uid);
            console.log(`Found ${allMessages.length} total. Processing last ${last5.length}...`);

            // Fetch bodies using UID search
            // We fetch the whole body for parsing
            const rawMessages = await connection.search([['UID', ...last5]], { bodies: [''], markSeen: false });

            let count = 0;
            for (const item of rawMessages) {
                const all = item.parts.find((part) => part.which === '');
                const id = item.attributes.uid.toString();

                if (all && all.body) {
                    try {
                        const parsed = await simpleParser(all.body);
                        const emailData: Email = {
                            id: `email_${id}`,
                            from: parsed.from?.text || 'Unknown',
                            subject: parsed.subject || 'No Subject',
                            body: parsed.text || parsed.html || '',
                            date: parsed.date ? parsed.date.toISOString() : new Date().toISOString(),
                            isRead: false
                        };
                        await this.collection.doc(emailData.id).set(emailData, { merge: true });
                        count++;

                        // Trigger AI Analysis
                        console.log(`Analyzing email ${id}...`);
                        try {
                            const analysis = await aiService.analyzeEmail(emailData);

                            // Save detailed analysis
                            await this.collection.doc(emailData.id).set({
                                ...analysis,
                                isAnalyzed: true
                            }, { merge: true });

                            // Create tasks if any found
                            if (analysis.tasks && analysis.tasks.length > 0) {
                                await taskService.createTasksFromAnalysis(emailData.id, analysis.tasks);
                            }

                            // RAG Indexing
                            await ragService.addEmail({ ...emailData, ...analysis });

                            console.log(`Email ${id} analyzed. Priority: ${analysis.priority}, Tasks: ${analysis.tasks.length}`);
                        } catch (aiError) {
                            console.error(`Failed to analyze email ${id}`, aiError);
                        }
                    } catch (err) {
                        console.error(`Error parsing email ${id}`, err);
                    }
                }
            }

            connection.end();
            return `Synced ${count} new emails`;

        } catch (error: any) {
            console.error('IMAP Error:', error);
            if (connection) {
                try { connection.end(); } catch (e) { }
            }
            throw new Error(`Failed to sync emails: ${error.message}`);
        }
    }

    async getEmails(): Promise<Email[]> {
        const snapshot = await this.collection.orderBy('date', 'desc').get();
        return snapshot.docs.map(doc => doc.data() as Email);
    }

    async sendEmail(to: string, subject: string, text: string, replyToEmailId?: string): Promise<string> {
        const nodemailer = require('nodemailer');

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: to,
            subject: subject,
            text: text
        };

        try {
            await transporter.sendMail(mailOptions);

            // Mark original email as replied if ID is provided
            if (replyToEmailId) {
                console.log(`Marking email ${replyToEmailId} as replied`);
                await this.collection.doc(replyToEmailId).set({
                    isReplied: true,
                    needsFollowUp: false
                }, { merge: true });
            }

            return 'Email sent successfully';
        } catch (error: any) {
            console.error('Error sending email:', error);
            throw new Error(`Failed to send email: ${error.message}`);
        }
    }
}

export const emailService = new EmailService();
