

export function SkeletonEmailCard() {
    return (
        <div className="bg-surface border border-border/50 rounded-lg p-5 animate-pulse">
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    {/* Avatar Skeleton */}
                    <div className="w-8 h-8 rounded-full bg-surface-highlight" />
                    <div className="space-y-1.5">
                        {/* Sender Name Skeleton */}
                        <div className="h-3 w-24 bg-surface-highlight rounded" />
                        {/* Time Skeleton */}
                        <div className="h-2 w-16 bg-surface-highlight/70 rounded" />
                    </div>
                </div>
                {/* Priority Badge Skeleton */}
                <div className="h-5 w-16 bg-surface-highlight rounded" />
            </div>

            {/* Subject Skeleton */}
            <div className="h-4 w-3/4 bg-surface-highlight rounded mb-3" />

            {/* Body Snippet Skeleton */}
            <div className="space-y-2 mb-4">
                <div className="h-3 w-full bg-surface-highlight/50 rounded" />
                <div className="h-3 w-5/6 bg-surface-highlight/50 rounded" />
            </div>

            {/* Tags Skeleton */}
            <div className="pt-3 border-t border-border/50 flex gap-2">
                <div className="h-4 w-12 bg-surface-highlight rounded" />
                <div className="h-4 w-16 bg-surface-highlight rounded" />
            </div>
        </div>
    );
}
