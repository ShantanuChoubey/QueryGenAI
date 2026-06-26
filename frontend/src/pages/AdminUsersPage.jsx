import { useState, useEffect } from 'react';
import apiClient from '../services/api.js';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      setError('');
      try {
        const res = await apiClient.get(`/admin/users?page=${page}&limit=25`);
        setUsers(res.data.data.users);
        setPagination(res.data.data.pagination);
      } catch (err) {
        setError(err.message || 'Failed to load users.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, [page]);

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  return (
    <div className="max-w-5xl mx-auto space-y-6 px-4 sm:px-6 py-6 sm:py-10">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          User Management
        </h1>
        <p className="text-sm text-slate-400">View all registered users.</p>
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

      {/* Users Table */}
      {!isLoading && users.length > 0 && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Name</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Role</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Verified</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3 text-slate-200 font-medium">{u.fullName}</td>
                    <td className="px-5 py-3 text-slate-400 font-mono text-xs">{u.email}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wide ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20'
                            : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {u.isVerified ? (
                        <span className="text-green-400 text-xs font-semibold">✓ Yes</span>
                      ) : (
                        <span className="text-slate-500 text-xs">No</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-400 text-xs">{formatDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800">
              <p className="text-xs text-slate-500">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} users)
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
      {!isLoading && !error && users.length === 0 && (
        <div className="text-center py-16 text-slate-500 text-sm">No users found.</div>
      )}
    </div>
  );
}
