export default function LoadingState() {
  return (
    <div className="space-y-6 animate-pulse w-full">
      {/* Recommended Query Skeleton */}
      <div className="rounded-2xl border border-slate-900 bg-slate-900/10 p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-4 bg-slate-800 rounded w-1/4"></div>
          <div className="h-5 bg-slate-800 rounded-full w-16"></div>
        </div>
        <div className="h-20 bg-slate-950/80 rounded-lg"></div>
        <div className="h-4 bg-slate-800 rounded w-3/4"></div>
      </div>

      {/* Alternative Queries Skeleton */}
      <div className="space-y-4">
        <div className="h-5 bg-slate-800 rounded w-1/5"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-900 bg-slate-900/10 p-5 space-y-3">
            <div className="h-4 bg-slate-800 rounded w-1/3"></div>
            <div className="h-12 bg-slate-950/80 rounded-lg"></div>
            <div className="h-4 bg-slate-800 rounded w-2/3"></div>
          </div>
          <div className="rounded-xl border border-slate-900 bg-slate-900/10 p-5 space-y-3">
            <div className="h-4 bg-slate-800 rounded w-1/3"></div>
            <div className="h-12 bg-slate-950/80 rounded-lg"></div>
            <div className="h-4 bg-slate-800 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
