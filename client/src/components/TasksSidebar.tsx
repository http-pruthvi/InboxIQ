import { useEffect, useState } from 'react';
import { X, CheckCircle, Circle, Clock } from 'lucide-react';
import type { Task } from '../types';
import { cn } from '../lib/utils';
import { taskApi } from '../services/api';

interface TasksSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onTaskClick?: (emailId: string) => void;
}

export function TasksSidebar({ isOpen, onClose, onTaskClick }: TasksSidebarProps) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('PENDING');

    useEffect(() => {
        if (isOpen) {
            taskApi.getAll().then(setTasks).catch((err) => console.error('Failed to load tasks', err));
        }
    }, [isOpen]);

    const filteredTasks = (Array.isArray(tasks) ? tasks : []).filter(t => {
        if (filter === 'ALL') return true;
        if (filter === 'PENDING') return t.status !== 'COMPLETED';
        if (filter === 'COMPLETED') return t.status === 'COMPLETED';
        return true;
    });

    const handleToggleStatus = async (taskId: string, currentStatus: Task['status']) => {
        const newStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
        try {
            // Optimistic update
            setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
            await taskApi.update(taskId, { status: newStatus });
        } catch (error) {
            console.error('Failed to update task', error);
            // Revert on error
            setTasks(tasks.map(t => t.id === taskId ? { ...t, status: currentStatus } : t));
        }
    };

    return (
        <div className={cn(
            "fixed inset-y-0 right-0 w-80 bg-background border-l border-border transform transition-transform duration-300 ease-in-out z-50 shadow-2xl",
            isOpen ? "translate-x-0" : "translate-x-full"
        )}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-surface/50 backdrop-blur-sm">
                <h2 className="font-semibold text-white tracking-tight">Tasks</h2>
                <button onClick={onClose} className="text-text-secondary hover:text-white p-1 hover:bg-surface-highlight rounded-md transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Filter */}
            <div className="flex p-2 gap-1 border-b border-border">
                {(['PENDING', 'COMPLETED', 'ALL'] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={cn(
                            "flex-1 text-[10px] font-semibold py-1.5 rounded-sm transition-colors uppercase tracking-wider",
                            filter === f ? "bg-surface-highlight text-white" : "text-text-secondary hover:text-text-primary hover:bg-surface-highlight/50"
                        )}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Task List */}
            <div className="overflow-y-auto h-[calc(100%-8rem)] p-4 space-y-3">
                {filteredTasks.length === 0 && (
                    <div className="text-center py-10 text-text-secondary text-sm">
                        No tasks found.
                    </div>
                )}
                {filteredTasks.map(task => (
                    <div key={task.id} className="bg-surface hover:bg-surface-highlight/50 p-3 rounded-lg border border-border group transition-all">
                        <div className="flex items-start gap-3">
                            <button
                                onClick={() => handleToggleStatus(task.id, task.status)}
                                className="mt-0.5 text-text-secondary hover:text-primary transition-colors"
                            >
                                {task.status === 'COMPLETED' ? (
                                    <CheckCircle className="w-4 h-4 text-primary" />
                                ) : (
                                    <Circle className="w-4 h-4" />
                                )}
                            </button>
                            <div className="flex-1">
                                <p
                                    className={cn(
                                        "text-sm text-text-primary leading-snug cursor-pointer transition-colors",
                                        task.status === 'COMPLETED' ? "line-through text-text-secondary" : "hover:text-primary"
                                    )}
                                    onClick={() => onTaskClick?.(task.emailId)}
                                    title="View associated email"
                                >
                                    {task.description}
                                </p>
                                {task.dueDate ? (
                                    <div className="flex items-center gap-1.5 mt-2 text-xs text-secondary-foreground/70 group-hover:text-secondary-foreground transition-colors">
                                        <Clock className="w-3 h-3" />
                                        <input
                                            type="date"
                                            className="bg-transparent border-0 p-0 text-xs text-inherit focus:ring-0 cursor-pointer w-24 font-medium"
                                            value={(() => {
                                                const d = new Date(task.dueDate);
                                                const year = d.getFullYear();
                                                const month = String(d.getMonth() + 1).padStart(2, '0');
                                                const day = String(d.getDate()).padStart(2, '0');
                                                return `${year}-${month}-${day}`;
                                            })()}
                                            onChange={async (e) => {
                                                const newDateStr = e.target.value;
                                                if (!newDateStr) return;
                                                const [y, m, d] = newDateStr.split('-').map(Number);
                                                const localDate = new Date(y, m - 1, d);
                                                const isoDate = localDate.toISOString();
                                                try {
                                                    setTasks(tasks.map(t => t.id === task.id ? { ...t, dueDate: isoDate } : t));
                                                    await taskApi.update(task.id, { dueDate: isoDate });
                                                } catch (err) {
                                                    console.error('Failed to update date', err);
                                                }
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div className="mt-2 text-xs text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="flex items-center gap-1 cursor-pointer">
                                            <Clock className="w-3 h-3" />
                                            <input
                                                type="date"
                                                className="bg-transparent border-0 p-0 text-xs text-inherit focus:ring-0 cursor-pointer w-24"
                                                onChange={async (e) => {
                                                    const newDateStr = e.target.value;
                                                    if (!newDateStr) return;
                                                    const [y, m, d] = newDateStr.split('-').map(Number);
                                                    const localDate = new Date(y, m - 1, d);
                                                    const isoDate = localDate.toISOString();
                                                    try {
                                                        setTasks(tasks.map(t => t.id === task.id ? { ...t, dueDate: isoDate } : t));
                                                        await taskApi.update(task.id, { dueDate: isoDate });
                                                    } catch (err) {
                                                        console.error('Failed to set date', err);
                                                    }
                                                }}
                                            />
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}