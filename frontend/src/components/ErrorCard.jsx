import React from 'react';

export default function ErrorCard({ message, errorDetails, requestId, onRetry }) {
  if (!message) return null;

  return (
    <div 
      className="rounded-2xl border border-rose-500/20 bg-rose-950/20 p-5 sm:p-6 shadow-xl backdrop-blur-sm space-y-4 max-w-2xl mx-auto"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start space-x-4">
        {/* Warning Icon */}
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-rose-950 border border-rose-500/20 text-rose-400 shrink-0">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <div className="space-y-1.5 flex-1 min-w-0">
          <h3 className="text-sm font-bold text-rose-300 tracking-wide uppercase">
            Query Generation Failed
          </h3>
          <p className="text-xs text-rose-400/90 font-medium leading-relaxed break-words">
            {message}
          </p>

          {errorDetails && (
            <p className="text-[11px] text-rose-400/70 font-mono bg-slate-950/40 p-2 rounded-lg border border-slate-900/60 overflow-x-auto whitespace-pre-wrap leading-normal">
              {errorDetails}
            </p>
          )}

          {requestId && (
            <div className="flex items-center space-x-1.5 pt-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Request ID:
              </span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-950/30 px-1.5 py-0.5 rounded border border-slate-900/40 select-all">
                {requestId}
              </span>
            </div>
          )}
        </div>
      </div>

      {onRetry && (
        <div className="flex justify-end pt-1 border-t border-rose-500/10">
          <button
            onClick={onRetry}
            className="flex items-center space-x-1 px-4 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 hover:border-rose-500/35 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 cursor-pointer"
            aria-label="Retry generating query"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.5" />
            </svg>
            <span>Try Again</span>
          </button>
        </div>
      )}
    </div>
  );
}
