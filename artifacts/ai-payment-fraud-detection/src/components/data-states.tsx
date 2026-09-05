import { AlertCircle, RefreshCw } from 'lucide-react';

export function QueryError({ onRetry, label = 'Could not load this signal' }: { onRetry?: () => void; label?: string }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-destructive/25 bg-destructive/5 p-6 text-center">
      <AlertCircle size={20} className="text-destructive" />
      <p className="mt-3 text-sm font-bold">{label}</p>
      <p className="mt-1 text-xs text-muted-foreground">The service did not return a usable response.</p>
      {onRetry && <button type="button" data-testid="button-retry-query" onClick={onRetry} className="mt-4 inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs font-bold transition hover:border-primary hover:text-primary"><RefreshCw size={13} /> Retry</button>}
    </div>
  );
}

export function StatSkeleton() {
  return <div className="h-[116px] rounded-xl border border-border bg-card p-5"><div className="skeleton h-3 w-24 rounded" /><div className="skeleton mt-4 h-7 w-28 rounded" /><div className="skeleton mt-2 h-2 w-20 rounded" /></div>;
}