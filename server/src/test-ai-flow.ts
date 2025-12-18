
import dotenv from 'dotenv';
dotenv.config();
import { emailService } from './services/emailService';
import { aiService } from './services/aiService';

async function testAiFlow() {
    console.log('--- Starting AI Flow Test ---');

    console.log('1. Fetching recent emails from IMAP...');
    // We'll use the service's getEmails if it pulls from DB, but we want fresh ones.
    // Let's force a sync first.
    try {
        await emailService.syncEmails();
        const emails = await emailService.getEmails();

        if (emails.length === 0) {
            console.log('No emails found in DB to analyze.');
            return;
        }

        // Pick one email to analyze (e.g., the first one)
        const targetEmail = emails[0];
        console.log(`\n2. Selected Email for Analysis:`);
        console.log(`- From: ${targetEmail.from}`);
        console.log(`- Subject: ${targetEmail.subject}`);
        console.log(`- Body Preview: ${targetEmail.body.substring(0, 100)}...`);

        console.log('\n3. Sending to AI Service (Llama 3)...');
        const analysis = await aiService.analyzeEmail(targetEmail);

        console.log('\n--- AI ANALYSIS RESULT ---');
        console.log(JSON.stringify(analysis, null, 2));
        console.log('--------------------------');

    } catch (error) {
        console.error('Test Failed:', error);
    }
}

testAiFlow();
