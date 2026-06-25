export default function RiskBadge({ riskLevel }) {
  const styles = {
    SAFE: 'text-emerald-400 bg-emerald-950/40 border-emerald-900/30',
    WARNING: 'text-amber-400 bg-amber-950/40 border-amber-900/30',
    BLOCKED: 'text-rose-400 bg-rose-950/40 border-rose-900/30',
  };

  const matchedStyle = styles[riskLevel] || 'text-slate-400 bg-slate-900 border-slate-800';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${matchedStyle}`}>
      {riskLevel}
    </span>
  );
}
