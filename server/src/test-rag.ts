import dotenv from 'dotenv';
dotenv.config();

import { ragService } from './services/ragService';
import { aiService } from './services/aiService';
import { Email } from './types';
import { v4 as uuidv4 } from 'uuid';

async function testRag() {
    console.log('--- START RAG VERIFICATION ---');

    // 1. Seed Context Email
    const contextEmail: Email = {
        id: 'email_context_1',
        from: 'boss@company.com',
        subject: 'Project Alpha Requirements',
        body: 'The secret code for the project is "BlueSky".',
        date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        isRead: true
    };

    console.log('Adding context email...');
    await ragService.addEmail(contextEmail);

    // 2. Query Email
    const queryEmail: Email = {
        id: 'email_query_1',
        from: 'colleague@company.com',
        subject: 'Re: Project Alpha Requirements',
        body: 'Hey, I forgot, what was the secret code mentioned yesterday?',
        date: new Date().toISOString(),
        isRead: false
    };

    // 3. Test Retrieval directly
    console.log('Testing retrieval...');
    try {
        const context = await ragService.getContext(queryEmail);
        console.log('\nRetrieved Context:');
        console.log(context);

        if (context.includes('BlueSky')) {
            console.log('✅ Context Retrieval Passed (Found "BlueSky")');
        } else {
            console.warn('⚠️ Context Retrieval Failed');
        }
    } catch (err) {
        console.error('CRASH in getContext:', err);
        require('fs').writeFileSync('error.log', JSON.stringify(err, Object.getOwnPropertyNames(err)));
    }

    // 4. Test RAG in AI Service
    console.log('\nTesting AI Analysis with RAG...');
    try {
        const analysis = await aiService.analyzeEmail(queryEmail);
        console.log('AI Analysis Result:', analysis);

        // We can't easily assert the AI's internal thought process without inspecting logs, 
        // but if the summary mentions "BlueSky", it proves RAG worked.
        if (analysis.summary.includes('BlueSky') || analysis.reasoning?.includes('BlueSky')) {
            console.log('✅ AI used RAG context!');
        } else {
            console.log('ℹ️ AI did not explicitly mention the code in summary (might be expected behavior). Check logs for context injection.');
        }

    } catch (e) {
        console.error('AI Analysis failed', e);
    }

    console.log('--- END RAG VERIFICATION ---');
}

testRag();
