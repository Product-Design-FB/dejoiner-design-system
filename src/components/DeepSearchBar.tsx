'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { debounce } from 'lodash';

interface SearchResult {
    id: string;
    title: string;
    source: 'figma' | 'github' | 'drive';
    type: string;
    sourceUrl: string;
    thumbnailUrl?: string;
    lastEditedAt?: string;
    matchedIn?: {
        field: 'contentIndex' | 'title' | 'metadata';
        text: string;
        location: string;
        nodeId?: string;
    } | null;
}

interface DeepSearchBarProps {
    onResultClick?: (result: SearchResult) => void;
}

export default function DeepSearchBar({ onResultClick }: DeepSearchBarProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch search results
    const fetchResults = async (searchQuery: string) => {
        if (!searchQuery || searchQuery.length === 0) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`/api/search/quick?q=${encodeURIComponent(searchQuery)}&limit=6`);
            const data = await response.json();
            setResults(data.results || []);
            setIsOpen(true);
            setSelectedIndex(0);
        } catch (error) {
            console.error('Search error:', error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    // Debounced search function (150ms)
    const debouncedSearch = useCallback(
        debounce((searchQuery: string) => fetchResults(searchQuery), 150),
        []
    );

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);
        debouncedSearch(value);
    };

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (results[selectedIndex]) {
                    handleResultClick(results[selectedIndex]);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                inputRef.current?.blur();
                break;
        }
    };

    // Handle result click
    const handleResultClick = (result: SearchResult) => {
        let url = result.sourceUrl;

        // Add Figma node-id for deep linking
        if (result.source === 'figma' && result.matchedIn?.nodeId) {
            url += `?node-id=${result.matchedIn.nodeId}`;
        }

        window.open(url, '_blank');
        setIsOpen(false);
        setQuery('');

        onResultClick?.(result);
    };

    // Handle clear
    const handleClear = () => {
        setQuery('');
        setResults([]);
        setIsOpen(false);
        inputRef.current?.focus();
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Format source icon
    const getSourceIcon = (source: string) => {
        switch (source) {
            case 'figma':
                return '🟧';
            case 'github':
                return '⚫';
            case 'drive':
                return '🔵';
            default:
                return '📄';
        }
    };

    // Format time ago
    const formatTimeAgo = (dateString?: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };

    return (
        <div className="deep-search-container">
            <div className="deep-search-input-wrapper">
                <span className="search-icon">🔍</span>
                <input
                    ref={inputRef}
                    id="deep-search-input"
                    type="text"
                    className="deep-search-input"
                    placeholder="Search resources... (Cmd+K)"
                    value={query}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => query && setIsOpen(true)}
                />
                {query && (
                    <button className="search-clear-btn" onClick={handleClear} aria-label="Clear search">
                        ✕
                    </button>
                )}
            </div>

            {/* Dropdown */}
            {isOpen && (
                <>
                    <div className="search-dropdown-backdrop" onClick={() => setIsOpen(false)} />
                    <div ref={dropdownRef} className="search-dropdown" role="listbox">
                        {loading ? (
                            <div className="search-loading">
                                <div className="spinner-small"></div>
                                <span>Searching...</span>
                            </div>
                        ) : results.length > 0 ? (
                            <>
                                {results.map((result, index) => (
                                    <div
                                        key={result.id}
                                        className={`search-result-item ${index === selectedIndex ? 'search-result-item-active' : ''}`}
                                        onClick={() => handleResultClick(result)}
                                        role="option"
                                        aria-selected={index === selectedIndex}
                                    >
                                        <div className="search-result-icon">{getSourceIcon(result.source)}</div>
                                        <div className="search-result-content">
                                            <div className="search-result-title">{result.title}</div>
                                            {result.matchedIn && (
                                                <div className="search-result-match">
                                                    match in "{result.matchedIn.text}"
                                                    {result.matchedIn.location && (
                                                        <span className="search-match-location"> · {result.matchedIn.location}</span>
                                                    )}
                                                </div>
                                            )}
                                            <div className="search-result-meta">
                                                {result.source} · {formatTimeAgo(result.lastEditedAt) || 'Recently added'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div className="search-see-all">
                                    <a href={`/?q=${encodeURIComponent(query)}`} className="search-see-all-link">
                                        🔍 See all results for "{query}"
                                    </a>
                                </div>
                            </>
                        ) : (
                            <div className="search-empty">
                                <span>No results for "{query}"</span>
                                <p>Try different keywords or check spelling</p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
