
export interface Email {
    id: string;
    from: string;
    subject: string;
    body: string;
    snippet?: string;
    date: string;
    isRead: boolean;
    priority?: 'HIGH' | 'MEDIUM' | 'LOW' | 'NORMAL';
    category?: 'WORK' | 'PERSONAL' | 'NEWSLETTER' | 'PROMOTION' | 'OTHER';
    summary?: string;
    suggestedReply?: string;
    tags?: string[];
    isAnalyzed?: boolean;
    deadline?: string;
    spamScore?: number;
    reasoning?: string;
    attachments?: {
        filename: string;
        path: string;
        contentType: string;
        size: number;
    }[];
}

export interface Task {
    id: string;
    emailId: string;
    description: string;
    dueDate?: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
}
