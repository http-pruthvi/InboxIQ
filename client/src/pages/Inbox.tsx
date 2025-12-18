import { useEffect, useState } from 'react';
import { emailApi } from '../services/api';
import { EmailCard } from '../components/EmailCard';
import { TasksSidebar } from '../components/TasksSidebar';
import { LayoutGrid, List, RefreshCw, CheckCircle2, Loader2, AlertCircle, CheckSquare } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Email } from '../types';
import { EmailDetail } from '../components/EmailDetail';

export function Inbox() {
    const [emails, setEmails] = useState<Email[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
    const [isTasksOpen, setIsTasksOpen] = useState(false);

    const fetchEmails = async () => {
        try {
            setLoading(true);
            const data = await emailApi.getAll();
            setEmails(Array.isArray(data) ? data : []);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch emails:', err);
            setError('Failed to load emails. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        try {
            setSyncing(true);
            await emailApi.sync();
            await fetchEmails();
        } catch (err) {
            console.error('Failed to sync:', err);
        } finally {
            setSyncing(false);
        }
    };

    useEffect(() => {
        fetchEmails();
    }, []);

    if (loading && emails.length === 0) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    /* Render Detail View if selected */
    if (selectedEmail) {
        return <EmailDetail email={selectedEmail} onClose={() => setSelectedEmail(null)} />;
    }

    // Group emails by priority
    const priorityGroups = {
        HIGH: emails.filter(e => e.priority === 'HIGH'),
        MEDIUM: emails.filter(e => e.priority === 'MEDIUM'),
        LOW: emails.filter(e => e.priority === 'LOW' || e.priority === 'NORMAL' || !e.priority)
    };

    const renderSection = (title: string, items: Email[], colorClass: string) => {
        if (items.length === 0) return null;
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <h2 className={cn("text-lg font-semibold tracking-wide uppercase text-sm", colorClass)}>
                        {title}
                    </h2>
                    <span className="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded-full">
                        {items.length}
                    </span>
                </div>
                <div className={cn(
                    "grid gap-4",
                    viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
                )}>
                    {items.map((email) => (
                        <EmailCard
                            key={email.id}
                            email={email}
                            onClick={() => setSelectedEmail(email)}
                        />
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col space-y-6 p-8 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10 opacity-30 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px] -z-10 opacity-30 pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Smart Inbox</h1>
                    <p className="text-slate-400">
                        {loading ? 'Updating...' : `${emails.length} emails analyzed`}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsTasksOpen(true)}
                        className="p-2.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors border border-transparent hover:border-slate-700"
                        title="View Tasks"
                    >
                        <CheckSquare className="w-5 h-5" />
                    </button>

                    <div className="bg-slate-800/50 p-1 rounded-lg border border-slate-700/50 flex items-center">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={cn(
                                "p-2 rounded-md transition-all",
                                viewMode === 'grid' ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                            )}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn(
                                "p-2 rounded-md transition-all",
                                viewMode === 'list' ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                            )}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>

                    <button
                        onClick={handleSync}
                        disabled={syncing}
                        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-lg font-medium transition-all hover:shadow-lg hover:shadow-primary/25 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        <RefreshCw className={cn("w-4 h-4", syncing && "animate-spin")} />
                        {syncing ? 'Syncing...' : 'Sync Emails'}
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pb-8 pr-2 space-y-8">
                {renderSection('High Priority', priorityGroups.HIGH, 'text-red-400')}
                {renderSection('Actionable', priorityGroups.MEDIUM, 'text-yellow-400')}
                {renderSection('Everything Else', priorityGroups.LOW, 'text-blue-400')}

                {!loading && emails.length === 0 && !error && (
                    <div className="py-20 text-center">
                        <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700/50">
                            <CheckCircle2 className="w-10 h-10 text-slate-500" />
                        </div>
                        <h3 className="text-xl font-medium text-white mb-2">All Caught Up!</h3>
                        <p className="text-slate-400 max-w-sm mx-auto">
                            Your inbox is empty. Sync to check for new messages or enjoy your day!
                        </p>
                    </div>
                )}

            </div>

            <TasksSidebar isOpen={isTasksOpen} onClose={() => setIsTasksOpen(false)} />
        </div>
    );
}
