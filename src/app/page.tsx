"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";

// Mock data for fallback
const mockResources = [
  {
    id: "1",
    title: "Terrain Follow Logic - Figma",
    project: { name: "3D Mission Planning" },
    type: "figma",
    url: "https://www.figma.com/file/mock1",
    thumbnail_url: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&w=800&q=80",
    version: "v1.2",
    created_at: "2024-01-19T10:00:00Z",
    last_edited_at: "2024-01-19T11:45:00Z",
    metadata: { frames: ["Main Flow", "Settings", "Error States"] },
    slack_context: [{ slack_text: "Use this for the terrain follow logic.", gemini_summary: "Waypoint-based height maps." }]
  },
  {
    id: "2",
    title: "API Documentation - GitHub",
    project: { name: "Core Engine" },
    type: "github",
    url: "https://github.com/mock2",
    thumbnail_url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80",
    version: "v2.0",
    created_at: "2024-01-18T15:30:00Z",
    slack_context: [{ slack_text: "Updated the POST endpoint.", gemini_summary: "New backend endpoints." }]
  }
];

type FilterType = 'all' | 'figma' | 'figjam' | 'github' | 'drive' | 'docs';
type SortType = 'recent' | 'alphabetical' | 'type' | 'creation' | 'edit';

const getSourceIcon = (type: string) => {
  switch (type) {
    case 'figma': return '❖';
    case 'figjam': return '🟣';
    case 'github': return '⪧';
    case 'docs': return '📄';
    case 'drive': return '📁';
    default: return '🔗';
  }
};

const getSourceBadgeClass = (type: string) => {
  switch (type) {
    case 'figma': return 'badge-figma';
    case 'figjam': return 'badge-figjam';
    case 'github': return 'badge-github';
    case 'docs': return 'badge-docs';
    case 'drive': return 'badge-drive';
    default: return 'badge-default';
  }
};

export default function Home() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('recent');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  const [newUrl, setNewUrl] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("");

  // Detail Panel State
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [relatedResources, setRelatedResources] = useState<any[]>([]);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, resource: any } | null>(null);

  // Edit Modal State
  const [editModal, setEditModal] = useState<any>(null);
  const [editForm, setEditForm] = useState({ title: '', version: '', url: '', context: '' });

  // Filter Panel State
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('resources')
        .select(`
          *,
          project:projects(name),
          slack_context(slack_text, gemini_summary),
          author_name,
          author_avatar
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const { data: adminData } = await supabase.from('admins').select('slack_user_id, name');

      const userMap: Record<string, string> = {};
      if (adminData) {
        adminData.forEach((a: any) => {
          if (a.slack_user_id && a.name) userMap[a.slack_user_id] = a.name;
        });
      }

      const enhancedData = data?.map((r: any) => ({
        ...r,
        author_name: userMap[r.slack_user_id] || r.author_name || 'Unknown'
      }));

      setResources(enhancedData && enhancedData.length > 0 ? enhancedData : mockResources);
    } catch (err) {
      console.warn("Supabase fetch failed:", err);
      setResources(mockResources);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const filteredResources = useMemo(() => {
    let result = [...resources];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      console.log(`🔍 Searching for: "${query}" in ${result.length} items`);
      result = result.filter(r => {
        const titleMatch = r.title?.toLowerCase().includes(query);
        const projectMatch = r.project?.name?.toLowerCase().includes(query);
        const urlMatch = r.url?.toLowerCase().includes(query);
        const typeMatch = r.type?.toLowerCase().includes(query);
        const authorMatch = r.author_name?.toLowerCase().includes(query);
        const milestoneMatch = r.metadata?.milestone?.toLowerCase().includes(query);
        const framesMatch = r.metadata?.frames?.some((f: string) => f.toLowerCase().includes(query));
        const contextMatch = r.slack_context?.some((c: any) => c.slack_text?.toLowerCase().includes(query) || c.gemini_summary?.toLowerCase().includes(query));

        const match = titleMatch || projectMatch || urlMatch || typeMatch || authorMatch || milestoneMatch || framesMatch || contextMatch;
        if (!match && result.length < 5) console.log(`❌ No match for ${r.title}:`, { titleMatch, projectMatch, urlMatch });
        return match;
      });
      console.log(`✅ Found ${result.length} matches`);
    }

    // Type filter
    if (activeFilter !== 'all') {
      if (activeFilter === 'drive') {
        result = result.filter(r => r.type === 'drive' || r.type === 'docs');
      } else if (activeFilter === 'docs') {
        result = result.filter(r => r.type === 'docs');
      } else {
        result = result.filter(r => r.type === activeFilter);
      }
    }


    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(startOfToday.getTime() - (startOfToday.getDay() * 24 * 60 * 60 * 1000));
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      result = result.filter(r => {
        const createdAt = new Date(r.created_at);
        if (dateFilter === 'today') return createdAt >= startOfToday;
        if (dateFilter === 'week') return createdAt >= startOfWeek;
        if (dateFilter === 'month') return createdAt >= startOfMonth;
        return true;
      });
    }

    // Sorting
    if (sortBy === 'recent') {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === 'alphabetical') {
      result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sortBy === 'type') {
      result.sort((a, b) => (a.type || '').localeCompare(b.type || ''));
    } else if (sortBy === 'creation') {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === 'edit') {
      result.sort((a, b) => {
        const dateA = new Date(a.last_edited_at || a.created_at).getTime();
        const dateB = new Date(b.last_edited_at || b.created_at).getTime();
        return dateB - dateA;
      });
    }

    return result;
  }, [resources, searchQuery, activeFilter, sortBy, dateFilter]);

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;
    try {
      const type = newUrl.includes('figma.com') ? 'figma' :
        newUrl.includes('github.com') ? 'github' :
          newUrl.includes('docs.google.com') ? 'docs' :
            'drive';

      const response = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl, title: newTitle, type, authorName: newAuthor })
      });

      const data = await response.json();

      if (response.status === 409) {
        const existing = data.existing;
        const addedDate = new Date(existing.created_at).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric'
        });
        alert(`🔄 Duplicate File Detected!\n\nThis URL is already indexed:\n\n📄 "${existing.title}"\n👤 Added by: ${existing.author_name || 'Unknown'}\n📅 on ${addedDate}\n\nPlease check the dashboard instead.`);
        setShowAddModal(false);
        return;
      }

      if (!response.ok) throw new Error(data.error || 'Failed to add resource');

      setNewUrl(""); setNewTitle(""); setNewAuthor(""); setShowAddModal(false);
      fetchResources();
      alert("✅ Resource Added Successfully! 🚀");
    } catch (err) {
      alert("❌ Error: " + (err as any).message);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Fuzzy matching helper
  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix: number[][] = [];
    for (let i = 0; i <= str2.length; i++) matrix[i] = [i];
    for (let j = 0; j <= str1.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  };

  // Open detail panel
  const openDetailPanel = (resource: any) => {
    setSelectedResource(resource);

    // Find related resources (Smart Matching)
    const related = resources
      .filter(r => r.id !== resource.id)
      .map(r => {
        let score = 0;
        // Same Project (High Priority)
        if (resource.project?.name && r.project?.name === resource.project?.name) score += 50;

        // Similar Title
        const distance = levenshteinDistance(resource.title.toLowerCase(), r.title.toLowerCase());
        const maxLen = Math.max(resource.title.length, r.title.length);
        const similarity = 1 - (distance / maxLen);
        if (similarity > 0.4) score += (similarity * 30);

        // Same Type (Low Priority)
        if (r.type === resource.type) score += 5;

        // Same Author
        if (r.author_name === resource.author_name) score += 10;

        return { ...r, score };
      })
      .sort((a, b) => b.score - a.score)
      .filter(r => r.score > 10) // Only sufficiently related
      .slice(0, 5);

    setRelatedResources(related);
  };

  // Handle context menu
  const handleContextMenu = (e: React.MouseEvent, resource: any) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, resource });
  };

  const closeContextMenu = () => setContextMenu(null);

  // Open edit modal
  const openEditModal = (resource: any) => {
    setEditModal(resource);
    setEditForm({
      title: resource.title || '',
      version: resource.version || 'v1.0',
      url: resource.url || '',
      context: resource.slack_context?.[0]?.slack_text || ''
    });
    setContextMenu(null);
  };

  // Save edit
  const saveEdit = async () => {
    if (!editModal) return;
    try {
      // 1. Update Resource Details
      const { error: resourceError } = await supabase.from('resources').update({
        title: editForm.title,
        version: editForm.version,
        url: editForm.url
      }).eq('id', editModal.id);

      if (resourceError) throw resourceError;

      // 2. Update Context (Slack Text)
      if (editForm.context !== undefined) {
        // Check if context exists
        const { data: existing } = await supabase.from('slack_context')
          .select('id')
          .eq('resource_id', editModal.id)
          .single();

        if (existing) {
          await supabase.from('slack_context')
            .update({ slack_text: editForm.context })
            .eq('id', existing.id);
        } else if (editForm.context.trim()) {
          await supabase.from('slack_context').insert([{
            resource_id: editModal.id,
            slack_text: editForm.context,
            author_name: 'Edited via Admin' // or keep unknown
          }]);
        }
      }

      fetchResources();
      setEditModal(null);
      if (selectedResource?.id === editModal.id) {
        // Optimistic update for UI
        setSelectedResource({
          ...selectedResource,
          ...editForm,
          slack_context: [{ ...selectedResource.slack_context?.[0], slack_text: editForm.context }]
        });
      }
    } catch (err) {
      alert('Error saving: ' + (err as any).message);
    }
  };

  // Delete resource
  const deleteResource = async (resource: any) => {
    if (!confirm(`Delete "${resource.title}"?`)) return;
    try {
      const { error } = await supabase.from('resources').delete().eq('id', resource.id);
      if (error) throw error;
      setResources(prev => prev.filter(r => r.id !== resource.id));
      setContextMenu(null);
      if (selectedResource?.id === resource.id) setSelectedResource(null);
    } catch (err) {
      alert('Error deleting: ' + (err as any).message);
    }
  };

  // Copy link
  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setContextMenu(null);
  };

  return (
    <div className="dashboard">
      {/* Header Section */}
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">Resource Gallery</h1>
          <p className="page-subtitle">Find what you need, when you need it</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <span>+</span> Add New
        </button>
      </div>

      {/* Filter Button + Stats */}
      <div className="toolbar">
        <button
          className={`btn btn-outline filter-toggle ${(activeFilter !== 'all' || dateFilter !== 'all') ? 'has-filters' : ''}`}
          onClick={() => setShowFilterPanel(!showFilterPanel)}
        >
          🎛️ Filters {(activeFilter !== 'all' || dateFilter !== 'all') && <span className="filter-count">•</span>}
        </button>

        {/* Search Bar */}
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <span className="resource-count">{filteredResources.length} resource{filteredResources.length !== 1 ? 's' : ''}</span>

        <select
          className="sort-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortType)}
        >
          <option value="recent">🕐 Recently Uploaded</option>
          <option value="edit">⚡ Last Project Edit</option>
          <option value="alphabetical">🔤 A-Z</option>
          <option value="type">📂 By Type</option>
        </select>
      </div>

      {/* Filter Panel Overlay */}
      {showFilterPanel && (
        <div className="filter-panel-overlay" onClick={() => setShowFilterPanel(false)}>
          <div className="filter-panel" onClick={(e) => e.stopPropagation()}>
            <div className="filter-panel-header">
              <h3>Filters</h3>
              <button className="panel-close-btn" onClick={() => setShowFilterPanel(false)}>×</button>
            </div>

            <div className="filter-section">
              <label>Type</label>
              <div className="filter-chips">
                {(['all', 'figma', 'figjam', 'github', 'docs', 'drive'] as FilterType[]).map(filter => (
                  <button
                    key={filter}
                    className={`filter-chip ${activeFilter === filter ? 'active' : ''}`}
                    onClick={() => setActiveFilter(filter)}
                  >
                    {filter === 'all' ? '🌐 All' :
                      filter === 'figma' ? '❖ Figma' :
                        filter === 'figjam' ? '🟣 FigJam' :
                          filter === 'github' ? '⪧ GitHub' :
                            filter === 'docs' ? '📄 Docs' :
                              '📁 Drive'}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-section">
              <label>Date Range</label>
              <div className="filter-chips">
                {(['all', 'today', 'week', 'month'] as const).map(range => (
                  <button
                    key={range}
                    className={`filter-chip ${dateFilter === range ? 'active' : ''}`}
                    onClick={() => setDateFilter(range)}
                  >
                    {range === 'all' ? '📅 All Time' :
                      range === 'today' ? '📆 Today' :
                        range === 'week' ? '📆 This Week' :
                          '📆 This Month'}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-actions">
              <button className="btn btn-ghost" onClick={() => { setActiveFilter('all'); setDateFilter('all'); }}>Clear All</button>
              <button className="btn btn-primary" onClick={() => setShowFilterPanel(false)}>Apply</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Add New Resource</h2>
            <form onSubmit={handleAddResource}>
              <div className="form-field">
                <label className="form-label">Resource URL</label>
                <input
                  type="url"
                  className="input"
                  value={newUrl}
                  onChange={e => setNewUrl(e.target.value)}
                  placeholder="https://..."
                  required
                />
              </div>
              <div className="form-field">
                <label className="form-label">Title (Optional)</label>
                <input
                  type="text"
                  className="input"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Navigation Design"
                />
              </div>
              <div className="form-field">
                <label className="form-label">Your Name (Optional)</label>
                <input
                  type="text"
                  className="input"
                  value={newAuthor}
                  onChange={e => setNewAuthor(e.target.value)}
                  placeholder="e.g. John Doe"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Sync Artifact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resource Grid */}
      <div className="resource-grid">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <span>Loading resources...</span>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <p>No resources found matching your criteria.</p>
          </div>
        ) : filteredResources.map((resource) => (
          <div
            key={resource.id}
            className="resource-card-link"
            onClick={() => openDetailPanel(resource)}
            onContextMenu={(e) => handleContextMenu(e, resource)}
          >
            <article className="resource-card">
              {/* Three-dot menu */}
              <button
                className="card-menu-btn"
                onClick={(e) => { e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, resource }); }}
              >
                ⋮
              </button>
              {/* Card Image */}
              <div className="card-thumbnail">
                <img
                  src={resource.thumbnail_url || 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80'}
                  alt={resource.title || 'Resource'}
                />
                <span className={`source-badge badge ${getSourceBadgeClass(resource.type)}`}>
                  {getSourceIcon(resource.type)} {resource.type}
                </span>
                {/* Version badge removed per user request */}
              </div>

              {/* Card Body */}
              <div className="card-body">
                <div className="card-header">
                  <span className="breadcrumb">{resource.project?.name || "Shared"}</span>
                  {resource.metadata?.milestone && (
                    <span className="badge badge-info">{resource.metadata.milestone}</span>
                  )}
                </div>

                <h3 className="card-title">{resource.title || "Untitled Resource"}</h3>

                {resource.metadata?.frames && resource.metadata.frames.length > 0 && (
                  <div className="frame-tags">
                    {resource.metadata.frames.slice(0, 3).map((frame: string, idx: number) => (
                      <span key={idx} className="tag">{frame}</span>
                    ))}
                    {resource.metadata.frames.length > 3 && (
                      <span className="tag">+{resource.metadata.frames.length - 3}</span>
                    )}
                  </div>
                )}

                <div className="ai-context">
                  <span className="ai-icon">✨</span>
                  <p>{resource.metadata?.ai_summary || resource.slack_context?.[0]?.gemini_summary || "Contextual summary pending..."}</p>
                </div>
              </div>

              {/* Card Footer */}
              <footer className="card-footer">
                <div className="meta-row">
                  <span className="meta-item" suppressHydrationWarning>
                    📁 {formatDate(resource.created_at)}
                  </span>
                  {resource.last_edited_at && (
                    <span className="meta-item highlight" suppressHydrationWarning>
                      ⚡ {formatDate(resource.last_edited_at)}
                    </span>
                  )}
                </div>
                {resource.author_name && (
                  <div className="author-info">
                    {resource.author_avatar && (
                      <img src={resource.author_avatar} alt="" className="author-avatar" />
                    )}
                    <span>👤 {resource.author_name}</span>
                  </div>
                )}
              </footer>
            </article>
          </div>
        ))}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div className="context-menu-overlay" onClick={closeContextMenu}>
          <div
            className="context-menu"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => openEditModal(contextMenu.resource)}>✏️ Edit Details</button>
            <button onClick={() => copyLink(contextMenu.resource.url)}>📋 Copy Link</button>
            <button onClick={() => window.open(contextMenu.resource.url, '_blank')}>🔗 Open Original</button>
            <button onClick={() => { openDetailPanel(contextMenu.resource); setContextMenu(null); }}>📄 View Details</button>
            <hr />
            <button className="danger" onClick={() => deleteResource(contextMenu.resource)}>🗑️ Delete</button>
          </div>
        </div>
      )}

      {/* Detail Side Panel */}
      {selectedResource && (
        <div className="detail-panel-overlay" onClick={() => setSelectedResource(null)}>
          <div className="detail-panel" onClick={(e) => e.stopPropagation()}>
            <button className="panel-close" onClick={() => setSelectedResource(null)}>×</button>

            <div className="panel-header">
              <img
                src={selectedResource.thumbnail_url || 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80'}
                alt=""
                className="panel-thumbnail"
              />
              <span className={`source-badge badge ${getSourceBadgeClass(selectedResource.type)}`}>
                {getSourceIcon(selectedResource.type)} {selectedResource.type}
              </span>
            </div>

            <div className="panel-body">
              <h2>{selectedResource.title || "Untitled Resource"}</h2>

              <div className="panel-actions">
                <button className="btn btn-primary btn-sm" onClick={() => window.open(selectedResource.url, '_blank')}>
                  🔗 Open in {selectedResource.type === 'figma' ? 'Figma' : selectedResource.type === 'github' ? 'GitHub' : 'Browser'}
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => openEditModal(selectedResource)}>✏️ Edit</button>
              </div>

              <div className="detail-section">
                <h4>📌 Details</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">Project</span>
                    <span className="value">{selectedResource.project?.name || "Shared"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Version</span>
                    <span className="value">{selectedResource.version || "v1.0"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Created</span>
                    <span className="value">{formatDate(selectedResource.created_at)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Last Edited</span>
                    <span className="value">{formatDate(selectedResource.last_edited_at || selectedResource.created_at)}</span>
                  </div>
                  {selectedResource.author_name && (
                    <div className="detail-item full-width">
                      <span className="label">Author</span>
                      <span className="value author-value">
                        {selectedResource.author_avatar && <img src={selectedResource.author_avatar} alt="" />}
                        {selectedResource.author_name}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {(selectedResource.metadata?.ai_summary || selectedResource.slack_context?.[0]?.gemini_summary) && (
                <div className="detail-section">
                  <h4>✨ AI Summary</h4>
                  <p className="ai-summary-text">{selectedResource.metadata?.ai_summary || selectedResource.slack_context?.[0]?.gemini_summary}</p>
                </div>
              )}

              {selectedResource.slack_context?.[0]?.slack_text && (
                <div className="detail-section">
                  <h4>💬 Slack Context</h4>
                  <p className="slack-context-text">{selectedResource.slack_context[0].slack_text}</p>
                </div>
              )}

              {relatedResources.length > 0 && (
                <div className="detail-section">
                  <h4>🔗 Related Files</h4>
                  <div className="related-list">
                    {relatedResources.map(r => (
                      <div key={r.id} className="related-item" onClick={() => openDetailPanel(r)}>
                        <span className="related-icon">{getSourceIcon(r.type)}</span>
                        <span className="related-title">{r.title}</span>
                        <span className="related-type">{r.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="modal-backdrop" onClick={() => setEditModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Resource</h2>
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                className="input"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Version</label>
              <input
                type="text"
                className="input"
                value={editForm.version}
                onChange={(e) => setEditForm({ ...editForm, version: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>URL</label>
              <input
                type="url"
                className="input"
                value={editForm.url}
                onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Context / Description</label>
              <textarea
                className="input textarea"
                rows={4}
                value={editForm.context}
                onChange={(e) => setEditForm({ ...editForm, context: e.target.value })}
                placeholder="Add context about this resource..."
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setEditModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        /* Dashboard Layout */
        .dashboard {
          animation: fadeIn 0.4s ease-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Page Header */
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-xl);
        }

        .page-title {
          font-size: var(--text-display-lg);
          font-weight: var(--weight-bold);
          color: var(--text-primary);
          margin-bottom: var(--space-xs);
        }

        .page-subtitle {
          font-size: var(--text-body-lg);
          color: var(--text-secondary);
        }

        /* Toolbar */
        .toolbar {
          display: flex;
          gap: var(--space-md);
          align-items: center;
          margin-bottom: var(--space-xl);
        }

        .search-wrapper {
          flex: 1;
          display: flex;
          align-items: center;
          position: relative;
          max-width: 600px;
        }

        .search-icon {
          position: absolute;
          left: var(--space-md);
          font-size: 16px;
          color: var(--text-tertiary);
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          height: 48px;
          padding: 0 var(--space-lg) 0 44px;
          background: var(--bg-tertiary);
          border: 2px solid var(--border-default);
          border-radius: var(--radius-md);
          font-family: var(--font-sans);
          font-size: var(--text-body);
          color: var(--text-primary);
          transition: all var(--transition-default);
        }

        .search-input:focus {
          outline: none;
          border-color: var(--color-blue);
          background: var(--bg-secondary);
        }

        .search-input::placeholder {
          color: var(--text-tertiary);
        }

        .search-box {
          flex: 1;
          min-width: 300px;
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-box .search-icon {
          position: absolute;
          left: var(--space-lg);
          font-size: 18px;
          color: var(--text-tertiary);
          pointer-events: none;
          transition: color var(--transition-fast);
        }

        .search-box:focus-within .search-icon {
          color: var(--color-blue);
        }

        .search-field {
          width: 100%;
          height: var(--input-height);
          padding: var(--space-md) var(--space-lg);
          padding-left: 52px;
          padding-right: 48px;
          background: var(--bg-tertiary);
          border: 2px solid var(--border-default);
          border-radius: var(--radius-md);
          font-family: var(--font-sans);
          font-size: var(--text-body);
          color: var(--text-primary);
          transition: all var(--transition-default);
        }

        .search-field::placeholder {
          color: var(--text-tertiary);
        }

        .search-field:focus {
          outline: none;
          border-color: var(--color-blue);
          background: var(--bg-secondary);
          box-shadow: 0 0 0 4px rgba(0, 102, 255, 0.15);
        }

        .clear-btn {
          position: absolute;
          right: var(--space-sm);
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          border-radius: var(--radius-sm);
          color: var(--text-tertiary);
          font-size: 20px;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .clear-btn:hover {
          background: var(--bg-quaternary);
          color: var(--text-primary);
        }

        /* Filter Group */
        .filter-group {
          display: flex;
          gap: var(--space-xs);
        }

        .filter-btn {
          padding: var(--space-sm) var(--space-md);
          background: var(--bg-tertiary);
          border: 2px solid var(--border-default);
          border-radius: var(--radius-md);
          font-family: var(--font-sans);
          font-size: var(--text-body-sm);
          font-weight: var(--weight-medium);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-default);
        }

        .filter-btn:hover {
          background: var(--bg-quaternary);
          border-color: var(--border-strong);
          color: var(--text-primary);
        }

        .filter-btn.active {
          background: var(--color-blue);
          border-color: var(--color-blue);
          color: var(--text-primary);
          box-shadow: var(--shadow-blue);
        }

        /* Sort Select */
        .sort-select {
          height: 48px;
          padding: var(--space-sm) var(--space-md);
          background: var(--bg-tertiary);
          border: 2px solid var(--border-default);
          border-radius: var(--radius-md);
          font-family: var(--font-sans);
          font-size: var(--text-body-sm);
          font-weight: var(--weight-medium);
          color: var(--text-primary);
          cursor: pointer;
          transition: all var(--transition-default);
        }

        .sort-select:focus {
          outline: none;
          border-color: var(--color-blue);
        }

        /* Filter Toggle Button */
        .filter-toggle {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
        }
        .filter-toggle .filter-count {
          color: var(--color-blue);
          font-size: 18px;
        }
        .filter-toggle.has-filters {
          border-color: var(--color-blue);
          color: var(--color-blue);
        }

        /* Resource Count */
        .resource-count {
          font-size: var(--text-body-sm);
          color: var(--text-tertiary);
          flex: 1;
        }

        /* Filter Panel Overlay */
        .filter-panel-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.6);
          z-index: 800;
          animation: fadeIn 0.15s ease-out;
        }
        .filter-panel {
          position: absolute;
          top: 120px;
          left: 50%;
          transform: translateX(-50%);
          width: min(480px, 90vw);
          background: var(--bg-secondary);
          border: 2px solid var(--border-default);
          border-radius: var(--radius-lg);
          padding: var(--space-xl);
          box-shadow: var(--shadow-lg);
          animation: menuIn 0.2s ease-out;
        }
        .filter-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-xl);
        }
        .filter-panel-header h3 {
          font-size: var(--text-heading-md);
          font-weight: var(--weight-bold);
          color: var(--text-primary);
        }
        .panel-close-btn {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-sm);
          background: var(--bg-tertiary);
          border: none;
          color: var(--text-primary);
          font-size: 20px;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .panel-close-btn:hover {
          background: var(--color-error);
        }
        .filter-section {
          margin-bottom: var(--space-xl);
        }
        .filter-section label {
          display: block;
          font-size: var(--text-caption);
          font-weight: var(--weight-semibold);
          color: var(--text-tertiary);
          margin-bottom: var(--space-md);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .filter-chips {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-sm);
        }
        .filter-chip {
          padding: var(--space-sm) var(--space-md);
          background: var(--bg-tertiary);
          border: 2px solid var(--border-default);
          border-radius: var(--radius-md);
          font-size: var(--text-body-sm);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .filter-chip:hover {
          background: var(--bg-quaternary);
          border-color: var(--border-strong);
        }
        .filter-chip.active {
          background: var(--color-blue);
          border-color: var(--color-blue);
          color: white;
        }
        .filter-actions {
          display: flex;
          justify-content: flex-end;
          gap: var(--space-md);
          padding-top: var(--space-lg);
          border-top: 1px solid var(--border-subtle);
        }

        /* Resource Grid */
        .resource-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          gap: var(--space-lg);
        }

        /* Resource Card */
        .resource-card {
          background: var(--bg-tertiary);
          border: 2px solid var(--border-default);
          border-radius: var(--radius-lg);
          overflow: hidden;
          transition: all var(--transition-default);
          display: flex;
          flex-direction: column;
        }

        .resource-card:hover {
          border-color: var(--border-strong);
          box-shadow: var(--shadow-md);
          transform: translateY(-4px);
        }

        /* Card Thumbnail */
        .card-thumbnail {
          height: 200px;
          position: relative;
          overflow: hidden;
        }

        .card-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform var(--transition-moderate);
        }

        .resource-card:hover .card-thumbnail img {
          transform: scale(1.05);
        }

        .source-badge {
          position: absolute;
          top: var(--space-md);
          left: var(--space-md);
          text-transform: capitalize;
        }

        .version-badge {
          position: absolute;
          top: var(--space-md);
          right: var(--space-md);
          padding: 6px var(--space-md);
          background: var(--color-blue);
          border-radius: var(--radius-sm);
          font-size: var(--text-caption);
          font-weight: var(--weight-semibold);
          color: var(--text-primary);
          box-shadow: var(--shadow-blue);
        }

        /* Card Body */
        .card-body {
          padding: var(--space-lg);
          flex: 1;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--space-sm);
        }

        .breadcrumb {
          font-size: var(--text-body-sm);
          color: var(--text-tertiary);
        }

        .card-title {
          font-size: var(--text-heading-md);
          font-weight: var(--weight-semibold);
          color: var(--text-primary);
          margin-bottom: var(--space-md);
          line-height: var(--leading-heading-md);
        }

        /* Frame Tags */
        .frame-tags {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-xs);
          margin-bottom: var(--space-md);
        }

        /* AI Context */
        .ai-context {
          display: flex;
          gap: var(--space-sm);
          padding: var(--space-md);
          background: rgba(157, 0, 255, 0.08);
          border: 2px solid rgba(157, 0, 255, 0.2);
          border-radius: var(--radius-md);
        }

        .ai-icon {
          flex-shrink: 0;
          font-size: 18px;
        }

        .ai-context p {
          font-size: var(--text-body-sm);
          font-style: italic;
          color: var(--text-secondary);
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Card Footer */
        .card-footer {
          padding: var(--space-md) var(--space-lg);
          border-top: 2px solid var(--border-default);
          background: var(--bg-secondary);
        }

        .meta-row {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-md);
          margin-bottom: var(--space-xs);
        }

        .meta-item {
          font-size: var(--text-caption);
          color: var(--text-tertiary);
        }

        .meta-item.highlight {
          color: var(--color-blue);
          font-weight: var(--weight-medium);
        }

        .author-info {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          font-size: var(--text-caption);
          font-weight: var(--weight-medium);
          color: var(--color-blue);
          margin-top: var(--space-xs);
        }

        .author-avatar {
          width: 20px;
          height: 20px;
          border-radius: var(--radius-sm);
          object-fit: cover;
        }

        /* States */
        .loading-state,
        .empty-state {
          grid-column: 1 / -1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--space-4xl);
          gap: var(--space-lg);
          color: var(--text-secondary);
        }

        .empty-icon {
          font-size: 64px;
        }

        /* Modal */
        .modal-title {
          font-size: var(--text-display-md);
          font-weight: var(--weight-bold);
          margin-bottom: var(--space-xl);
        }

        .form-field {
          margin-bottom: var(--space-lg);
        }

        .form-label {
          display: block;
          font-size: var(--text-caption);
          font-weight: var(--weight-medium);
          color: var(--text-secondary);
          margin-bottom: var(--space-sm);
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: var(--space-md);
          margin-top: var(--space-xl);
        }

        /* Card Menu Button */
        .card-menu-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 32px;
          height: 32px;
          border-radius: var(--radius-sm);
          background: rgba(0,0,0,0.7);
          border: none;
          color: white;
          font-size: 18px;
          cursor: pointer;
          opacity: 0;
          transition: all var(--transition-fast);
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .resource-card:hover .card-menu-btn {
          opacity: 1;
        }
        .card-menu-btn:hover {
          background: var(--color-blue);
          transform: scale(1.1);
        }
        .resource-card {
          position: relative;
        }
        .resource-card-link {
          cursor: pointer;
        }

        /* Context Menu */
        .context-menu-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
        }
        .context-menu {
          position: fixed;
          background: var(--bg-secondary);
          border: 2px solid var(--border-default);
          border-radius: var(--radius-md);
          padding: var(--space-xs) 0;
          min-width: 200px;
          box-shadow: var(--shadow-lg);
          z-index: 1001;
          animation: menuIn 0.15s ease-out;
        }
        @keyframes menuIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .context-menu button {
          display: block;
          width: 100%;
          padding: var(--space-sm) var(--space-md);
          background: none;
          border: none;
          color: var(--text-primary);
          text-align: left;
          cursor: pointer;
          font-size: var(--text-body-sm);
          transition: background var(--transition-fast);
        }
        .context-menu button:hover {
          background: var(--bg-tertiary);
        }
        .context-menu button.danger {
          color: var(--color-error);
        }
        .context-menu hr {
          border: none;
          border-top: 1px solid var(--border-default);
          margin: var(--space-xs) 0;
        }

        /* Detail Side Panel */
        .detail-panel-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.7);
          z-index: 900;
          animation: fadeIn 0.2s ease-out;
        }
        .detail-panel {
          position: fixed;
          top: 0;
          right: 0;
          width: min(520px, 95vw);
          height: 100vh;
          background: var(--bg-primary);
          border-left: 2px solid var(--border-default);
          overflow-y: auto;
          animation: slideInRight 0.3s ease-out;
          z-index: 901;
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .panel-close {
          position: absolute;
          top: var(--space-md);
          right: var(--space-md);
          width: 40px;
          height: 40px;
          border-radius: var(--radius-sm);
          background: var(--bg-tertiary);
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          z-index: 10;
          transition: all var(--transition-fast);
        }
        .panel-close:hover {
          background: var(--color-error);
        }
        .panel-header {
          position: relative;
          height: 220px;
          overflow: hidden;
        }
        .panel-thumbnail {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .panel-header .source-badge {
          position: absolute;
          bottom: var(--space-md);
          left: var(--space-md);
        }
        .panel-body {
          padding: var(--space-xl);
        }
        .panel-body h2 {
          font-size: var(--text-heading-lg);
          font-weight: var(--weight-bold);
          margin-bottom: var(--space-md);
          color: var(--text-primary);
        }
        .panel-actions {
          display: flex;
          gap: var(--space-sm);
          margin-bottom: var(--space-xl);
        }
        .detail-section {
          margin-bottom: var(--space-xl);
          padding-bottom: var(--space-lg);
          border-bottom: 1px solid var(--border-subtle);
        }
        .detail-section:last-child {
          border-bottom: none;
        }
        .detail-section h4 {
          font-size: var(--text-body-sm);
          font-weight: var(--weight-semibold);
          color: var(--text-secondary);
          margin-bottom: var(--space-md);
        }
        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-md);
        }
        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .detail-item.full-width {
          grid-column: 1 / -1;
        }
        .detail-item .label {
          font-size: var(--text-caption);
          color: var(--text-tertiary);
        }
        .detail-item .value {
          font-size: var(--text-body-sm);
          color: var(--text-primary);
        }
        .detail-item .author-value {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }
        .detail-item .author-value img {
          width: 28px;
          height: 28px;
          border-radius: 50%;
        }
        .ai-summary-text, .slack-context-text {
          font-size: var(--text-body-sm);
          line-height: 1.6;
          color: var(--text-secondary);
          background: var(--bg-tertiary);
          padding: var(--space-md);
          border-radius: var(--radius-sm);
        }
        .related-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }
        .related-item {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-sm) var(--space-md);
          background: var(--bg-tertiary);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .related-item:hover {
          background: var(--bg-quaternary);
        }
        .related-icon {
          font-size: 18px;
        }
        .related-title {
          flex: 1;
          font-size: var(--text-body-sm);
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .related-type {
          font-size: var(--text-caption);
          color: var(--text-tertiary);
          text-transform: capitalize;
        }
        .textarea {
          min-height: 120px;
          resize: vertical;
          line-height: 1.5;
          font-family: inherit;
        }


        .badge-default {
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          border: 2px solid var(--border-default);
        }

        .badge-figjam {
          background: #C7B9FF; /* Light Purple */
          color: #4E2788;
          border: 2px solid #9747FF;
        }
      `}</style>
    </div>
  );
}
