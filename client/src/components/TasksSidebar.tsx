import { useEffect, useState } from 'react';
import { X, CheckCircle, Circle, Clock } from 'lucide-react';
import type { Task } from '../types';
import { cn } from '../lib/utils';
import { taskApi } from '../services/api';

interface TasksSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export function TasksSidebar({ isOpen, onClose }: TasksSidebarProps) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('PENDING');

    useEffect(() => {
        if (isOpen) {
            taskApi.getAll().then(setTasks).catch((err: any) => console.error('Failed to load tasks', err));
        }
    }, [isOpen]);

    const filteredTasks = tasks.filter(t => {
        if (filter === 'ALL') return true;
        if (filter === 'PENDING') return t.status !== 'COMPLETED';
        if (filter === 'COMPLETED') return t.status === 'COMPLETED';
        return true;
    });

    return (
        <div className={cn(
            "fixed inset-y-0 right-0 w-80 bg-slate-900 border-l border-slate-800 transform transition-transform duration-300 ease-in-out z-50",
            isOpen ? "translate-x-0" : "translate-x-full"
        )}>
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
                <h2 className="font-semibold text-white">Tasks</h2>
                <button onClick={onClose} className="text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Filter */}
            <div className="flex p-2 gap-1 border-b border-slate-800">
                {(['PENDING', 'COMPLETED', 'ALL'] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={cn(
                            "flex-1 text-xs font-medium py-1.5 rounded-md transition-colors",
                            filter === f ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-300"
                        )}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Task List */}
            <div className="overflow-y-auto h-[calc(100%-8rem)] p-4 space-y-3">
                {filteredTasks.map(task => (
                    <div key={task.id} className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 group hover:border-slate-600 transition-colors">
                        <div className="flex items-start gap-3">
                            <button className="mt-0.5 text-slate-500 hover:text-emerald-400 transition-colors">
                                {task.status === 'COMPLETED' ? (
                                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                                ) : (
                                    <Circle className="w-4 h-4" />
                                )}
                            </button>
                            <div className="flex-1">
                                <p className={cn(
                                    "text-sm text-slate-200 leading-snug",
                                    task.status === 'COMPLETED' && "line-through text-slate-500"
                                )}>
                                    {task.description}
                                </p>
                                {task.dueDate && (
                                    <div className="flex items-center gap-1 mt-2 text-xs text-amber-500/80">
                                        <Clock className="w-3 h-3" />
                                        <span>Due {task.dueDate}</span>
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
