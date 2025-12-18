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
    deadline?: string;   // ISO Date string if detected
    spamScore?: number;  // 0.0 to 1.0
    reasoning?: string;  // Brief explanation for the priority/category
    embedding?: number[]; // Vector representation
    isReplied?: boolean;
    needsFollowUp?: boolean;
}

export interface Task {
    id: string;
    emailId: string;
    description: string;
    dueDate?: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
    priority?: 'HIGH' | 'MEDIUM' | 'LOW';
    createdAt: string;
}
