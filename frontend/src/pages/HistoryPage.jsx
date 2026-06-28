import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../services/api.js';
import { useToast } from '../components/Toast.jsx';
import { useWorkspace } from '../contexts/WorkspaceContext.jsx';

// ── Inline copy button ─────────────────────────────────────────────────────
function CopyButton({ text }) {
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
      aria-label="Copy SQL to clipboard"
      className="p-1.5 rounded-md border border-slate-800 bg-slate-900 text-slate-400 hover:text-white transition duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
    >
      {copied ? (
        <span className="text-[10px] font-semibold text-emerald-400 px-1">Copied!</span>
      ) : (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
        </svg>
      )}
    </button>
  );
}

// ── Single history card ────────────────────────────────────────────────────
function HistoryCard({ item, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const variantCount = item.variants?.length ?? 0;

  const formatDate = (iso) =>
    new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl shadow-lg overflow-hidden transition-all duration-200 hover:border-slate-700">
      <div className="flex items-start justify-between gap-4 px-5 py-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-200 leading-snug truncate" title={item.prompt}>{item.prompt}</p>
          <div className="flex flex-wrap items-center gap-3 mt-1.5">
            <span className="text-xs text-slate-500">{formatDate(item.createdAt)}</span>
            {item.executionTime != null && (
              <span className="text-xs text-slate-600 font-mono">{item.executionTime}ms</span>
            )}
            <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${
              item.executionStatus === 'SUCCESS' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : item.executionStatus === 'FAILED' ? 'bg-red-500/10 border-red-500/20 text-red-400'
              : 'bg-slate-700/50 border-slate-700 text-slate-400'}`}>
              {item.executionStatus}
            </span>
            {item.workspace && (
              <span className="text-[10px] font-mono text-cyan-500/70 border border-cyan-500/20 px-1.5 py-0.5 rounded">
                {item.workspace.name}
              </span>
            )}
            {variantCount > 0 && <span className="text-xs text-slate-600">{variantCount} variant{variantCount !== 1 ? 's' : ''}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setExpanded((v) => !v)} aria-expanded={expanded} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors" title={expanded ? 'Collapse' : 'Expand'}>
            <svg className={`h-4 w-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </button>
          <button onClick={() => onDelete(item.id)} className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete this history entry" aria-label="Delete query history entry">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-800 px-5 pb-5 pt-4 space-y-4">
          {item.selectedSQL && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Recommended SQL</p>
                <CopyButton text={item.selectedSQL} />
              </div>
              <div className="rounded-lg bg-slate-950 border border-slate-900 p-3 overflow-x-auto">
                <pre className="font-mono text-xs text-cyan-400 whitespace-pre-wrap break-all"><code>{item.selectedSQL}</code></pre>
              </div>
            </div>
          )}
          {item.variants && item.variants.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">All Variants ({item.variants.length})</p>
              <div className="space-y-2">
                {item.variants.map((v, i) => (
                  <div key={v.id} className="rounded-xl bg-slate-950/60 border border-slate-800/60 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Variant {i + 1}{v.ranking != null && ` · Rank #${v.ranking}`}</span>
                      <CopyButton text={v.sql} />
                    </div>
                    <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap break-all overflow-x-auto"><code>{v.sql}</code></pre>
                    {v.explanation && <p className="text-xs text-slate-500 leading-relaxed">{v.explanation}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Skeleton loader ────────────────────────────────────────────────────────
function HistorySkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-slate-900/40 border border-slate-800 rounded-2xl px-5 py-4 space-y-2">
          <div className="h-4 bg-slate-800 rounded w-3/4" />
          <div className="flex gap-3"><div className="h-3 bg-slate-800 rounded w-24" /><div className="h-3 bg-slate-800 rounded w-14" /></div>
        </div>
      ))}
    </div>
  );
}

// ── Main HistoryPage ───────────────────────────────────────────────────────
export default function HistoryPage() {
  const [queries, setQueries] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState(null);
  const { showToast } = useToast();
  const { workspaces, currentWorkspace, selectWorkspace } = useWorkspace();

  // Filter/sort state
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [workspaceFilter, setWorkspaceFilter] = useState('');
  const searchTimer = useRef(null);

  // Set workspace filter from global context initially
  useEffect(() => {
    setWorkspaceFilter(currentWorkspace?.id || '');
    setPage(1);
  }, [currentWorkspace?.id]);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page, limit: 10, sort: sortOrder });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (workspaceFilter) params.set('workspaceId', workspaceFilter);
      const res = await apiClient.get(`/history?${params}`);
      setQueries(res.data.data.queries);
      setPagination(res.data.data.pagination);
    } catch (err) {
      setError(err.message || 'Failed to load query history.');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, statusFilter, sortOrder, workspaceFilter]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleSearchChange = (val) => {
    setSearchInput(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setSearch(val); setPage(1); }, 400);
  };

  const handleDelete = async (id) => {
    if (deletingId) return;
    setDeletingId(id);
    try {
      await apiClient.delete(`/history/${id}`);
      setQueries((prev) => prev.filter((q) => q.id !== id));
      setPagination((prev) => prev ? { ...prev, total: prev.total - 1 } : prev);
      showToast('Query deleted from history.', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to delete query.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 sm:px-6 py-6 sm:py-10">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Query History
          </h1>
          <p className="text-sm text-slate-400">Your previously generated SQL queries. History is immutable.</p>
        </div>
        {pagination && pagination.total > 0 && (
          <span className="text-xs text-slate-500 tabular-nums">{pagination.total} entr{pagination.total === 1 ? 'y' : 'ies'}</span>
        )}
      </div>

      {/* Filters panel */}
      <div className="bg-slate-900/35 border border-slate-800 rounded-2xl p-4 space-y-3 backdrop-blur-md">
        {/* Row 1: Search + Workspace */}
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-40">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by prompt…"
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* Workspace filter */}
          <select
            value={workspaceFilter}
            onChange={(e) => { setWorkspaceFilter(e.target.value); setPage(1); }}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
          >
            <option value="">All Workspaces</option>
            {workspaces.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILED">Failed</option>
            <option value="PENDING">Pending</option>
          </select>

          {/* Sort */}
          <select
            value={sortOrder}
            onChange={(e) => { setSortOrder(e.target.value); setPage(1); }}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
          >
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
        </div>

        {/* Active filters row */}
        {(search || statusFilter || workspaceFilter) && (
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Active filters:</span>
            {search && <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">"{search}"</span>}
            {statusFilter && <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-700/60 border border-slate-700 text-slate-300">{statusFilter}</span>}
            {workspaceFilter && <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-500/10 border border-purple-500/20 text-purple-400">{workspaces.find(w => w.id === workspaceFilter)?.name || 'Workspace'}</span>}
            <button onClick={() => { setSearch(''); setSearchInput(''); setStatusFilter(''); setWorkspaceFilter(''); setPage(1); }} className="text-[10px] text-slate-500 hover:text-red-400 transition-colors ml-1">✕ Clear all</button>
          </div>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400 flex items-center gap-2">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && <HistorySkeleton />}

      {/* History list */}
      {!isLoading && !error && queries.length > 0 && (
        <div className="space-y-3">
          {queries.map((item) => <HistoryCard key={item.id} item={item} onDelete={handleDelete} />)}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && queries.length === 0 && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center space-y-5 shadow-xl backdrop-blur-md">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-purple-600/20 border border-cyan-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">{search || statusFilter || workspaceFilter ? 'No results found' : 'No history yet'}</h2>
            <p className="text-sm text-slate-400 max-w-sm mx-auto">
              {search || statusFilter || workspaceFilter
                ? 'Try adjusting your filters.'
                : 'Your generated SQL queries will appear here.'}
            </p>
          </div>
          <Link to="/sql" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-lg shadow-cyan-500/25 transition-all duration-200">
            ← Go to Generator
          </Link>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-500">Page {pagination.page} of {pagination.totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">← Previous</button>
            <button onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}
