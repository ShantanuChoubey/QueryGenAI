import { useAuth } from '../contexts/AuthContext.jsx';
import { Link } from 'react-router-dom';

export default function ProfilePage() {
  const { user, logout } = useAuth();

  const joinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  const initials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? '?';

  return (
    <div className="max-w-2xl mx-auto space-y-8 px-4 sm:px-6 py-6 sm:py-10">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          Your Profile
        </h1>
        <p className="text-sm text-slate-400">Manage your account information.</p>
      </div>

      {/* Profile Card */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-6">
        {/* Avatar + Name Row */}
        <div className="flex items-center space-x-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-cyan-500/20 shrink-0">
            {initials}
          </div>
          <div>
            <p className="text-xl font-bold text-white">
              {user?.fullName || 'User'}
            </p>
            <p className="text-sm text-slate-400">{user?.email}</p>
          </div>
        </div>

        <div className="border-t border-slate-800" />

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Full Name
            </p>
            <p className="text-sm text-slate-200 font-medium">
              {user?.fullName || '—'}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Email Address
            </p>
            <p className="text-sm text-slate-200 font-medium">{user?.email || '—'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Member Since
            </p>
            <p className="text-sm text-slate-200 font-medium">{joinDate}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Account ID
            </p>
            <p className="text-sm text-slate-500 font-mono truncate">
              {user?.id || '—'}
            </p>
          </div>
        </div>

        <div className="border-t border-slate-800" />

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/dashboard"
            className="flex-1 text-center px-5 py-2.5 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors duration-200"
          >
            ← Back to Workspace
          </Link>
          <button
            onClick={logout}
            className="flex-1 px-5 py-2.5 rounded-xl text-sm font-semibold bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 transition-all duration-200"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
