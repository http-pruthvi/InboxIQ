import { useEffect, useState } from 'react';
// Force HMR update
import { emailApi, authApi } from '../services/api'; // Updated import
import { EmailCard } from '../components/EmailCard';
import { TasksSidebar } from '../components/TasksSidebar';
import { ChatInterface } from '../components/ChatInterface';
import { LayoutGrid, List, RefreshCw, CheckCircle2, Loader2, AlertCircle, CheckSquare, LogIn } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Email } from '../types';
import { EmailDetail } from '../components/EmailDetail';
import { SkeletonEmailCard } from '../components/SkeletonEmailCard';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';

export function Inbox() {
    const [emails, setEmails] = useState<Email[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
    const [isTasksOpen, setIsTasksOpen] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    const checkAuth = async () => {
        const status = await authApi.checkContext();
        setIsAuthenticated(status.isAuthenticated);
        return status.isAuthenticated;
    };

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
            setError('Sync failed. Please try "Connect Gmail" again if issues persist.');
        } finally {
            setSyncing(false);
        }
    };

    const handleOptimisticAction = async (emailId: string, action: 'archive' | 'delete') => {
        // Optimistic Update
        const previousEmails = [...emails];
        setEmails(emails.filter(e => e.id !== emailId));

        // Close detail view if it was the selected email
        if (selectedEmail?.id === emailId) {
            setSelectedEmail(null);
        }

        try {
            // Need to implement archive/delete API endpoints eventually
            console.log(`Optimistically ${action}d ${emailId}`);

            // Simulating API call
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error(`Failed to ${action}`, error);
            setEmails(previousEmails);
            setError(`Failed to ${action} email. Restored.`);
        }
    };

    const { selectedIndex } = useKeyboardNavigation({
        emails,
        onSelect: setSelectedEmail,
        onArchive: (e) => handleOptimisticAction(e.id, 'archive'),
        onDelete: (e) => handleOptimisticAction(e.id, 'delete'),
        onReply: (e) => { console.log('Reply trigger via keyboard', e.id); },
        isOpen: !!selectedEmail
    });

    useEffect(() => {
        // Authenticate first
        checkAuth().then(isAuth => {
            if (isAuth) {
                fetchEmails();
            } else {
                setLoading(false);
            }
        });
    }, []);

    // Auth Loading State
    if (isAuthenticated === null) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-950">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Connect Gmail Screen
    if (!isAuthenticated) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-950 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10 opacity-30" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px] -z-10 opacity-30" />

                <div className="max-w-md w-full p-8 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl text-center">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <LogIn className="w-10 h-10 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-3">Welcome to InboxIQ</h1>
                    <p className="text-slate-400 mb-8">
                        Connect your Gmail account to enable AI prioritization, smart replies, and automated task management.
                    </p>
                    <a
                        href="http://localhost:3000/auth/google"
                        className="flex items-center justify-center w-full py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] gap-3"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Sign in with Google
                    </a>
                </div>
            </div>
        );
    }

    if (loading && emails.length === 0) {
        return (
            <div className="h-full bg-background p-8 space-y-8">
                <div className="space-y-4">
                    <div className="h-6 w-32 bg-surface animate-pulse rounded" />
                    <div className={cn(
                        "grid gap-4",
                        viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
                    )}>
                        {[...Array(6)].map((_, i) => (
                            <SkeletonEmailCard key={i} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    /* Render Detail View if selected */
    if (selectedEmail) {
        return (
            <EmailDetail
                email={selectedEmail}
                onClose={() => setSelectedEmail(null)}
                onAction={(action) => handleOptimisticAction(selectedEmail.id, action as 'archive' | 'delete')}
            />
        );
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
                    {items.map((email) => {
                        const globalIndex = emails.indexOf(email);
                        const isKeyboardSelected = globalIndex === selectedIndex && !selectedEmail;

                        return (
                            <EmailCard
                                key={email.id}
                                email={email}
                                onClick={() => setSelectedEmail(email)}
                                className={isKeyboardSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
                            />
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col relative overflow-hidden bg-background">
            {/* Minimal Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-border bg-surface/30 backdrop-blur-sm sticky top-0 z-10">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-white">Inbox</h1>
                    <p className="text-text-secondary text-sm flex items-center gap-2">
                        {loading ? (
                            <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span>Syncing...</span>
                            </>
                        ) : (
                            <span>{emails.length} messages</span>
                        )}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsTasksOpen(true)}
                        className="p-2 hover:bg-surface-highlight rounded-md text-text-secondary hover:text-white transition-colors"
                        title="View Tasks"
                    >
                        <CheckSquare className="w-5 h-5" />
                    </button>

                    <div className="h-4 w-px bg-border mx-1" />

                    <div className="bg-surface-highlight p-1 rounded-md flex items-center">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={cn(
                                "p-1.5 rounded-sm transition-all",
                                viewMode === 'grid' ? "bg-background shadow-sm text-white" : "text-text-secondary hover:text-white"
                            )}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn(
                                "p-1.5 rounded-sm transition-all",
                                viewMode === 'list' ? "bg-background shadow-sm text-white" : "text-text-secondary hover:text-white"
                            )}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>

                    <button
                        onClick={handleSync}
                        disabled={syncing}
                        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-medium transition-all disabled:opacity-50 ml-2"
                    >
                        <RefreshCw className={cn("w-3.5 h-3.5", syncing && "animate-spin")} />
                        {syncing ? 'Syncing' : 'Sync'}
                    </button>

                    <button
                        onClick={async () => {
                            await authApi.logout();
                            window.location.reload();
                        }}
                        className="p-2 hover:bg-surface-highlight/50 rounded-md text-text-secondary hover:text-destructive transition-colors ml-1"
                        title="Logout"
                    >
                        <LogIn className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mx-8 mt-4 bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-lg flex items-center gap-3 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-6 space-y-8">
                {renderSection('High Priority', priorityGroups.HIGH, 'text-red-400')}
                {renderSection('Requires Action', priorityGroups.MEDIUM, 'text-yellow-400')}
                {renderSection('Other', priorityGroups.LOW, 'text-blue-400')}

                {!loading && emails.length === 0 && !error && (
                    <div className="py-20 text-center flex flex-col items-center justify-center opacity-60">
                        <CheckCircle2 className="w-12 h-12 text-secondary mb-4" strokeWidth={1} />
                        <h3 className="text-lg font-medium text-white mb-1">Inbox Zero</h3>
                        <p className="text-text-secondary text-sm">
                            You're all caught up.
                        </p>
                    </div>
                )}
            </div>

            <TasksSidebar
                isOpen={isTasksOpen}
                onClose={() => setIsTasksOpen(false)}
                onTaskClick={(emailId) => {
                    const found = emails.find(e => e.id === emailId || `email_${e.id}` === emailId || e.id === `email_${emailId}`);
                    if (found) {
                        setSelectedEmail(found);
                    } else {
                        console.warn(`Email ${emailId} not found`);
                        setError("Could not find the linked email.");
                        setTimeout(() => setError(null), 3000);
                    }
                }}
            />
            <ChatInterface />
        </div >
    );
}
