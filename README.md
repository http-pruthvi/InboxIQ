# InboxIQ

**InboxIQ** is an intelligent email assistant designed to act as your second brain. Did you know the average professional spends **28% of their work week** just managing email? InboxIQ solves this by reading and understanding the *intent* of your emails using privacy-first **Retrieval Augmented Generation (RAG)**.

It goes beyond simple keywords to understand context, auto-prioritizes your feed, and extracts specific action items so you never miss a deadline.

## Core Features

-   **🧠 Intent Understanding**: Uses a local Llama 3 model to analyze the content and intent of every email, not just the subject line.
-   **🔥 Smart Prioritization**: Automatically sorts emails into **High**, **Medium**, and **Low** urgency based on context (e.g., identifying a boss or a critical deadline).
-   **✅ Action Item Extraction**: Automatically identifies tasks, deadlines, and deliverables buried in long threads and presents them in a dedicated **Tasks Sidebar**.
-   **💬 RAG-Powered Q&A**: Chat with your inbox! Ask questions like *"What is the status of the budget?"* or *"When is the team outing?"*. The system retrieves relevant past emails to generate accurate, context-aware answers.
-   **🔒 Privacy-First**: All AI processing happens locally using Ollama, ensuring your private data doesn't leave your machine for inference.

## Architecture

InboxIQ follows a modern, privacy-centric architecture:

1.  **Email Sync**: The **Node.js** backend fetches emails via IMAP/Gmail API.
2.  **Vector Embeddings**:
    -   Incoming emails are processed by a **Local Llama 3** instance (via Ollama).
    -   The system generates vector embeddings for the email subject and body.
3.  **Storage**:
    -   Metadata and content are stored in **Firebase Firestore**.
    -   Embeddings are stored in a vector store (currently in-memory/Firestore for MVP) to enable semantic search.
4.  **Retrieval Augmented Generation (RAG)**:
    -   When you ask a question, the system converts your query into a vector.
    -   It acts a **Cosine Similarity** search to find the most relevant emails.
    -   These emails are fed as "context" to Llama 3 to generate a precise answer.

## Tech Stack

**Frontend:**
-   **React (Vite)**: Fast, modern UI framework.
-   **TypeScript**: Ensures type safety across the codebase.
-   **Tailwind CSS**: For a clean, responsive, and modern design.
-   **Framer Motion**: Adds smooth animations for a premium feel.
-   **Lucide React**: Beautiful, consistent iconography.

**Backend:**
-   **Node.js & Express**: robust REST API.
-   **Firebase Admin SDK**: Secure interaction with Firestore.
-   **Google Auth Library**: Handles OAuth2 flow for Gmail access.
-   **Nodemailer & IMAP Simple**: Standard libraries for email protocols.
-   **Mailparser**: robust parsing of complex MIME email structures.

**AI & infrastructure:**
-   **Ollama**: Runs the Llama 3 LLM locally for free, private AI.
-   **Firebase Firestore**: NoSQL database for real-time data sync.

## Project Structure

```
Algoquest/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # UI Components (EmailCard, ChatInterface, etc.)
│   │   ├── pages/          # Main Pages (Inbox)
│   │   ├── hooks/          # Custom hooks (e.g. useKeyboardNavigation)
│   │   └── ...
├── server/                 # Node.js Backend
│   ├── src/
│   │   ├── services/       # Business Logic (aiService, ragService, emailService)
│   │   ├── controllers/    # API Request Handlers
│   │   └── ...
│   ├── .env                # Backend Configuration
│   └── serviceAccountKey.json # Firebase Admin Credentials
```

## Setup Guide

### 1. Prerequisites
-   **Node.js** (v18+ recommended).
-   **Ollama**: [Download here](https://ollama.com/) and run `ollama pull llama3`.
-   **Firebase Account**: For Firestore database.
-   **Google Cloud Project**: For Gmail API access.

### 2. Installation
Clone the repo and install dependencies for both client and server:

```bash
# Frontend
cd client
npm install

# Backend
cd ../server
npm install
```

### 3. Firebase Configuration
1.  Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com/).
2.  Enable **Firestore Database**.
3.  Go to **Project Settings > Service accounts**.
4.  Generate a new private key and save it as `server/serviceAccountKey.json`.

### 4. Google OAuth Configuration
1.  Create a project in [Google Cloud Console](https://console.cloud.google.com/).
2.  Enable the **Gmail API**.
3.  Configure **OAuth Consent Screen** (add test users).
4.  Create **OAuth Client ID** credentials (Web Application).
    -   **Redirect URI**: `http://localhost:3000/auth/google/callback`
5.  Copy Client ID and Secret to `.env`.

### 5. Environment Variables
Create `server/.env`:

```env
PORT=3000
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# AI Config (Optional, defaults shown)
AI_PROVIDER_URL=http://localhost:11434/api/generate
AI_MODEL=llama3
```

### 6. Running the App
Use the helper script to launch everything:

```bash
./start_app.bat
```

Or run manually:
-   **Server**: `npm run dev` (in `server/`)
-   **Client**: `npm run dev` (in `client/`)

## Troubleshooting

-   **Ollama Connection Error**: Ensure Ollama is running (`ollama serve`) and accessible at `http://localhost:11434`.
-   **Gmail Auth Error**: Ensure your Google Cloud Project is in "Testing" mode and your email is added as a test user, or usage is within free tier limits.
-   **Firebase Error**: Double-check `serviceAccountKey.json` path and permissions.

---
*Developed by Team Console.log for AlgosQuest 2025.*
