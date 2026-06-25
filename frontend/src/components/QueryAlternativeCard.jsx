import { useState } from 'react';
import RiskBadge from './RiskBadge.jsx';

export default function QueryAlternativeCard({ query }) {
  const [copied, setCopied] = useState(false);

  if (!query) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(query.sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy query:', err);
    }
  };

  return (
    <div className="rounded-xl border border-slate-900 bg-slate-900/20 p-5 space-y-3.5 backdrop-blur-sm relative">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500 font-mono">
          RANKING #{query.ranking}
        </span>
        <RiskBadge riskLevel={query.riskLevel} />
      </div>

      {/* SQL Code Block */}
      <div className="relative group rounded-lg bg-slate-950 p-3.5 border border-slate-900 font-mono text-[11px] text-slate-300 overflow-x-auto">
        <pre><code>{query.sql}</code></pre>
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-1.5 rounded-md border border-slate-900 bg-slate-950 text-slate-500 hover:text-slate-200 transition duration-150 cursor-pointer"
          title="Copy SQL"
        >
          {copied ? (
            <span className="text-[10px] font-semibold text-emerald-400 px-1">Copied!</span>
          ) : (
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Blocked Reason details if query is blocked */}
      {query.riskLevel === 'BLOCKED' && query.blockedReason && (
        <div className="rounded-lg border border-red-950 bg-red-950/20 p-2.5 text-[11px] text-red-400">
          ⚠️ {query.blockedReason}
        </div>
      )}

      {/* Explanation text */}
      {query.explanation && (
        <div className="space-y-1">
          <p className="text-xs text-slate-400 leading-relaxed">
            {query.explanation}
          </p>
        </div>
      )}
    </div>
  );
}
