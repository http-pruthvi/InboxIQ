
import { llmService } from './llmService';
import { Email } from '../types';
import { ragService } from './ragService';

export interface EmailAnalysis {
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    category: 'WORK' | 'PERSONAL' | 'NEWSLETTER' | 'PROMOTION' | 'OTHER';
    summary: string;
    tasks: string[];
    suggestedReply?: string;
    deadline?: string;
    spamScore: number;
    reasoning: string;
}

export class AiService {

    async analyzeEmail(email: Email): Promise<EmailAnalysis> {
        // 1. Retrieve Context
        const context = await ragService.getContext(email);
        const contextPrompt = context ? `
        RELEVANT PAST EMAILS (CONTEXT):
        ${context}
        
        Use this context to better understand the urgency and topic. If the sender asks "Did you do it?", check the context to see what "it" is.
        ` : '';

        const prompt = `
        You are an advanced email intelligence agent. Analyze the following email for priority, content, and actionability.
        
        RETURN ONLY A VALID JSON OBJECT. NO MARKDOWN.
        
        ${contextPrompt}

        Email Data:
        From: ${email.from}
        Subject: ${email.subject}
        Body: ${email.body.substring(0, 3000)}
        
        Analysis Instructions:
        1. **Priority**: HIGH (Urgent/Boss/Client), MEDIUM (Actionable), LOW (FYI/Newsletter).
        2. **Category**: WORK, PERSONAL, NEWSLETTER, PROMOTION, OTHER.
        3. **Summary**: One crisp, information-dense sentence.
        4. **Deadline**: Extract any specific due date/time as ISO 8601 string (e.g., "2024-12-25T17:00:00"). Return null if none.
        5. **Spam Score**: 0.0 (Clean) to 1.0 (Definite Spam).
        6. **Reasoning**: Brief explanation (max 15 words) for the priority rating.
        7. **Tasks**: Extract HIGHLY SPECIFIC, ACTIONABLE tasks (e.g. "Review Q3 Report", "Reply to Sarah"). Return [] if no clear action.
        8. **Suggested Reply**: Draft a short professional reply if needed (null if newsletter/spam).
        
        JSON Structure:
        {
            "priority": "HIGH" | "MEDIUM" | "LOW",
            "category": "String",
            "summary": "String",
            "deadline": "ISO String or null",
            "spamScore": 0.0,
            "reasoning": "String",
            "tasks": ["Review proposal document", "Schedule meeting with team"],
            "suggestedReply": "String"
        }
        `;

        try {
            const rawResponse = await llmService.generateCompletion(prompt);

            const sanitized = this.sanitizeJson(rawResponse);
            const analysis = JSON.parse(sanitized) as EmailAnalysis;

            // Validate critical fields
            if (!['HIGH', 'MEDIUM', 'LOW'].includes(analysis.priority)) analysis.priority = 'MEDIUM';

            // Clean tasks
            if (Array.isArray(analysis.tasks)) {
                analysis.tasks = analysis.tasks.filter(t => t && t.trim().length > 3 && !t.includes("Task 1"));
            } else {
                analysis.tasks = [];
            }

            // Clean suggested reply
            if (analysis.suggestedReply === 'null' || analysis.suggestedReply === 'N/A' || (analysis.suggestedReply && analysis.suggestedReply.length < 5)) {
                analysis.suggestedReply = undefined;
            }

            return analysis;

        } catch (error) {
            console.error('Error analyzing email:', error);
            // Fallback
            return {
                priority: 'MEDIUM',
                category: 'OTHER',
                summary: 'Analysis failed.',
                tasks: [],
                spamScore: 0,
                reasoning: 'Error during analysis'
            };
        }
    }

    private sanitizeJson(text: string): string {
        // Remove markdown code blocks if present
        let clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
        // Use regex to extract the first JSON object if there is extra chatty text
        const match = clean.match(/\{[\s\S]*\}/);
        return match ? match[0] : clean;
    }
}

export const aiService = new AiService();
