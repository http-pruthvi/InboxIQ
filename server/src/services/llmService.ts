
import dotenv from 'dotenv';
dotenv.config();

export interface LlmResponse {
    response: string;
}

export class LlmService {
    private apiUrl: string;
    private model: string;

    constructor() {
        this.apiUrl = process.env.AI_PROVIDER_URL || 'http://localhost:11434/api/generate';
        this.model = process.env.AI_MODEL || 'llama3';
    }

    async generateCompletion(prompt: string): Promise<string> {
        console.log(`Generating completion with model ${this.model} at ${this.apiUrl}`);
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.model,
                    prompt: prompt,
                    stream: false
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`LLM API Error: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const data = await response.json() as any;
            return data.response;

        } catch (error: any) {
            console.error('LLM Service Error:', error);
            // Fallback for demo if no local LLM is running
            if (error.code === 'ECONNREFUSED') {
                console.warn('Local LLM not reachable. Using fallback mock response.');
                return "This is a mock response because the local LLM is not running. Please ensure Ollama is started.";
            }
            throw error;
        }
    }
}

export const llmService = new LlmService();
