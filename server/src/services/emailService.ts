import imap from 'imap-simple';
import { simpleParser } from 'mailparser';
import fs from 'fs';
import path from 'path';
import { db } from '../firebase';
import { Email } from '../types';
import { aiService } from './aiService';
import { taskService } from './taskService';
import { ragService } from './ragService';
import { authService } from './authService';

export class EmailService {
    private collection = db.collection('emails');

    private async getConfig() {
        // If we have OAuth tokens, use them
        if (authService.isAuthenticated()) {
            try {
                const accessToken = await authService.getAccessToken();
                // Dynamically fetch the authenticated user's email
                const user = await authService.getUserEmail(accessToken);
                console.log(`Authenticated as: ${user}`);

                const authData = `user=${user}\x01auth=Bearer ${accessToken}\x01\x01`;
                const encodedToken = Buffer.from(authData).toString('base64');

                return {
                    imap: {
                        xoauth2: encodedToken,
                        user: user,
                        host: 'imap.gmail.com',
                        port: 993,
                        tls: true,
                        tlsOptions: { rejectUnauthorized: false },
                        authTimeout: 10000,
                        debug: console.log
                    }
                };
            } catch (err) {
                console.warn('OAuth token fetch failed, falling back to password if available', err);
            }
        }

        // Fallback to App Password
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
        let config;
        try {
            config = await this.getConfig();
        } catch (e: any) {
            return `Sync Config Error: ${e.message}`;
        }

        if (!config.imap.user || (!config.imap.password && !config.imap.xoauth2)) {
            throw new Error('Email credentials not configured. Please Login via /auth/google or set .env');
        }

        let connection: any;
        try {
            console.log('Connecting to IMAP...');
            // @ts-ignore: imap-simple types might not explicitly support xoauth2
            const imapConfig = {
                imap: { ...config.imap }
            };
            connection = await imap.connect(imapConfig as any);

            // Add error listener to prevent crash on unhandled error events
            connection.on('error', (err: any) => {
                console.error('IMAP Connection Error Event:', err);
            });


            await connection.openBox('INBOX');
            console.log('IMAP Connected. Searching...');

            // Fetch headers of recent emails (last 48 hours)
            const delay = 48 * 60 * 60 * 1000;
            const yesterday = new Date();
            yesterday.setTime(Date.now() - delay);

            const searchCriteria = [['SINCE', yesterday]];

            console.log(`Searching for emails since ${yesterday.toDateString()}...`);
            const allMessages = await connection.search(searchCriteria, { bodies: ['HEADER'] });

            if (allMessages.length === 0) {
                connection.end();
                return 'No emails found';
            }

            // Get last 5 UIDs
            // @ts-ignore
            const last5 = allMessages.slice(-5).map(m => m.attributes.uid);
            console.log(`Found ${allMessages.length} total. Processing last ${last5.length}...`);

            const rawMessages = await connection.search([['UID', ...last5]], { bodies: [''], markSeen: false });

            let count = 0;
            // @ts-ignore
            for (const item of rawMessages) {
                // @ts-ignore
                const all = item.parts.find((part) => part.which === '');
                // @ts-ignore
                const id = item.attributes.uid.toString();

                if (all && all.body) {
                    try {
                        const parsed = await simpleParser(all.body);

                        // --- Handle Attachments & Inline Images ---
                        const attachments: any[] = [];
                        let htmlBody = parsed.html || parsed.textAsHtml || parsed.text || '';
                        const publicUploadsDir = path.join(__dirname, '../../public/uploads');

                        // Ensure directory exists (redundant if mkdir run, but safe)
                        if (!fs.existsSync(publicUploadsDir)) {
                            fs.mkdirSync(publicUploadsDir, { recursive: true });
                        }

                        if (parsed.attachments && parsed.attachments.length > 0) {
                            for (const att of parsed.attachments) {
                                // Create unique filename: emailId_timestamp_filename
                                const safeFilename = att.filename ? att.filename.replace(/[^a-z0-9.]/gi, '_') : 'unnamed_file';
                                const uniqueFilename = `${id}_${Date.now()}_${safeFilename}`;
                                const filePath = path.join(publicUploadsDir, uniqueFilename);
                                const publicUrl = `http://localhost:3000/uploads/${uniqueFilename}`;

                                try {
                                    // Write file to disk
                                    fs.writeFileSync(filePath, att.content);

                                    // If text/calendar (ics), we might want to skip or handle differently, but saving is fine.

                                    // INLINE IMAGE REPLACEMENT
                                    if (att.contentId) {
                                        const cid = att.contentId.replace(/[<>]/g, ''); // Remove < > wrappers
                                        // Replace cid:xxxx with public URL
                                        // Regex to match cid:${cid} globally
                                        const cidRegex = new RegExp(`cid:${cid}`, 'g');
                                        htmlBody = htmlBody.replace(cidRegex, publicUrl);
                                    }

                                    attachments.push({
                                        filename: att.filename || 'Unknown',
                                        path: publicUrl, // Send public URL to client
                                        contentType: att.contentType,
                                        size: att.size
                                    });

                                } catch (saveErr) {
                                    console.error(`Failed to save attachment ${att.filename}`, saveErr);
                                }
                            }
                        }

                        const emailData: Email = {
                            id: `email_${id}`,
                            from: parsed.from?.text || 'Unknown',
                            subject: parsed.subject || 'No Subject',
                            body: htmlBody, // Use the modified body with replaced CIDs
                            snippet: (parsed.text || '').substring(0, 200),
                            date: parsed.date ? parsed.date.toISOString() : new Date().toISOString(),
                            isRead: false,
                            attachments: attachments
                        };

                        await this.collection.doc(emailData.id).set(emailData, { merge: true });
                        count++;

                        // Trigger AI Analysis
                        console.log(`Analyzing email ${id}...`);
                        try {
                            const analysis = await aiService.analyzeEmail(emailData);

                            await this.collection.doc(emailData.id).set({
                                ...analysis,
                                isAnalyzed: true
                            }, { merge: true });

                            if (analysis.tasks && analysis.tasks.length > 0) {
                                try {
                                    await taskService.createTasksFromAnalysis(emailData.id, analysis.tasks, analysis.deadline);
                                } catch (taskError) {
                                    console.error(`Failed to create tasks for email ${id}`, taskError);
                                }
                            }

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
        try {
            const snapshot = await this.collection.orderBy('date', 'desc').get();
            return snapshot.docs.map(doc => doc.data() as Email);
        } catch (error) {
            console.error('Error in getEmails:', error);
            throw error;
        }
    }

    async sendEmail(to: string, subject: string, text: string, replyToEmailId?: string): Promise<string> {
        const nodemailer = require('nodemailer');

        let transporter;
        let fromAddress = process.env.EMAIL_USER;

        if (authService.isAuthenticated()) {
            const accessToken = await authService.getAccessToken();
            // Dynamically fetch user email for the "From" field
            const userEmail = await authService.getUserEmail(accessToken);
            fromAddress = userEmail;

            transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    type: 'OAuth2',
                    user: userEmail,
                    clientId: process.env.GOOGLE_CLIENT_ID,
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                    accessToken: accessToken
                }
            });
        } else {
            transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASSWORD
                }
            });
        }

        const mailOptions = {
            from: fromAddress,
            to: to,
            subject: subject,
            text: text
        };

        try {
            await transporter.sendMail(mailOptions);

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
