import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import * as savedQueryService from '../services/savedQueryService.js';
import { useToast } from '../components/Toast.jsx';
import { useWorkspace } from '../contexts/WorkspaceContext.jsx';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Copy Button ─────────────────────────────────────────────────────────────

function CopyButton({ text, size = 'md' }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* silent */ }
  };
  return (
    <button
      onClick={handleCopy}
      title="Copy SQL"
      className={`inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${size === 'sm' ? 'px-2 py-1 text-[10px]' : 'px-3 py-1.5 text-xs'}`}
    >
      {copied ? (
        <><svg className="h-3.5 w-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg><span className="text-emerald-400 font-semibold">Copied!</span></>
      ) : (
        <><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3" /></svg>Copy SQL</>
      )}
    </button>
  );
}

// ─── Tag Pill ─────────────────────────────────────────────────────────────────

function TagPill({ tag }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 border border-purple-500/20 text-purple-400">
      #{tag}
    </span>
  );
}

// ─── Edit Modal ──────────────────────────────────────────────────────────────

function EditModal({ sq, onClose, onSaved }) {
  const [title, setTitle] = useState(sq.title);
  const [description, setDescription] = useState(sq.description || '');
  const [tagsRaw, setTagsRaw] = useState((sq.tags || []).join(', '));
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const tags = tagsRaw.split(',').map((t) => t.trim()).filter(Boolean);
      const updated = await savedQueryService.updateSavedQuery(sq.id, { title: title.trim(), description: description.trim() || null, tags });
      onSaved(updated);
      showToast('Saved query updated.', 'success');
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to update.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-800">
          <h2 className="text-base font-bold text-white">Edit Saved Query</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none" placeholder="Optional description…" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tags <span className="font-normal text-slate-600">(comma-separated)</span></label>
            <input value={tagsRaw} onChange={(e) => setTagsRaw(e.target.value)} placeholder="analytics, reporting, users" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 pb-5">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving || !title.trim()} className="px-5 py-2 text-sm font-bold rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SavedQueryCard ──────────────────────────────────────────────────────────

function SavedQueryCard({ item, onDelete, onFavoriteToggle, onEdit }) {
  const [expanded, setExpanded] = useState(false);
  const [fullSQL, setFullSQL] = useState(null);
  const [loadingSQL, setLoadingSQL] = useState(false);

  const handleExpand = async () => {
    if (!expanded && !fullSQL) {
      setLoadingSQL(true);
      try {
        const full = await savedQueryService.getSavedQuery(item.id);
        setFullSQL(full.generatedSQL);
      } catch { /* silent */ }
      finally { setLoadingSQL(false); }
    }
    setExpanded((v) => !v);
  };

  return (
    <div className="group bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden transition-all duration-200 hover:border-slate-700 hover:shadow-lg hover:shadow-slate-900/50">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-5 py-4">
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            {item.isFavorite && (
              <svg className="h-4 w-4 text-yellow-400 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            )}
            <h3 className="text-sm font-bold text-white truncate">{item.title}</h3>
            <span className="text-[10px] font-mono text-slate-500 border border-slate-800 px-1.5 py-0.5 rounded">{item.databaseType}</span>
          </div>
          {item.description && (
            <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{item.description}</p>
          )}
          <p className="text-xs text-slate-400 italic truncate" title={item.naturalLanguagePrompt}>
            "{item.naturalLanguagePrompt}"
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <span className="text-[10px] text-slate-600">{formatDate(item.createdAt)}</span>
            {(item.tags || []).map((tag) => <TagPill key={tag} tag={tag} />)}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Favorite */}
          <button
            onClick={() => onFavoriteToggle(item.id)}
            title={item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            className={`p-1.5 rounded-lg transition-colors ${item.isFavorite ? 'text-yellow-400 hover:text-yellow-300' : 'text-slate-600 hover:text-yellow-400'} hover:bg-slate-800`}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill={item.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
          {/* Edit */}
          <button onClick={() => onEdit(item)} title="Edit" className="p-1.5 rounded-lg text-slate-600 hover:text-cyan-400 hover:bg-slate-800 transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </button>
          {/* Expand */}
          <button onClick={handleExpand} title={expanded ? 'Collapse' : 'View SQL'} className="p-1.5 rounded-lg text-slate-600 hover:text-white hover:bg-slate-800 transition-colors">
            <svg className={`h-4 w-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </button>
          {/* Delete */}
          <button onClick={() => onDelete(item.id)} title="Delete" className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>

      {/* SQL Expanded */}
      {expanded && (
        <div className="border-t border-slate-800 px-5 pb-5 pt-4 space-y-3">
          {loadingSQL ? (
            <div className="h-24 bg-slate-800/40 rounded-xl animate-pulse" />
          ) : fullSQL ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Generated SQL</span>
                <CopyButton text={fullSQL} size="sm" />
              </div>
              <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 overflow-x-auto">
                <pre className="font-mono text-xs text-cyan-400 whitespace-pre-wrap break-all leading-relaxed">
                  <code>{fullSQL}</code>
                </pre>
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-500 italic">Could not load SQL.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SavedQueriesSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-slate-900/40 border border-slate-800 rounded-2xl px-5 py-4 space-y-2.5">
          <div className="h-4 bg-slate-800 rounded w-1/2" />
          <div className="h-3 bg-slate-800 rounded w-3/4" />
          <div className="flex gap-2 pt-1">
            <div className="h-3 bg-slate-800 rounded w-20" />
            <div className="h-3 bg-slate-800 rounded w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SavedQueriesPage() {
  const { workspaces, currentWorkspace, selectWorkspace } = useWorkspace();
  const { showToast } = useToast();

  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState('desc');
  const [editingItem, setEditingItem] = useState(null);
  const searchTimer = useRef(null);

  const fetchSavedQueries = useCallback(async () => {
    if (!currentWorkspace?.id) { setItems([]); setPagination(null); return; }
    setIsLoading(true);
    setError('');
    try {
      const data = await savedQueryService.listSavedQueries(currentWorkspace.id, {
        page,
        limit: 15,
        search,
        favorites: favoritesOnly,
        sort: sortOrder,
      });
      setItems(data.items);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message || 'Failed to load saved queries.');
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace?.id, page, search, favoritesOnly, sortOrder]);

  useEffect(() => { fetchSavedQueries(); }, [fetchSavedQueries]);

  // Debounce search input
  const handleSearchChange = (val) => {
    setSearchInput(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setSearch(val); setPage(1); }, 400);
  };

  const handleDelete = async (id) => {
    try {
      await savedQueryService.deleteSavedQuery(id);
      setItems((prev) => prev.filter((q) => q.id !== id));
      setPagination((prev) => prev ? { ...prev, total: prev.total - 1 } : prev);
      showToast('Saved query deleted.', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to delete.', 'error');
    }
  };

  const handleFavoriteToggle = async (id) => {
    try {
      const updated = await savedQueryService.toggleFavorite(id);
      setItems((prev) => prev.map((q) => q.id === id ? { ...q, isFavorite: updated.isFavorite } : q));
    } catch (err) {
      showToast(err.message || 'Failed to update favorite.', 'error');
    }
  };

  const handleSaved = (updated) => {
    setItems((prev) => prev.map((q) => q.id === updated.id ? { ...q, ...updated } : q));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 sm:px-6 py-6 sm:py-10">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Saved Queries
          </h1>
          <p className="text-sm text-slate-400">Curated SQL queries saved within your workspaces for easy reuse.</p>
        </div>
        {pagination?.total > 0 && (
          <span className="text-xs text-slate-500 tabular-nums whitespace-nowrap mt-1">
            {pagination.total} saved
          </span>
        )}
      </div>

      {/* Workspace selector + filters */}
      <div className="bg-slate-900/35 border border-slate-800 rounded-2xl p-4 space-y-4 backdrop-blur-md">
        {/* Workspace picker row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Workspace:</span>
            {currentWorkspace ? (
              <span className="text-sm font-bold text-cyan-400">{currentWorkspace.name}</span>
            ) : (
              <span className="text-sm italic text-slate-500">None selected</span>
            )}
          </div>
          {workspaces.length > 0 && (
            <select
              value={currentWorkspace?.id || ''}
              onChange={(e) => { const w = workspaces.find((x) => x.id === e.target.value); selectWorkspace(w); setPage(1); }}
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all cursor-pointer w-full sm:w-auto"
            >
              <option value="" disabled>Select workspace…</option>
              {workspaces.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          )}
        </div>

        {/* Filter bar */}
        {currentWorkspace && (
          <div className="flex flex-wrap items-center gap-3 border-t border-slate-800 pt-3">
            {/* Search */}
            <div className="relative flex-1 min-w-40">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by title or prompt…"
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
            {/* Favorites toggle */}
            <button
              onClick={() => { setFavoritesOnly((v) => !v); setPage(1); }}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${favoritesOnly ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400' : 'border-slate-700 bg-slate-950 text-slate-400 hover:text-yellow-400 hover:border-yellow-500/30'}`}
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill={favoritesOnly ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
              Favorites
            </button>
            {/* Sort */}
            <select
              value={sortOrder}
              onChange={(e) => { setSortOrder(e.target.value); setPage(1); }}
              className="rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
            >
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </select>
          </div>
        )}
      </div>

      {/* No workspace selected */}
      {!currentWorkspace && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/8 p-5 flex items-start gap-3 text-sm text-amber-400">
          <svg className="h-5 w-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
          <div>
            <span className="font-bold block mb-0.5">Select a Workspace to view saved queries.</span>
            <span className="text-xs text-amber-500/80">
              Saved queries are organized by workspace.{' '}
              <Link to="/workspaces" className="underline font-semibold hover:text-amber-300">Open Workspaces →</Link>
            </span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400 flex items-center gap-2">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9.303 3.376c.866-1.5-.217-3.374-1.948-3.374H3.645c-1.73 0-2.813 1.874-1.948 3.374L10.051 20.622c.866 1.5 3.032 1.5 3.898 0L20.303 16.126z" /></svg>
          {error}
        </div>
      )}

      {/* Loading */}
      {isLoading && <SavedQueriesSkeleton />}

      {/* List */}
      {!isLoading && !error && items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => (
            <SavedQueryCard
              key={item.id}
              item={item}
              onDelete={handleDelete}
              onFavoriteToggle={handleFavoriteToggle}
              onEdit={setEditingItem}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && currentWorkspace && items.length === 0 && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center space-y-5 shadow-xl">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-yellow-500/20 to-purple-600/20 border border-yellow-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">
              {favoritesOnly ? 'No favorites yet' : search ? 'No results found' : 'No saved queries yet'}
            </h2>
            <p className="text-sm text-slate-400 max-w-sm mx-auto">
              {favoritesOnly
                ? 'Star a saved query to add it to your favorites.'
                : search
                ? `No saved queries match "${search}".`
                : 'Generate SQL and click Save Query to add entries here.'}
            </p>
          </div>
          <Link
            to="/sql"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-lg shadow-cyan-500/25 transition-all duration-200"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            Generate SQL
          </Link>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-500">Page {pagination.page} of {pagination.totalPages} · {pagination.total} total</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">← Previous</button>
            <button onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Next →</button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <EditModal sq={editingItem} onClose={() => setEditingItem(null)} onSaved={handleSaved} />
      )}
    </div>
  );
}
