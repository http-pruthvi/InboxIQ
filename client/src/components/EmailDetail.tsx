
import { useState } from 'react';
import type { Email } from '../types';
import { emailApi, aiApi } from '../services/api';
import { X, Reply, Trash2, Archive, MoreVertical, Star, Tag, Sparkles, Wand2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

interface EmailDetailProps {
    email: Email;
    onClose: () => void;
    onAction?: (action: string) => void;
}

export function EmailDetail({ email, onClose, onAction }: EmailDetailProps) {
    const [isReplying, setIsReplying] = useState(false);
    const [replyBody, setReplyBody] = useState('');
    const [sending, setSending] = useState(false);

    const handleAction = (action: string) => {
        if (action === 'use_reply' && email.suggestedReply) {
            setReplyBody(email.suggestedReply);
            setIsReplying(true);
        } else if (action === 'edit_reply' && email.suggestedReply) {
            setReplyBody(email.suggestedReply);
            setIsReplying(true);
        } else if (onAction) {
            onAction(action);
        }
    };

    const [isAssistOpen, setIsAssistOpen] = useState(false);
    const [rewriting, setRewriting] = useState(false);

    const handleRewrite = async (tone: 'FORMAL' | 'CASUAL' | 'CONCISE' | 'CHECK_GRAMMAR') => {
        if (!replyBody) return;
        try {
            setRewriting(true);
            const result = await aiApi.rewrite(replyBody, tone);
            setReplyBody(result.rewritten);
            setIsAssistOpen(false);
        } catch (error) {
            console.error('Rewrite failed', error);
            alert('Failed to rewrite text.');
        } finally {
            setRewriting(false);
        }
    };

    const handleSendReply = async () => {
        try {
            setSending(true);
            await emailApi.send(email.from, `Re: ${email.subject}`, replyBody, email.id);
            setIsReplying(false);
            setReplyBody('');
            alert('Reply sent successfully!');
        } catch (error) {
            console.error('Failed to send reply:', error);
            alert('Failed to send reply.');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-background text-text-primary overflow-hidden relative">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-surface-highlight rounded-full transition-colors text-text-secondary hover:text-white"
                        title="Back to inbox"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div className="h-6 w-px bg-border mx-2" />
                    <button
                        onClick={() => handleAction('archive')}
                        className="p-2 hover:bg-surface-highlight rounded-full transition-colors text-text-secondary hover:text-white"
                        title="Archive"
                    >
                        <Archive className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => handleAction('delete')}
                        className="p-2 hover:bg-surface-highlight rounded-full transition-colors text-text-secondary hover:text-destructive"
                        title="Delete"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => handleAction('mark_unread')}
                        className="p-2 hover:bg-surface-highlight rounded-full transition-colors text-text-secondary hover:text-white"
                        title="Mark as unread"
                    >
                        <MailIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-surface-highlight rounded-full transition-colors text-text-secondary hover:text-yellow-400">
                        <Star className="w-5 h-5" />
                    </button>
                    <button className="p-2 hover:bg-surface-highlight rounded-full transition-colors text-text-secondary hover:text-white">
                        <MoreVertical className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Content Scroll Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10">
                <div className="max-w-4xl mx-auto space-y-8">

                    {/* Header Info */}
                    <div className="space-y-6">
                        <div className="flex items-start justify-between gap-4">
                            <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight tracking-tight">
                                {email.subject}
                            </h1>
                            {email.priority && email.priority !== 'NORMAL' && (
                                <span className={cn(
                                    "px-3 py-1 rounded-full text-[11px] font-bold border shrink-0 tracking-wide",
                                    email.priority === 'HIGH' ? "bg-red-500/10 text-red-400 border-red-500/20" :
                                        email.priority === 'MEDIUM' ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                                            "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                )}>
                                    {email.priority}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center justify-between pb-6 border-b border-border">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary">
                                    {email.from.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="font-semibold text-white flex items-center gap-2 text-sm">
                                        {email.from}
                                    </div>
                                    <div className="text-xs text-text-secondary mt-0.5">
                                        to me
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-medium text-text-primary">
                                    {format(new Date(email.date), 'MMM d, yyyy')}
                                </div>
                                <div className="text-[11px] text-text-secondary mt-0.5">
                                    {format(new Date(email.date), 'h:mm a')}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TL;DR Summary */}
                    {email.summary && (
                        <div className="bg-surface/30 border border-primary/20 rounded-xl p-5 flex gap-4">
                            <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                            <div>
                                <h3 className="text-xs font-bold text-primary mb-1.5 uppercase tracking-wider">AI Summary</h3>
                                <p className="text-text-primary text-sm leading-relaxed">
                                    {email.summary}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* AI Insights / Tags */}
                    {((email.tags && email.tags.length > 0) || email.category) && (
                        <div className="flex flex-wrap gap-2">
                            {email.category && (
                                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-highlight text-text-secondary text-xs font-medium border border-border">
                                    <Tag className="w-3 h-3" />
                                    {email.category}
                                </span>
                            )}
                            {email.tags?.map(tag => (
                                <span key={tag} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/10 text-text-secondary text-xs font-medium border border-border">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Email Body */}
                    <div
                        className="prose prose-invert max-w-none text-text-primary leading-loose [&>a]:text-primary [&>a]:underline opacity-90"
                        dangerouslySetInnerHTML={{ __html: email.body }}
                    />

                    {/* Attachments Section */}
                    {email.attachments && email.attachments.length > 0 && (
                        <div className="mt-8 border-t border-border pt-6">
                            <h3 className="text-sm font-semibold text-text-secondary mb-4 flex items-center gap-2">
                                <Tag className="w-4 h-4" />
                                {email.attachments.length} Attachment{email.attachments.length !== 1 ? 's' : ''}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {email.attachments.map((att, index) => (
                                    <a
                                        key={index}
                                        href={att.path}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-3 rounded-lg bg-surface border border-border hover:bg-surface-highlight transition-colors group"
                                    >
                                        <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                                            {att.contentType.startsWith('image/') ? (
                                                <img src={att.path} alt="" className="w-full h-full object-cover rounded" />
                                            ) : (
                                                <Tag className="w-5 h-5" />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-sm font-medium text-text-primary truncate" title={att.filename}>
                                                {att.filename}
                                            </div>
                                            <div className="text-xs text-text-secondary">
                                                {Math.round(att.size / 1024)} KB
                                            </div>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Suggested Reply */}
                    {email.suggestedReply && !isReplying && (
                        <div className="mt-8 p-6 rounded-xl bg-surface border border-border/50">
                            <div className="flex items-center gap-2 mb-3 text-primary">
                                <Reply className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">Suggested Reply</span>
                            </div>
                            <div className="bg-background/50 rounded-lg p-4 text-text-secondary text-sm italic border border-border">
                                "{email.suggestedReply}"
                            </div>
                            <div className="mt-4 flex gap-3">
                                <button
                                    onClick={() => handleAction('use_reply')}
                                    className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-md transition-colors shadow-lg shadow-primary/10"
                                >
                                    Use Draft
                                </button>
                                <button
                                    onClick={() => handleAction('edit_reply')}
                                    className="px-4 py-2 bg-surface hover:bg-surface-highlight text-text-primary text-sm font-medium rounded-md transition-colors border border-border"
                                >
                                    Edit
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Action Area / Reply Form */}
                    {isReplying ? (
                        <div className="pt-8 border-t border-border">
                            <h3 className="text-lg font-semibold text-white mb-4">Reply</h3>
                            <textarea
                                value={replyBody}
                                onChange={(e) => setReplyBody(e.target.value)}
                                className="w-full h-48 bg-surface-highlight/30 border border-border rounded-lg p-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 relative placeholder-text-secondary"
                                placeholder="Type your reply here..."
                            />

                            {/* AI Rewrite Toolbar */}
                            {replyBody.length > 5 && (
                                <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-2">
                                    <button
                                        onClick={() => setIsAssistOpen(!isAssistOpen)}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors border",
                                            isAssistOpen ? "bg-primary/20 text-primary border-primary/50" : "bg-surface text-text-secondary border-border hover:text-primary hover:border-primary/30"
                                        )}
                                    >
                                        <Wand2 className={cn("w-3.5 h-3.5", rewriting && "animate-spin")} />
                                        {rewriting ? 'Rewriting...' : 'Co-Pilot'}
                                    </button>

                                    {isAssistOpen && !rewriting && (
                                        <>
                                            <div className="w-px h-4 bg-border mx-1" />
                                            <button onClick={() => handleRewrite('FORMAL')} className="px-3 py-1.5 bg-surface hover:bg-surface-highlight text-text-primary rounded-md text-xs border border-border transition-colors">
                                                Professional
                                            </button>
                                            <button onClick={() => handleRewrite('CASUAL')} className="px-3 py-1.5 bg-surface hover:bg-surface-highlight text-text-primary rounded-md text-xs border border-border transition-colors">
                                                Friendly
                                            </button>
                                            <button onClick={() => handleRewrite('CONCISE')} className="px-3 py-1.5 bg-surface hover:bg-surface-highlight text-text-primary rounded-md text-xs border border-border transition-colors">
                                                Shorten
                                            </button>
                                            <button onClick={() => handleRewrite('CHECK_GRAMMAR')} className="px-3 py-1.5 bg-surface hover:bg-surface-highlight text-text-primary rounded-md text-xs border border-border transition-colors">
                                                Fix Grammar
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-3 mt-4">
                                <button
                                    onClick={() => setIsReplying(false)}
                                    className="px-4 py-2 bg-surface hover:bg-surface-highlight text-text-primary rounded-md font-medium transition-all text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSendReply}
                                    disabled={sending}
                                    className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-md font-medium transition-all disabled:opacity-50 text-sm"
                                >
                                    {sending ? 'Sending...' : 'Send'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="pt-8 border-t border-border flex gap-4">
                            <button
                                onClick={() => setIsReplying(true)}
                                className="flex items-center gap-2 px-6 py-2.5 bg-surface hover:bg-surface-highlight text-white rounded-md font-medium transition-all border border-border text-sm"
                            >
                                <Reply className="w-4 h-4" />
                                Reply
                            </button>
                            <button className="flex items-center gap-2 px-6 py-2.5 bg-surface hover:bg-surface-highlight text-white rounded-md font-medium transition-all border border-border text-sm">
                                <span className="rotate-180"><Reply className="w-4 h-4" /></span>
                                Forward
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function MailIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
    );
}
