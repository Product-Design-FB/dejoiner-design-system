"use client";

import { useState } from "react";

interface FilterBarProps {
    onFilterChange: (filters: {
        platform: string;
        type: string;
        sort: string;
        dateRange?: string;
        project?: string | null;
    }) => void;
    onSearchChange: (query: string) => void;
    searchQuery: string;
    projectCount?: number;
}

export function FilterBar({
    onFilterChange,
    onSearchChange,
    searchQuery,
    projectCount = 0
}: FilterBarProps) {
    const [platform, setPlatform] = useState("all");
    const [type, setType] = useState("all");
    const [sort, setSort] = useState("recent");
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [dateRange, setDateRange] = useState("all");
    const [selectedProject, setSelectedProject] = useState<string | null>(null);

    const handleFilterChange = (updates: Partial<{
        platform: string;
        type: string;
        sort: string;
        dateRange: string;
        project: string | null;
    }>) => {
        const newFilters = {
            platform: updates.platform ?? platform,
            type: updates.type ?? type,
            sort: updates.sort ?? sort,
            dateRange: updates.dateRange ?? dateRange,
            project: updates.project ?? selectedProject
        };

        if (updates.platform) setPlatform(updates.platform);
        if (updates.type) setType(updates.type);
        if (updates.sort) setSort(updates.sort);
        if (updates.dateRange) setDateRange(updates.dateRange);
        if (updates.project !== undefined) setSelectedProject(updates.project);

        onFilterChange(newFilters);
    };

    const clearFilters = () => {
        setPlatform("all");
        setType("all");
        setDateRange("all");
        setSelectedProject(null);
        onFilterChange({
            platform: "all",
            type: "all",
            sort,
            dateRange: "all",
            project: null
        });
    };

    const hasActiveFilters = platform !== "all" || type !== "all" || dateRange !== "all" || selectedProject !== null;

    return (
        <div className="filter-bar-container">
            {/* Basic filters - Always visible */}
            <div className="filter-bar-row">
                <div className="filter-bar-selects">
                    <select
                        className="filter-select"
                        value={platform}
                        onChange={(e) => handleFilterChange({ platform: e.target.value })}
                    >
                        <option value="all">Platform: All</option>
                        <option value="figma">Figma</option>
                        <option value="github">GitHub</option>
                        <option value="drive">Drive</option>
                    </select>

                    <select
                        className="filter-select"
                        value={type}
                        onChange={(e) => handleFilterChange({ type: e.target.value })}
                    >
                        <option value="all">Type: All</option>
                        <option value="design">Design</option>
                        <option value="code">Code</option>
                        <option value="docs">Docs</option>
                    </select>

                    <select
                        className="filter-select"
                        value={sort}
                        onChange={(e) => handleFilterChange({ sort: e.target.value })}
                    >
                        <option value="recent">Sort: Recent</option>
                        <option value="alphabetical">Sort: A-Z</option>
                        <option value="type">Sort: Type</option>
                        <option value="edited">Sort: Last Edited</option>
                    </select>

                    {hasActiveFilters && (
                        <button className="btn-ghost btn-sm clear-filters-btn" onClick={clearFilters}>
                            ✕ Clear
                        </button>
                    )}

                    <button
                        className="btn-ghost btn-sm more-filters-btn"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                    >
                        {showAdvanced ? "− Less" : "+ More"} filters
                    </button>
                </div>
            </div>

            {/* Advanced filters - Progressive disclosure */}
            {showAdvanced && (
                <div className="filter-bar-advanced">
                    <div className="filter-advanced-row">
                        <select
                            className="filter-select"
                            value={dateRange}
                            onChange={(e) => handleFilterChange({ dateRange: e.target.value })}
                        >
                            <option value="all">Date: All time</option>
                            <option value="today">Today</option>
                            <option value="week">This week</option>
                            <option value="month">This month</option>
                        </select>

                        {projectCount > 0 && (
                            <select
                                className="filter-select"
                                value={selectedProject || ""}
                                onChange={(e) => handleFilterChange({ project: e.target.value || null })}
                            >
                                <option value="">Project: All</option>
                                {/* Projects will be populated from parent */}
                            </select>
                        )}
                    </div>
                </div>
            )}

            {/* Search bar - Large and prominent */}
            <div className="filter-bar-search">
                <div className="search-input-wrapper">
                    <svg className="search-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M12.5 12.5L17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <input
                        type="text"
                        className="search-input-large"
                        placeholder="Search resources..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                    {searchQuery && (
                        <button
                            className="search-clear-btn"
                            onClick={() => onSearchChange("")}
                            aria-label="Clear search"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
