import { Request, Response } from 'express';
import { ragService } from '../services/ragService';
import { llmService } from '../services/llmService';

export const chatController = {
    handleChat: async (req: Request, res: Response) => {
        try {
            const { message, history } = req.body;

            if (!message) {
                return res.status(400).json({ status: 'error', message: 'Message is required' });
            }

            console.log(`Chat Request: "${message}"`);

            // 1. Get Context from Inbox (RAG)
            const context = await ragService.getContextForQuery(message);

            // 2. Construct Prompt
            const prompt = `
            You are InboxIQ, an intelligent email assistant. 
            Answer the user's question based strictly on the provided email context. 
            If the answer is not in the context, say "I couldn't find that information in your recent emails."
            
            EMAIL CONTEXT:
            ${context || "No relevant emails found."}

            USER QUESTION:
            ${message}

            ANSWER:
            `;

            // 3. Generate Response
            const aiResponse = await llmService.generateCompletion(prompt);

            res.json({
                status: 'success',
                data: {
                    response: aiResponse,
                    contextUsed: !!context
                }
            });

        } catch (error: any) {
            console.error('Chat API Error:', error);
            res.status(500).json({ status: 'error', message: error.message });
        }
    }
};
