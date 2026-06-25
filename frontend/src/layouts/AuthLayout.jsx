import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  // If already authenticated, bypass login/register and send user to dashboard
  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-slate-100 font-sans antialiased overflow-hidden">
      {/* Background radial glows */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Brand header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center font-bold text-lg text-white shadow-xl shadow-cyan-500/20">
            Q
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
              QueryGen<span className="text-cyan-400 font-extrabold font-mono">AI</span>
            </h1>
            <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">
              AI-Powered SQL Generator
            </p>
          </div>
        </div>

        {/* Form Container */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/35 p-8 shadow-2xl backdrop-blur-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
