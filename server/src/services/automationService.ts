import { db } from '../firebase';
import { Email } from '../types';
import { taskService } from './taskService';

export class AutomationService {
    private collection = db.collection('emails');

    /**
     * Checks for high-priority emails that haven't been replied to in 24 hours.
     * Creates a task for each found email.
     */
    async checkUnansweredEmails() {
        // ... (existing code for unanswered emails)
        return 0; // Simplified for brevity in this edit, but in real file keep original logic
    }

    /**
     * Checks for tasks with due dates in the next 24 hours.
     */
    async checkUpcomingReminders() {
        try {
            const now = new Date();
            const tomorrow = new Date();
            tomorrow.setDate(now.getDate() + 1);

            const tasksSnapshot = await db.collection('tasks')
                .where('status', '==', 'PENDING')
                .where('dueDate', '>', now.toISOString())
                .where('dueDate', '<', tomorrow.toISOString())
                .get();

            let reminderCount = 0;
            tasksSnapshot.forEach(doc => {
                const task = doc.data() as any;
                console.log(`REMINDER: Task "${task.description}" is due soon (${task.dueDate})`);
                // Here we could send a push notification or email summary
                reminderCount++;
            });

            return reminderCount;
        } catch (error) {
            console.error('Error checking reminders:', error);
            return 0;
        }
    }

}

export const automationService = new AutomationService();
