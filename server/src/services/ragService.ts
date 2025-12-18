import axios from 'axios';
import { Email } from '../types';
import { db } from '../firebase';

export class RagService {
    private apiUrl = process.env.AI_PROVIDER_URL?.replace('/generate', '/embeddings') || 'http://localhost:11434/api/embeddings';
    private model = process.env.AI_MODEL || 'llama3';

    // In-memory cache for simple vector search (for MVP)
    // In production, use Pinecone/Weaviate/pgvector
    private memoryVectorStore: { id: string; embedding: number[]; email: Email }[] = [];

    constructor() {
        this.loadFromDb(); // logic to hydrate cache on start
    }

    private async loadFromDb() {
        // Hydrate in-memory store from Firestore on boot
        try {
            const snapshot = await db.collection('emails').where('embedding', '!=', null).get();
            snapshot.forEach(doc => {
                const email = doc.data() as Email;
                if (email.embedding) {
                    this.memoryVectorStore.push({
                        id: email.id,
                        embedding: email.embedding,
                        email: email
                    });
                }
            });
            console.log(`RAG Service: Hydrated ${this.memoryVectorStore.length} embeddings.`);
        } catch (e) {
            console.warn('RAG Service: Failed to hydrate cache', e);
        }
    }

    async generateEmbedding(text: string): Promise<number[] | null> {
        try {
            const response = await axios.post(this.apiUrl, {
                model: this.model,
                prompt: text
            });
            return response.data.embedding; // Ollama format
        } catch (error) {
            console.error('Failed to generate embedding', error);
            return null;
        }
    }

    async addEmail(email: Email) {
        // 1. Generate embedding if missing
        if (!email.embedding) {
            const textToEmbed = `${email.subject} ${email.body.substring(0, 500)}`;
            const embedding = await this.generateEmbedding(textToEmbed);
            if (embedding) {
                email.embedding = embedding;
                // Update DB async
                await db.collection('emails').doc(email.id).set({ embedding }, { merge: true });
            }
        }

        // 2. Add to memory store
        if (email.embedding) {
            // Remove existing if updating
            this.memoryVectorStore = this.memoryVectorStore.filter(i => i.id !== email.id);
            this.memoryVectorStore.push({
                id: email.id,
                embedding: email.embedding,
                email: email
            });
        }
    }

    async getContext(targetEmail: Email, limit: number = 3): Promise<string> {
        // 1. Thread context (Subject Matching)
        const normalize = (s: string) => (s || '').replace(/^(re|fwd):\s*/i, '').trim();
        const targetSubject = normalize(targetEmail.subject);

        const threadMatches = this.memoryVectorStore.filter(item =>
            normalize(item.email.subject) === targetSubject &&
            item.email.id !== targetEmail.id
        );

        // 2. Semantic Search (Cosine Similarity)
        let semanticMatches: { email: Email; score: number }[] = [];

        // Generate embedding on the fly if missing for query
        if (!targetEmail.embedding) {
            const textToEmbed = `${targetEmail.subject} ${targetEmail.body.substring(0, 500)}`;
            targetEmail.embedding = await this.generateEmbedding(textToEmbed) || undefined;
        }

        if (targetEmail.embedding) {
            console.log(`RAG Debug: Query embedding len=${targetEmail.embedding.length}`);
            semanticMatches = this.memoryVectorStore
                .filter(item => item.id !== targetEmail.id)
                .map(item => {
                    if (!Array.isArray(item.embedding)) {
                        console.error(`RAG Error: Invalid embedding for ${item.id}`, item.embedding);
                        return { email: item.email, score: 0 };
                    }
                    return {
                        email: item.email,
                        score: this.cosineSimilarity(targetEmail.embedding!, item.embedding)
                    };
                })
                .filter(m => m.score > 0.5) // Filter low relevance
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);
        }

        // Combine and dedup
        const combined = [...threadMatches.map(m => m.email), ...semanticMatches.map(m => m.email)];
        const unique = Array.from(new Set(combined.map(e => e.id)))
            .map(id => combined.find(e => e.id === id)!);

        if (unique.length === 0) return "";

        return unique.slice(0, 5).map(e => `
        ---
        From: ${e.from}
        Date: ${e.date}
        Subject: ${e.subject}
        Body: ${(e.body || '').substring(0, 200).replace(/\s+/g, ' ')}...
        ---
        `).join('\n');
    }

    private cosineSimilarity(vecA: number[], vecB: number[]): number {
        const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
        const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
        const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
        return dotProduct / (magnitudeA * magnitudeB);
    }
}

export const ragService = new RagService();
