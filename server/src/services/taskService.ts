import { db } from '../firebase';
import { Task } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class TaskService {
    private collection = db.collection('tasks');

    async createTasksFromAnalysis(emailId: string, taskDescriptions: string[], dueDate?: string | null): Promise<void> {
        if (!taskDescriptions || taskDescriptions.length === 0) return;

        const batch = db.batch();

        taskDescriptions.forEach(desc => {
            const taskId = `task_${uuidv4()}`;
            const taskRef = this.collection.doc(taskId);

            const newTask: Task = {
                id: taskId,
                emailId: emailId,
                description: desc,
                status: 'PENDING',
                createdAt: new Date().toISOString(),
                priority: 'MEDIUM', // Default, can be improved later
                dueDate: dueDate || null
            };

            batch.set(taskRef, newTask);
        });

        await batch.commit();
        console.log(`Created ${taskDescriptions.length} tasks for email ${emailId} with due date: ${dueDate}`);
    }

    async getTasks(): Promise<Task[]> {
        const snapshot = await this.collection.orderBy('createdAt', 'desc').get();
        return snapshot.docs.map(doc => doc.data() as Task);
    }

    async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
        await this.collection.doc(taskId).update(updates);
    }
}

export const taskService = new TaskService();
