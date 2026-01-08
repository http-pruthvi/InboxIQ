
import { Request, Response } from 'express';
import { llmService } from '../services/llmService';

export const aiController = {
    handleRewrite: async (req: Request, res: Response) => {
        try {
            const { text, tone } = req.body;

            if (!text) {
                return res.status(400).json({ status: 'error', message: 'Text is required' });
            }

            let instruction = '';
            switch (tone) {
                case 'FORMAL':
                    instruction = 'Rewrite the following text to be more professional, polite, and formal.';
                    break;
                case 'CASUAL':
                    instruction = 'Rewrite the following text to be friendly, casual, and conversational.';
                    break;
                case 'CONCISE':
                    instruction = 'Shorten the following text. Be concise and to the point while retaining the meaning.';
                    break;
                case 'CHECK_GRAMMAR':
                    instruction = 'Fix any grammar, spelling, or punctuation errors in the following text. Do not change the tone or meaning.';
                    break;
                default:
                    instruction = 'Rewrite the following text to clearly convey the message.';
            }

            const prompt = `
            You are an expert writing assistant.
            ${instruction}
            
            Original Text: "${text}"
            
            Return ONLY the rewritten text. Do not add quotes or explanations.
            `;

            const rewritten = await llmService.generateCompletion(prompt);

            // Cleanup quotes if the LLM adds them
            const cleanText = rewritten.trim().replace(/^"|"$/g, '');

            res.json({ status: 'success', data: { rewritten: cleanText } });

        } catch (error: any) {
            console.error('AI Rewrite Error:', error);
            res.status(500).json({ status: 'error', message: error.message });
        }
    }
};
