export default function LoadingState() {
  return (
    <div className="space-y-6 w-full" aria-busy="true" aria-live="polite">
      {/* Loading message header */}
      <div className="flex items-center justify-center space-x-3 bg-slate-900/20 border border-slate-900/60 rounded-xl p-4 text-slate-300 backdrop-blur-sm max-w-md mx-auto">
        <svg className="animate-spin h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" />
        </svg>
        <span className="text-xs font-semibold tracking-wide uppercase text-slate-200">
          Generating secure SQL alternatives...
        </span>
      </div>

      <div className="space-y-6 animate-pulse">
        {/* Recommended Query Skeleton */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/10 p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-4 bg-slate-800 rounded w-1/4"></div>
            <div className="h-5 bg-slate-800 rounded-full w-16"></div>
          </div>
          <div className="h-20 bg-slate-950/80 rounded-lg border border-slate-900/30"></div>
          <div className="h-4 bg-slate-800 rounded w-3/4"></div>
        </div>

        {/* Alternative Queries Skeleton */}
        <div className="space-y-4">
          <div className="h-4 bg-slate-800 rounded w-1/5"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-900 bg-slate-900/10 p-5 space-y-3">
              <div className="flex justify-between items-center">
                <div className="h-4 bg-slate-800 rounded w-1/3"></div>
                <div className="h-4.5 bg-slate-800 rounded-full w-12"></div>
              </div>
              <div className="h-12 bg-slate-950/80 rounded-lg border border-slate-900/30"></div>
              <div className="h-4 bg-slate-800 rounded w-2/3"></div>
            </div>
            <div className="rounded-xl border border-slate-900 bg-slate-900/10 p-5 space-y-3">
              <div className="flex justify-between items-center">
                <div className="h-4 bg-slate-800 rounded w-1/3"></div>
                <div className="h-4.5 bg-slate-800 rounded-full w-12"></div>
              </div>
              <div className="h-12 bg-slate-950/80 rounded-lg border border-slate-900/30"></div>
              <div className="h-4 bg-slate-800 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

