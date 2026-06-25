import { useState } from 'react';
import RiskBadge from './RiskBadge.jsx';

export default function RecommendedQueryCard({ query }) {
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
    <div className="relative rounded-2xl border border-cyan-500/20 bg-slate-900/40 p-6 shadow-2xl backdrop-blur-sm space-y-4">
      {/* Decorative Recommended tag */}
      <div className="absolute top-0 right-6 -translate-y-1/2 bg-gradient-to-r from-cyan-500 to-purple-600 px-3 py-0.5 rounded-full text-[10px] font-bold tracking-widest text-white uppercase shadow-md">
        Recommended
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Recommended Query
        </h3>
        <RiskBadge riskLevel={query.riskLevel} />
      </div>

      {/* SQL Code Block */}
      <div className="relative group rounded-lg bg-slate-950 p-4 border border-slate-900 font-mono text-xs text-cyan-400 overflow-x-auto">
        <pre><code>{query.sql}</code></pre>
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-1.5 rounded-md border border-slate-800 bg-slate-900 text-slate-400 hover:text-white transition duration-150 cursor-pointer"
          title="Copy SQL"
        >
          {copied ? (
            <span className="text-[10px] font-semibold text-emerald-400 px-1">Copied!</span>
          ) : (
            <svg
              className="h-4 w-4"
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

      {/* Blocked Reason Error Banner if query is blocked */}
      {query.riskLevel === 'BLOCKED' && query.blockedReason && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400 font-medium">
          ⚠️ {query.blockedReason}
        </div>
      )}

      {/* Explanation text */}
      {query.explanation && (
        <div className="space-y-1">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Explanation
          </h4>
          <p className="text-sm text-slate-300 leading-relaxed">
            {query.explanation}
          </p>
        </div>
      )}
    </div>
  );
}
