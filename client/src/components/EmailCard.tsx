

import type { Email } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, Mail } from 'lucide-react';
import { cn } from '../lib/utils';

interface EmailCardProps {
    email: Email;
    onClick?: () => void;
}

const PriorityBadge = ({ priority }: { priority: Email['priority'] }) => {
    const colors = {
        HIGH: 'bg-red-500/10 text-red-400 border-red-500/20',
        MEDIUM: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        LOW: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        NORMAL: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    };

    return (
        <span className={cn(
            "text-xs font-semibold px-2 py-0.5 rounded border capitalize flex items-center gap-1",
            colors[priority || 'NORMAL']
        )}>
            {priority === 'HIGH' && <AlertCircle className="w-3 h-3" />}
            {priority || 'NORMAL'}
        </span>
    );
};

export function EmailCard({ email, onClick }: EmailCardProps) {
    return (
        <div
            onClick={onClick}
            className="group relative bg-surface border border-slate-700/50 rounded-xl p-4 hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer overflow-hidden"
        >
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                        {email.from.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h4 className="font-medium text-slate-200 text-sm">{email.from}</h4>
                        <p className="text-xs text-slate-500">{formatDistanceToNow(new Date(email.date), { addSuffix: true })}</p>
                    </div>
                </div>
                <PriorityBadge priority={email.priority} />
            </div>

            <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-primary transition-colors line-clamp-1">
                {email.subject}
            </h3>

            <p className="text-slate-400 text-sm line-clamp-2 mb-3">
                {email.summary || email.body}
            </p>

            {/* AI Insights Section (if available) */}
            {email.isAnalyzed && (
                <div className="mt-3 pt-3 border-t border-slate-700/50 flex flex-wrap gap-2">
                    {email.category && (
                        <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                            {email.category}
                        </span>
                    )}
                    {(email.tags || []).map(tag => (
                        <span key={tag} className="text-xs bg-indigo-900/30 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                            #{tag}
                        </span>
                    ))}
                    {email.suggestedReply && (
                        <span className="text-xs bg-emerald-900/30 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                            <Mail className="w-3 h-3" /> Reply Drafted
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
