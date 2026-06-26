import { useState, useEffect } from 'react';
import apiClient from '../services/api.js';

export default function AdminLogsPage() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      setError('');
      try {
        const res = await apiClient.get(`/admin/logs?page=${page}&limit=25`);
        setLogs(res.data.data.logs);
        setPagination(res.data.data.pagination);
      } catch (err) {
        setError(err.message || 'Failed to load audit logs.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, [page]);

  const formatTimestamp = (iso) =>
    new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="max-w-5xl mx-auto space-y-6 px-4 sm:px-6 py-6 sm:py-10">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          Audit Logs
        </h1>
        <p className="text-sm text-slate-400">Security and action audit trail.</p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500/25 border-t-cyan-500" />
        </div>
      )}

      {/* Logs Table */}
      {!isLoading && logs.length > 0 && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Action</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">User</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">IP Address</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3">
                      <span className="inline-block px-2 py-0.5 rounded-md text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-400 text-xs">
                      {log.user ? (
                        <span>
                          <span className="text-slate-200 font-medium">{log.user.fullName}</span>
                          <br />
                          <span className="font-mono">{log.user.email}</span>
                        </span>
                      ) : (
                        <span className="text-slate-600 italic">System</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-500 font-mono text-xs">
                      {log.ipAddress || '—'}
                    </td>
                    <td className="px-5 py-3 text-slate-400 text-xs">
                      {formatTimestamp(log.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800">
              <p className="text-xs text-slate-500">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} entries)
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && logs.length === 0 && (
        <div className="text-center py-16 text-slate-500 text-sm">
          No audit log entries found.
        </div>
      )}
    </div>
  );
}
