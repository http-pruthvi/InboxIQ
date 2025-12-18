
export interface Email {
    id: string;
    from: string;
    subject: string;
    body: string;
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
}

export interface Task {
    id: string;
    emailId: string;
    description: string;
    dueDate?: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
}
