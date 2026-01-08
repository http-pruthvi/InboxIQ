import { OAuth2Client } from 'google-auth-library';
import fs from 'fs';
import path from 'path';

const CREDENTIALS_PATH = path.join(__dirname, '../../tokens.json');

export class AuthService {
    private client: OAuth2Client;

    constructor() {
        this.client = new OAuth2Client(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );
    }

    /**
     * Generate the URL for the user to login with Google
     */
    generateAuthUrl() {
        return this.client.generateAuthUrl({
            access_type: 'offline', // Required to get refresh token
            prompt: 'consent', // Force refresh token to be returned
            scope: [
                'https://mail.google.com/', // Full access to Gmail
                'https://www.googleapis.com/auth/userinfo.email'
            ]
        });
    }

    /**
     * Exchange the code received from Google for tokens
     */
    async getTokens(code: string) {
        const { tokens } = await this.client.getToken(code);
        this.saveTokens(tokens);
        this.client.setCredentials(tokens);
        return tokens;
    }

    /**
     * Get the current valid access token (refreshing if needed)
     */
    async getAccessToken() {
        // Load tokens if not loaded
        if (!this.client.credentials.access_token) {
            this.loadTokens();
        }

        // If no tokens, throw error (needs login)
        if (!this.client.credentials.refresh_token) {
            throw new Error('No refresh token found. User must login.');
        }

        // Check if token is expired or about to expire (optionally)
        // ideally google-auth-library handles this if we use getAccessToken() on the client instance
        // BUT, we need to ensure the client has the credentials SET.

        // Force refresh if needed
        try {
            const res = await this.client.getAccessToken();
            if (res.token) {
                this.saveTokens(this.client.credentials); // Save updated tokens (like expiry)
                return res.token;
            } else {
                throw new Error('No access token returned');
            }
        } catch (error) {
            console.error('Failed to refresh token:', error);
            throw error;
        }
    }

    /**
     * Helper to load tokens from disk
     */
    private loadTokens() {
        if (fs.existsSync(CREDENTIALS_PATH)) {
            const tokens = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));
            this.client.setCredentials(tokens);
        }
    }

    /**
     * Helper to save tokens to disk
     */
    private saveTokens(tokens: any) {
        const current = fs.existsSync(CREDENTIALS_PATH)
            ? JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'))
            : {};

        // Merge with existing to keep refresh_token if new one isn't returned
        const merged = { ...current, ...tokens };
        fs.writeFileSync(CREDENTIALS_PATH, JSON.stringify(merged, null, 2));
    }

    isAuthenticated(): boolean {
        this.loadTokens();
        return !!this.client.credentials.refresh_token; // Considered auth if we have refresh token
    }

    /**
     * Fetch the user's email from Google Profile
     */
    async getUserEmail(accessToken: string): Promise<string> {
        try {
            const client = new OAuth2Client();
            client.setCredentials({ access_token: accessToken });
            const response = await client.request({ url: 'https://www.googleapis.com/oauth2/v2/userinfo' });
            const data = response.data as any;
            return data.email;
        } catch (error) {
            console.error('Failed to fetch user email:', error);
            throw error;
        }
    }

    logout() {
        if (fs.existsSync(CREDENTIALS_PATH)) {
            fs.unlinkSync(CREDENTIALS_PATH);
        }
        this.client.setCredentials({});
    }
}

export const authService = new AuthService();
