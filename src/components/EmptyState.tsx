"use client";

interface EmptyStateProps {
    query?: string;
    onClearFilters?: () => void;
    onBrowseAll?: () => void;
}

export function EmptyState({ query, onClearFilters, onBrowseAll }: EmptyStateProps) {
    return (
        <div className="empty-state-refined">
            <svg className="empty-state-icon" viewBox="0 0 64 64" fill="none">
                <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" />
                <path d="M38 38L56 56" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M20 24L28 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M20 20L32 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M20 28L30 28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>

            <h2>No resources found{query ? ` for "${query}"` : ""}</h2>

            <div className="empty-state-suggestions">
                <h3>Try:</h3>
                <ul>
                    <li>Removing some filters</li>
                    <li>Using different keywords</li>
                    <li>Checking your spelling</li>
                    <li>Browsing all resources</li>
                </ul>
            </div>

            <div className="empty-state-actions">
                {onClearFilters && (
                    <button className="btn-secondary" onClick={onClearFilters}>
                        Clear filters
                    </button>
                )}
                {onBrowseAll && (
                    <button className="btn-primary" onClick={onBrowseAll}>
                        Browse all
                    </button>
                )}
            </div>
        </div>
    );
}
