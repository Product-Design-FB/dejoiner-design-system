"use client";

interface PaginationProps {
    currentPage: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onLoadMore?: () => void;
    displayMode?: "pages" | "loadMore";
}

export function Pagination({
    currentPage,
    totalItems,
    itemsPerPage,
    onPageChange,
    onLoadMore,
    displayMode = "loadMore"
}: PaginationProps) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    const hasMore = currentPage < totalPages;

    if (displayMode === "loadMore") {
        return (
            <div className="pagination-container">
                <p className="result-count">
                    Showing {startItem}-{endItem} of {totalItems} results
                </p>

                {hasMore && (
                    <button
                        className="load-more-btn"
                        onClick={onLoadMore || (() => onPageChange(currentPage + 1))}
                    >
                        Load {Math.min(itemsPerPage, totalItems - endItem)} more
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="pagination-container">
            <p className="result-count">
                Showing {startItem}-{endItem} of {totalItems} results
            </p>

            <div className="pagination-controls">
                <button
                    className="pagination-btn"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    ← Previous
                </button>

                <span className="pagination-info">
                    Page {currentPage} of {totalPages}
                </span>

                <button
                    className="pagination-btn"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                >
                    Next →
                </button>
            </div>
        </div>
    );
}
