"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<'resources' | 'admins' | 'settings'>('resources');

    // Resource State
    const [resources, setResources] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ title: '', version: '', url: '' });

    // Admin User State
    const [adminUsers, setAdminUsers] = useState<any[]>([]);
    const [newAdminId, setNewAdminId] = useState("");
    const [newAdminName, setNewAdminName] = useState("");

    // Settings State
    const [settings, setSettings] = useState<any>({});
    const [savingSettings, setSavingSettings] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        const { data: resData } = await supabase
            .from('resources')
            .select(`*, project:projects(name), slack_context(gemini_summary)`)
            .order('created_at', { ascending: false });

        const { data: admData } = await supabase
            .from('admins')
            .select('*');

        const { data: setData } = await supabase
            .from('settings')
            .select('*');

        if (resData) setResources(resData);
        if (admData) setAdminUsers(admData);

        const settingsMap: any = {};
        if (setData) {
            setData.forEach((item: any) => settingsMap[item.key] = item.value);
        }
        setSettings(settingsMap);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Search State
    const [searchQuery, setSearchQuery] = useState("");

    const filteredResources = resources.filter(r =>
        (r.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.url || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Resource Actions
    const startEdit = (resource: any) => {
        setEditingId(resource.id);
        setEditForm({
            title: resource.title || '',
            version: resource.version || 'v1.0',
            url: resource.url || ''
        });
    };

    const saveEdit = async () => {
        if (!editingId) return;
        const { error } = await supabase.from('resources').update({
            title: editForm.title,
            version: editForm.version,
            url: editForm.url
        }).eq('id', editingId);
        if (error) alert('Error: ' + error.message);
        else { fetchData(); setEditingId(null); }
    };

    const deleteResource = async (id: string, title: string) => {
        if (!confirm(`Delete "${title}"?`)) return;
        await supabase.from('resources').delete().eq('id', id);
        fetchData();
    };

    // Admin Actions
    const addAdmin = async () => {
        if (!newAdminId.trim()) return;
        const { error } = await supabase.from('admins').insert([{
            slack_user_id: newAdminId,
            role: 'admin',
            name: newAdminName || null
        }]);
        if (error) alert('Error: ' + error.message);
        else {
            setNewAdminId("");
            setNewAdminName("");
            fetchData();
        }
    };

    const removeAdmin = async (id: string) => {
        if (!confirm('Remove admin?')) return;
        await supabase.from('admins').delete().eq('id', id);
        fetchData();
    };

    // Settings Actions
    const saveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingSettings(true);
        const updates = Object.entries(settings).map(([key, value]) => ({ key, value, updated_at: new Date() }));
        const { error } = await supabase.from('settings').upsert(updates);

        if (error) alert('Failed to save settings: ' + error.message);
        else alert('Settings saved!');
        setSavingSettings(false);
    };

    const updateSetting = (key: string, value: string) => {
        setSettings({ ...settings, [key]: value });
    };

    // Sync Actions
    const [syncing, setSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState("");
    const [syncProjectId, setSyncProjectId] = useState("");

    const handleSync = async () => {
        if (!syncProjectId) return;
        setSyncing(true);
        setSyncResult("Syncing...");
        try {
            const res = await fetch('/api/sync/figma', {
                method: 'POST',
                body: JSON.stringify({ projectId: syncProjectId }),
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (data.success) {
                setSyncResult(`✅ Synced ${data.count} files!`);
                fetchData();
            } else {
                setSyncResult(`❌ Error: ${data.message || data.error}`);
            }
        } catch (e: any) {
            setSyncResult(`❌ Network Error: ${e.message}`);
        }
        setSyncing(false);
    };

    // Team Sync
    const [teamSyncId, setTeamSyncId] = useState("");

    useEffect(() => {
        if (settings.figma_team_id) {
            setTeamSyncId(settings.figma_team_id);
        }
    }, [settings]);

    const handleTeamSync = async () => {
        if (!teamSyncId) return;
        setSyncing(true);
        setSyncResult("Syncing Team...");
        try {
            const res = await fetch('/api/sync/figma-team', {
                method: 'POST',
                body: JSON.stringify({ teamId: teamSyncId }),
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (data.success) {
                setSyncResult(`✅ ${data.message}`);
                fetchData();
            } else {
                setSyncResult(`❌ Error: ${data.message || data.error}`);
            }
        } catch (e: any) {
            setSyncResult(`❌ Network Error: ${e.message}`);
        }
        setSyncing(false);
    };

    // Bulk Selection
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const toggleSelectAll = () => {
        if (selectedIds.size === resources.length) setSelectedIds(new Set());
        else setSelectedIds(new Set(resources.map(r => r.id)));
    };

    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const deleteSelected = async () => {
        if (!confirm(`Irreversibly delete ${selectedIds.size} items?`)) return;
        setLoading(true);
        const { error } = await supabase.from('resources').delete().in('id', Array.from(selectedIds));
        if (error) alert("Batch Delete/Error: " + error.message);
        else {
            setSelectedIds(new Set());
            fetchData();
        }
    };

    return (
        <div className="admin-page">
            {/* Header */}
            <header className="admin-header">
                <div className="header-content">
                    <h1 className="page-title">Admin Portal</h1>
                    <p className="page-subtitle">Manage resources, users, and settings</p>
                </div>
                {activeTab === 'settings' && (
                    <div className="header-actions">
                        <input
                            className="input input-compact"
                            placeholder="Team ID"
                            value={teamSyncId}
                            onChange={e => setTeamSyncId(e.target.value)}
                        />
                        <button
                            className="btn btn-primary"
                            onClick={handleTeamSync}
                            disabled={syncing}
                        >
                            {syncing ? 'Syncing...' : '⚡ Sync Design System'}
                        </button>
                    </div>
                )}
            </header>

            {/* Tabs */}
            <nav className="tab-nav">
                <button
                    className={`tab-btn ${activeTab === 'resources' ? 'active' : ''}`}
                    onClick={() => setActiveTab('resources')}
                >
                    📦 Resources
                </button>
                <button
                    className={`tab-btn ${activeTab === 'admins' ? 'active' : ''}`}
                    onClick={() => setActiveTab('admins')}
                >
                    🛡️ Admins
                </button>
                <button
                    className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('settings')}
                >
                    ⚙️ Settings
                </button>
            </nav>

            {/* Resources Tab */}
            {activeTab === 'resources' && (
                <section className="tab-content">
                    <div className="section-header">
                        <h2 className="section-title">Resource Management</h2>
                        <div className="search-wrapper">
                            <input
                                className="input search-input"
                                placeholder="Search resources..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        {syncResult && (
                            <span className={`sync-toast ${syncResult.includes('✅') ? 'success' : 'error'}`}>
                                {syncResult}
                            </span>
                        )}
                    </div>

                    <div className="table-container">
                        {loading ? (
                            <div className="loading-state">
                                <div className="spinner"></div>
                                <span>Loading resources...</span>
                            </div>
                        ) : (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th className="col-check">
                                            <input
                                                type="checkbox"
                                                className="checkbox"
                                                onChange={toggleSelectAll}
                                                checked={resources.length > 0 && selectedIds.size === resources.length}
                                            />
                                        </th>
                                        <th>Title / Link</th>
                                        <th className="col-version">Version</th>
                                        <th className="col-actions">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredResources.map(r => (
                                        <tr key={r.id} className={selectedIds.has(r.id) ? 'selected' : ''}>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    className="checkbox"
                                                    checked={selectedIds.has(r.id)}
                                                    onChange={() => toggleSelect(r.id)}
                                                />
                                            </td>
                                            <td>
                                                {editingId === r.id ? (
                                                    <div className="edit-fields">
                                                        <input
                                                            className="input"
                                                            value={editForm.title}
                                                            onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                                            placeholder="Title"
                                                        />
                                                        <input
                                                            className="input input-compact text-mono"
                                                            value={editForm.url}
                                                            onChange={e => setEditForm({ ...editForm, url: e.target.value })}
                                                            placeholder="URL"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="cell-content">
                                                        <span className="res-title">{r.title}</span>
                                                        <a href={r.url} target="_blank" className="res-url">{r.url}</a>
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                {editingId === r.id ? (
                                                    <input
                                                        className="input input-compact"
                                                        value={editForm.version}
                                                        onChange={e => setEditForm({ ...editForm, version: e.target.value })}
                                                    />
                                                ) : (
                                                    <span className="badge badge-info">{r.version || 'v1.0'}</span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="action-btns">
                                                    {editingId === r.id ? (
                                                        <button className="btn btn-icon btn-success-icon" onClick={saveEdit} title="Save">
                                                            ✓
                                                        </button>
                                                    ) : (
                                                        <>
                                                            <button className="btn btn-icon" onClick={() => startEdit(r)} title="Edit">
                                                                ✎
                                                            </button>
                                                            <button className="btn btn-icon btn-destructive-icon" onClick={() => deleteResource(r.id, r.title)} title="Delete">
                                                                🗑
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </section>
            )}

            {/* Admins Tab */}
            {activeTab === 'admins' && (
                <section className="tab-content">
                    <div className="panel">
                        <h2 className="panel-title">🛡️ Admin Access</h2>

                        <div className="admin-list">
                            {adminUsers.map(admin => (
                                <div key={admin.id} className="admin-item">
                                    <div className="admin-info">
                                        <span className="admin-name">{admin.name || 'Unnamed'}</span>
                                        <span className="admin-meta">{admin.slack_user_id} • {admin.role}</span>
                                    </div>
                                    <button
                                        className="btn btn-icon btn-destructive-icon"
                                        onClick={() => removeAdmin(admin.id)}
                                        title="Remove"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="add-admin-form">
                            <input
                                className="input"
                                placeholder="Name"
                                value={newAdminName}
                                onChange={e => setNewAdminName(e.target.value)}
                            />
                            <input
                                className="input"
                                placeholder="Slack ID (U123456)"
                                value={newAdminId}
                                onChange={e => setNewAdminId(e.target.value)}
                            />
                            <button className="btn btn-success" onClick={addAdmin}>
                                Add Admin
                            </button>
                        </div>
                    </div>
                </section>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
                <section className="tab-content">
                    <div className="panel">
                        <h2 className="panel-title">⚙️ Application Settings</h2>

                        <form onSubmit={saveSettings}>
                            <div className="form-field">
                                <label className="form-label">Slack Notify Channel ID</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={settings.slack_notify_channel || ''}
                                    onChange={e => updateSetting('slack_notify_channel', e.target.value)}
                                    placeholder="C01234567"
                                />
                            </div>

                            <div className="form-field">
                                <label className="form-label">Admin Name</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={settings.admin_name || ''}
                                    onChange={e => updateSetting('admin_name', e.target.value)}
                                    placeholder="Your Name"
                                />
                                <span className="form-hint">This name will be used when you upload files from the dashboard</span>
                            </div>

                            <div className="form-field">
                                <label className="form-label">Team ID</label>
                                <input
                                    className="input"
                                    value={settings.figma_team_id || ''}
                                    onChange={e => updateSetting('figma_team_id', e.target.value)}
                                    placeholder="1133445507023682143"
                                />
                            </div>

                            <div className="form-field">
                                <label className="form-label">Figma Access Token</label>
                                <input
                                    type="password"
                                    className="input"
                                    value={settings.figma_access_token || ''}
                                    onChange={e => updateSetting('figma_access_token', e.target.value)}
                                    placeholder="figd_..."
                                />
                                <span className="form-hint">Only update if changing tokens</span>
                            </div>

                            <div className="form-field">
                                <label className="form-label">Groq API Key</label>
                                <input
                                    type="password"
                                    className="input"
                                    value={settings.groq_api_key || ''}
                                    onChange={e => updateSetting('groq_api_key', e.target.value)}
                                    placeholder="gsk_..."
                                />
                            </div>

                            <button type="submit" className="btn btn-primary" disabled={savingSettings}>
                                {savingSettings ? 'Saving...' : 'Save Changes'}
                            </button>
                        </form>

                        <div className="sync-section">
                            <h3 className="sync-title">🔄 Figma Bulk Sync</h3>
                            <div className="form-field">
                                <label className="form-label">Project ID</label>
                                <div className="input-group">
                                    <input
                                        className="input"
                                        value={syncProjectId}
                                        onChange={e => setSyncProjectId(e.target.value)}
                                        placeholder="00000000"
                                    />
                                    <button
                                        className="btn btn-secondary"
                                        onClick={handleSync}
                                        disabled={syncing}
                                    >
                                        {syncing ? 'Syncing...' : 'Sync Now'}
                                    </button>
                                </div>
                                {syncResult && (
                                    <span className={`sync-status ${syncResult.includes('✅') ? 'success' : 'error'}`}>
                                        {syncResult}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Floating Action Bar */}
            <div className={`fab-bar ${selectedIds.size > 0 ? 'visible' : ''}`}>
                <span className="fab-count">{selectedIds.size} items selected</span>
                <button className="btn btn-destructive" onClick={deleteSelected}>
                    Delete Selection
                </button>
            </div>

            <style jsx>{`
                /* Admin Page */
                .admin-page {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding-bottom: 120px;
                    animation: fadeIn 0.4s ease-out;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                /* Header */
                .admin-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: var(--space-2xl);
                }

                .page-title {
                    font-size: var(--text-display-lg);
                    font-weight: var(--weight-bold);
                    margin-bottom: var(--space-xs);
                }

                .page-subtitle {
                    color: var(--text-secondary);
                }

                .header-actions {
                    display: flex;
                    gap: var(--space-md);
                    align-items: center;
                }

                .input-compact {
                    width: 180px;
                    height: 48px;
                }

                /* Tabs */
                .tab-nav {
                    display: flex;
                    gap: var(--space-xs);
                    padding: var(--space-xs);
                    background: var(--bg-tertiary);
                    border: 2px solid var(--border-default);
                    border-radius: var(--radius-lg);
                    margin-bottom: var(--space-xl);
                }

                .tab-btn {
                    flex: 1;
                    padding: var(--space-md) var(--space-lg);
                    background: transparent;
                    border: none;
                    border-radius: var(--radius-md);
                    font-family: var(--font-sans);
                    font-size: var(--text-body);
                    font-weight: var(--weight-semibold);
                    color: var(--text-secondary);
                    cursor: pointer;
                    transition: all var(--transition-default);
                }

                .tab-btn:hover {
                    color: var(--text-primary);
                    background: var(--bg-quaternary);
                }

                .tab-btn.active {
                    background: var(--color-blue);
                    color: var(--text-primary);
                    box-shadow: var(--shadow-blue);
                }

                /* Section Header */
                .section-header {
                    display: flex;
                    align-items: center;
                    gap: var(--space-lg);
                    margin-bottom: var(--space-lg);
                }

                .section-title {
                    font-size: var(--text-heading-lg);
                    font-weight: var(--weight-semibold);
                }

                .search-wrapper {
                    flex: 1;
                    max-width: 400px;
                }

                .search-input {
                    width: 100%;
                    height: 40px;
                    border-radius: var(--radius-full);
                    padding-left: var(--space-lg);
                }

                .sync-toast {
                    padding: var(--space-xs) var(--space-md);
                    border-radius: var(--radius-full);
                    font-size: var(--text-caption);
                    font-weight: var(--weight-semibold);
                }

                .sync-toast.success {
                    background: var(--color-neon-green);
                    color: var(--text-on-color);
                }

                .sync-toast.error {
                    background: var(--color-error);
                    color: var(--text-primary);
                }

                /* Table */
                .table-container {
                    background: var(--bg-tertiary);
                    border: 2px solid var(--border-default);
                    border-radius: var(--radius-lg);
                    overflow: hidden;
                }

                .data-table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .data-table th {
                    text-align: left;
                    padding: var(--space-lg);
                    font-size: var(--text-micro);
                    font-weight: var(--weight-medium);
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    color: var(--text-tertiary);
                    border-bottom: 2px solid var(--border-default);
                    background: var(--bg-quaternary);
                }

                .col-check { width: 60px; }
                .col-version { width: 120px; }
                .col-actions { width: 120px; }

                .data-table td {
                    padding: var(--space-md) var(--space-lg);
                    border-bottom: 1px solid var(--border-subtle);
                    vertical-align: middle;
                }

                .data-table tr.selected {
                    background: rgba(0, 102, 255, 0.1);
                }

                .data-table tbody tr:hover:not(.selected) {
                    background: rgba(255, 255, 255, 0.02);
                }

                .checkbox {
                    width: 20px;
                    height: 20px;
                    accent-color: var(--color-blue);
                    cursor: pointer;
                }

                .cell-content {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .res-title {
                    font-weight: var(--weight-medium);
                    color: var(--text-primary);
                }

                .res-url {
                    font-size: var(--text-micro);
                    font-family: var(--font-mono);
                    color: var(--text-tertiary);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 350px;
                }

                .res-url:hover {
                    color: var(--color-blue);
                }

                .edit-fields {
                    display: flex;
                    flex-direction: column;
                    gap: var(--space-sm);
                }

                .text-mono {
                    font-family: var(--font-mono);
                    font-size: var(--text-micro);
                }

                .action-btns {
                    display: flex;
                    gap: var(--space-xs);
                }

                .btn-destructive-icon {
                    color: var(--color-error);
                }

                .btn-destructive-icon:hover {
                    background: rgba(255, 59, 48, 0.15);
                }

                .btn-success-icon {
                    color: var(--color-success);
                }

                .btn-success-icon:hover {
                    background: rgba(0, 255, 136, 0.15);
                }

                /* Panel */
                .panel {
                    max-width: 640px;
                    background: var(--bg-tertiary);
                    border: 2px solid var(--border-default);
                    border-radius: var(--radius-xl);
                    padding: var(--space-2xl);
                }

                .panel-title {
                    font-size: var(--text-heading-lg);
                    font-weight: var(--weight-semibold);
                    margin-bottom: var(--space-xl);
                }

                /* Admin List */
                .admin-list {
                    margin-bottom: var(--space-xl);
                }

                .admin-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: var(--space-md);
                    border-bottom: 1px solid var(--border-subtle);
                }

                .admin-info {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .admin-name {
                    font-weight: var(--weight-medium);
                }

                .admin-meta {
                    font-size: var(--text-caption);
                    color: var(--text-tertiary);
                }

                .add-admin-form {
                    display: flex;
                    gap: var(--space-md);
                }

                .add-admin-form .input {
                    flex: 1;
                }

                /* Form Fields */
                .form-field {
                    margin-bottom: var(--space-xl);
                }

                .form-label {
                    display: block;
                    font-size: var(--text-caption);
                    font-weight: var(--weight-medium);
                    color: var(--text-secondary);
                    margin-bottom: var(--space-sm);
                }

                .form-hint {
                    display: block;
                    font-size: var(--text-micro);
                    color: var(--text-tertiary);
                    margin-top: var(--space-xs);
                }

                .input-group {
                    display: flex;
                    gap: var(--space-md);
                }

                .input-group .input {
                    flex: 1;
                }

                /* Sync Section */
                .sync-section {
                    margin-top: var(--space-2xl);
                    padding-top: var(--space-xl);
                    border-top: 2px solid var(--border-default);
                }

                .sync-title {
                    font-size: var(--text-heading-sm);
                    font-weight: var(--weight-semibold);
                    color: var(--text-secondary);
                    margin-bottom: var(--space-lg);
                }

                .sync-status {
                    display: block;
                    margin-top: var(--space-sm);
                    font-size: var(--text-caption);
                    font-weight: var(--weight-semibold);
                }

                .sync-status.success { color: var(--color-success); }
                .sync-status.error { color: var(--color-error); }

                /* FAB Bar */
                .fab-bar {
                    position: fixed;
                    bottom: -100px;
                    left: 50%;
                    transform: translateX(-50%);
                    display: flex;
                    align-items: center;
                    gap: var(--space-xl);
                    padding: var(--space-md) var(--space-xl);
                    background: var(--bg-tertiary);
                    border: 2px solid var(--border-default);
                    border-radius: var(--radius-xl);
                    box-shadow: var(--shadow-lg);
                    transition: bottom 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                    z-index: var(--z-sticky);
                }

                .fab-bar.visible {
                    bottom: var(--space-2xl);
                }

                .fab-count {
                    font-weight: var(--weight-semibold);
                    color: var(--text-primary);
                }

                /* Loading State */
                .loading-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: var(--space-4xl);
                    gap: var(--space-lg);
                    color: var(--text-secondary);
                }
            `}</style>
        </div>
    );
}
