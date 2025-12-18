
import { useState } from 'react';
import type { Email } from '../types';
import { emailApi } from '../services/api';
import { X, Reply, Trash2, Archive, MoreVertical, Star, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

interface EmailDetailProps {
    email: Email;
    onClose: () => void;
}

export function EmailDetail({ email, onClose }: EmailDetailProps) {
    const [isReplying, setIsReplying] = useState(false);
    const [replyBody, setReplyBody] = useState('');
    const [sending, setSending] = useState(false);

    const handleAction = (action: string) => {
        console.log(`Action triggered: ${action} for email ${email.id}`);
        if (action === 'use_reply' && email.suggestedReply) {
            setReplyBody(email.suggestedReply);
            setIsReplying(true);
        } else if (action === 'edit_reply' && email.suggestedReply) {
            setReplyBody(email.suggestedReply);
            setIsReplying(true);
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
        <div className="h-full flex flex-col bg-slate-900 text-slate-200 overflow-hidden relative">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
                        title="Back to inbox"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div className="h-6 w-px bg-slate-800 mx-2" />
                    <button
                        onClick={() => handleAction('archive')}
                        className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
                        title="Archive"
                    >
                        <Archive className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => handleAction('delete')}
                        className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-red-400"
                        title="Delete"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => handleAction('mark_unread')}
                        className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
                        title="Mark as unread"
                    >
                        <MailIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-yellow-400">
                        <Star className="w-5 h-5" />
                    </button>
                    <button className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
                        <MoreVertical className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Content Scroll Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
                <div className="max-w-4xl mx-auto space-y-8">

                    {/* Header Info */}
                    <div className="space-y-4">
                        <div className="flex items-start justify-between gap-4">
                            <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                                {email.subject}
                            </h1>
                            {email.priority && email.priority !== 'NORMAL' && (
                                <span className={cn(
                                    "px-3 py-1 rounded-full text-xs font-semibold border shrink-0",
                                    email.priority === 'HIGH' ? "bg-red-500/10 text-red-400 border-red-500/20" :
                                        email.priority === 'MEDIUM' ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                                            "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                )}>
                                    {email.priority}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center justify-between pb-6 border-b border-slate-800">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg font-bold text-white shadow-lg shadow-indigo-500/20">
                                    {email.from.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="font-semibold text-white flex items-center gap-2">
                                        {email.from}
                                        <span className="text-xs font-normal text-slate-500 px-2 py-0.5 rounded-full bg-slate-800/50">
                                            Sender
                                        </span>
                                    </div>
                                    <div className="text-sm text-slate-400 mt-0.5">
                                        to me
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-medium text-slate-300">
                                    {format(new Date(email.date), 'MMM d, yyyy')}
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5">
                                    {format(new Date(email.date), 'h:mm a')}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* AI Insights / Tags */}
                    {((email.tags && email.tags.length > 0) || email.category) && (
                        <div className="flex flex-wrap gap-2">
                            {email.category && (
                                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700">
                                    <Tag className="w-3 h-3" />
                                    {email.category}
                                </span>
                            )}
                            {email.tags?.map(tag => (
                                <span key={tag} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-medium border border-indigo-500/20">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Email Body */}
                    <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {email.body}
                    </div>

                    {/* Suggested Reply */}
                    {email.suggestedReply && !isReplying && (
                        <div className="mt-8 p-6 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50">
                            <div className="flex items-center gap-2 mb-3 text-emerald-400">
                                <Reply className="w-4 h-4" />
                                <span className="text-sm font-semibold uppercase tracking-wider">AI Suggested Reply</span>
                            </div>
                            <div className="bg-slate-950/50 rounded-lg p-4 text-slate-300 text-sm italic border border-slate-800">
                                "{email.suggestedReply}"
                            </div>
                            <div className="mt-4 flex gap-3">
                                <button
                                    onClick={() => handleAction('use_reply')}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-emerald-900/20"
                                >
                                    Use This Reply
                                </button>
                                <button
                                    onClick={() => handleAction('edit_reply')}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors border border-slate-700"
                                >
                                    Edit
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Action Area / Reply Form */}
                    {isReplying ? (
                        <div className="pt-8 border-t border-slate-800">
                            <h3 className="text-lg font-semibold text-white mb-4">Reply</h3>
                            <textarea
                                value={replyBody}
                                onChange={(e) => setReplyBody(e.target.value)}
                                className="w-full h-48 bg-slate-950 border border-slate-800 rounded-lg p-4 text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="Type your reply here..."
                            />
                            <div className="flex items-center justify-end gap-3 mt-4">
                                <button
                                    onClick={() => setIsReplying(false)}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSendReply}
                                    disabled={sending}
                                    className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-all disabled:opacity-50"
                                >
                                    {sending ? 'Sending...' : 'Send Reply'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="pt-8 border-t border-slate-800 flex gap-4">
                            <button
                                onClick={() => setIsReplying(true)}
                                className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-all border border-slate-700"
                            >
                                <Reply className="w-4 h-4" />
                                Reply
                            </button>
                            <button className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-all border border-slate-700">
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
