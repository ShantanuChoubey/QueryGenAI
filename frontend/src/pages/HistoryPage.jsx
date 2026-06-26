import { Link } from 'react-router-dom';

export default function HistoryPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8 px-4 sm:px-6 py-6 sm:py-10">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          Query History
        </h1>
        <p className="text-sm text-slate-400">Your previously generated SQL queries.</p>
      </div>

      {/* Coming Soon Card */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 sm:p-12 shadow-xl backdrop-blur-md text-center space-y-5">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-purple-600/20 border border-cyan-500/20 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-8 h-8 text-cyan-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">Coming Soon</h2>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            Query history tracking is being developed. Once available, you'll be able to
            revisit and reuse your previously generated SQL queries.
          </p>
        </div>

        <Link
          to="/dashboard"
          className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-lg shadow-cyan-500/25 transition-all duration-200"
        >
          ← Back to Generator
        </Link>
      </div>
    </div>
  );
}
