import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'ADMIN';

  const initials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? '?';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      {/* Glow effects background */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header section with glassmorphism */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/60 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left — Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/20">
              Q
            </div>
            <Link
              to="/dashboard"
              className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400"
            >
              QueryGen<span className="text-cyan-400 font-extrabold font-mono">AI</span>
            </Link>
          </div>

          {/* Center — Navigation */}
          <nav className="hidden sm:flex items-center space-x-6">
            <Link
              to="/workspaces"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors duration-200"
            >
              Dashboard
            </Link>
            <Link
              to="/workspaces"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors duration-200"
            >
              Workspaces
            </Link>
            <Link
              to="/dashboard"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors duration-200"
            >
              Generate SQL
            </Link>
            <Link
              to="/history"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors duration-200"
            >
              History
            </Link>
            <Link
              to="/saved-queries"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors duration-200"
            >
              Saved Queries
            </Link>
            <Link
              to="/profile"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors duration-200"
            >
              Settings
            </Link>

            {/* Admin links — only visible to ADMIN role */}
            {isAdmin && (
              <>
                <div className="w-px h-5 bg-slate-700" />
                <Link
                  to="/admin/users"
                  className="text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors duration-200"
                >
                  Admin
                </Link>
              </>
            )}
          </nav>

          {/* Right — User menu */}
          <div className="flex items-center space-x-3">
            {/* Role badge */}
            {isAdmin && (
              <span className="hidden md:inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-purple-500/15 text-purple-400 border border-purple-500/20">
                Admin
              </span>
            )}

            <Link
              to="/profile"
              className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800/60 transition-colors duration-200 group"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow shadow-cyan-500/20 shrink-0">
                {initials}
              </div>
              <span className="hidden md:block text-sm text-slate-300 group-hover:text-white transition-colors max-w-[120px] truncate">
                {user?.fullName || user?.email || 'Account'}
              </span>
            </Link>

            <button
              onClick={handleLogout}
              title="Sign out"
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main content viewport */}
      <main className="relative flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} QueryGenAI. All rights reserved.</p>
      </footer>
    </div>
  );
}
