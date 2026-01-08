

import type { Email } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, Mail } from 'lucide-react';
import { cn } from '../lib/utils';

interface EmailCardProps {
    email: Email;
    onClick?: () => void;
    className?: string;
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

export function EmailCard({ email, onClick, className }: EmailCardProps) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "group relative bg-surface hover:bg-surface-highlight border border-border/50 rounded-lg p-5 transition-all cursor-pointer",
                className
            )}
        >
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                        {email.from.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h4 className="font-medium text-text-primary text-sm leading-none mb-1">{email.from}</h4>
                        <p className="text-xs text-text-secondary">{formatDistanceToNow(new Date(email.date), { addSuffix: true })}</p>
                    </div>
                </div>
                <PriorityBadge priority={email.priority} />
            </div>

            <h3 className="text-base font-semibold text-text-primary mb-1.5 group-hover:text-primary transition-colors line-clamp-1">
                {email.subject}
            </h3>

            <p className="text-text-secondary text-sm line-clamp-2 mb-4 leading-relaxed">
                {email.summary || email.snippet || email.body.replace(/<[^>]*>?/gm, '')}
            </p>

            {/* AI Insights Section (if available) */}
            {email.isAnalyzed && (
                <div className="pt-3 border-t border-border flex flex-wrap gap-2">
                    {email.category && (
                        <span className="text-[10px] uppercase tracking-wider font-medium text-text-secondary">
                            {email.category}
                        </span>
                    )}
                    {(email.tags || []).map(tag => (
                        <span key={tag} className="text-[10px] bg-secondary/10 text-text-secondary px-1.5 py-0.5 rounded">
                            #{tag}
                        </span>
                    ))}
                    {email.suggestedReply && (
                        <span className="ml-auto text-xs text-primary flex items-center gap-1 font-medium">
                            <Mail className="w-3 h-3" /> Draft Ready
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
