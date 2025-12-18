
import { emailService } from './services/emailService';
import dotenv from 'dotenv';
dotenv.config();

async function testSend() {
    console.log('Testing Email Sending...');
    const targetEmail = process.env.EMAIL_USER; // Send to self for testing

    if (!targetEmail) {
        console.error('No EMAIL_USER defined in .env');
        return;
    }

    try {
        console.log(`Sending test email to ${targetEmail}...`);
        const result = await emailService.sendEmail(
            targetEmail,
            'Test Email from AI Assistant',
            'This is a test email sent from the Algoquest AI Assistant backend.'
        );
        console.log('Result:', result);
    } catch (error) {
        console.error('Failed to send email:', error);
    }
}

testSend();
