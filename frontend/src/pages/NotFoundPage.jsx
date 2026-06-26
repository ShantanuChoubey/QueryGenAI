import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100 font-sans antialiased px-4">
      {/* Background glows */}
      <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 text-center space-y-6 max-w-md">
        {/* 404 number */}
        <p className="text-8xl font-extrabold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
          404
        </p>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">Page Not Found</h1>
          <p className="text-sm text-slate-400">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <Link
          to="/dashboard"
          className="inline-flex items-center px-6 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-lg shadow-cyan-500/25 transition-all duration-200"
        >
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
