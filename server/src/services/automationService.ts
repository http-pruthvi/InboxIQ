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
        console.log('Running Automation: Checking for unanswered emails...');
        try {
            // 1. Calculate cutoff time (24 hours ago)
            const cutoffDate = new Date();
            cutoffDate.setHours(cutoffDate.getHours() - 24);
            const cutoffIso = cutoffDate.toISOString();

            // 2. Query High/Medium priority emails
            // Note: Firestore limited on complex queries, so we'll fetch High/Medium and filter in code for MVP simplicity
            const snapshot = await this.collection
                .where('priority', 'in', ['HIGH', 'MEDIUM'])
                .get();

            let taskCount = 0;

            for (const doc of snapshot.docs) {
                const email = doc.data() as Email;

                // 3. Filter Logic
                // - Must be older than 24 hours
                // - Must NOT be replied to
                // - Must NOT already have a follow-up planned (needsFollowUp !== false, though we use that for manual flagging too)
                // - Let's use a specific flag like "automationTaskCreated" to avoid duplicates? 
                //   Or just check if tasks exist? taskService doesn't easily let us check "is there a task for this email".
                //   Let's check `email.needsFollowUp`. We will set it to true when we create a task.

                if (email.date < cutoffIso && !email.isReplied && !email.needsFollowUp) {

                    console.log(`Found unanswered email: ${email.id} - ${email.subject}`);

                    // 4. Create Task
                    await taskService.createTasksFromAnalysis(email.id, [`Follow up on unanswered email: "${email.subject}"`]);

                    // 5. Mark as processed to prevent duplicate tasks
                    await this.collection.doc(email.id).set({
                        needsFollowUp: true // Using this as "Follow up active/created" flag
                    }, { merge: true });

                    taskCount++;
                }
            }

            console.log(`Automation complete. Created ${taskCount} follow-up tasks.`);
            return taskCount;

        } catch (error) {
            console.error('Automation Service Error:', error);
            return 0;
        }
    }
}

export const automationService = new AutomationService();
