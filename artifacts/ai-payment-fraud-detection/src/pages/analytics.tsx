import { useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Crosshair,
  Info,
  RefreshCw,
  ShieldCheck,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useGetModelMetrics } from '@workspace/api-client-react';
import { QueryError } from '@/components/data-states';

function percent(value?: number) {
  return typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : '—';
}

function Metric({
  label,
  value,
  accent,
  note,
  icon,
}: {
  label: string;
  value: string;
  accent?: string;
  note: string;
  icon: typeof Target;
}) {
  const Icon = icon;
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="panel-label">{label}</span>
        <div className={`grid h-7 w-7 place-items-center rounded-md ${accent ?? 'bg-primary/10 text-primary'}`}><Icon size={14} /></div>
      </div>
      <div className="mt-3 text-[28px] font-extrabold tracking-[-.05em]">{value}</div>
      <div className="mt-1 text-[11px] text-muted-foreground">{note}</div>
    </div>
  );
}

function MiniChart({ points, color, label, caption, insight }: { points: { x: number; y: number }[]; color: string; label: string; caption: string; insight: string }) {
  const path = useMemo(() => points.length ? points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${18 + point.x * 250} ${178 - point.y * 150}`).join(' ') : '', [points]);
  const area = points.length ? `${path} L 268 178 L 18 178 Z` : '';
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div><div className="panel-label text-primary">Supporting evidence</div><h3 className="mt-1 text-sm font-extrabold">{label}</h3><p className="mt-1 text-xs text-muted-foreground">{caption}</p></div>
        <div className="mt-1 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[.1em] text-muted-foreground"><span className="h-2 w-2 rounded-full" style={{ background: color }} /> holdout</div>
      </div>
      <div className="relative mt-5 h-[210px]">
        <svg viewBox="0 0 286 198" className="h-full w-full overflow-visible" role="img" aria-label={`${label} curve`}>
          <line x1="18" y1="178" x2="268" y2="178" stroke="hsl(var(--border))" />
          <line x1="18" y1="28" x2="18" y2="178" stroke="hsl(var(--border))" />
          <line x1="18" y1="128" x2="268" y2="128" stroke="hsl(var(--border) / .65)" strokeDasharray="3 4" />
          <line x1="18" y1="78" x2="268" y2="78" stroke="hsl(var(--border) / .65)" strokeDasharray="3 4" />
          <path d={area} fill={color} opacity=".08" />
          <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          {points.map((point, index) => <circle key={index} cx={18 + point.x * 250} cy={178 - point.y * 150} r="2.5" fill="hsl(var(--card))" stroke={color} strokeWidth="1.7" />)}
        </svg>
        <div className="absolute bottom-0 left-2 right-1 flex justify-between font-mono text-[9px] text-muted-foreground"><span>0.0</span><span>0.5</span><span>1.0</span></div>
        <div className="absolute bottom-[48%] -left-1 -rotate-90 font-mono text-[9px] text-muted-foreground">true positive rate</div>
      </div>
      <div className="mt-3 border-t border-border pt-3 text-[11px] leading-relaxed text-muted-foreground"><span className="font-bold text-foreground">Operational read:</span> {insight}</div>
    </div>
  );
}

function Matrix({ matrix }: { matrix: number[][] }) {
  const values = matrix.length >= 2 ? matrix : [[0, 0], [0, 0]];
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between"><div><div className="panel-label text-primary">Supporting evidence</div><h3 className="mt-1 text-sm font-extrabold">Confusion matrix</h3><p className="mt-1 text-xs text-muted-foreground">Classification at the active decision threshold</p></div><Info size={15} className="text-muted-foreground" /></div>
      <div className="mt-6 grid grid-cols-[50px_1fr_1fr] gap-1.5 text-center">
        <div /><div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Clear</div><div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Flag</div>
        <div className="flex items-center justify-center [writing-mode:vertical-rl] rotate-180 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Actual clear</div>
        <div className="grid min-h-[82px] place-items-center rounded-lg border border-primary/20 bg-primary/10"><div><div className="text-xl font-extrabold">{values[0]?.[0] ?? 0}</div><div className="mt-1 font-mono text-[9px] text-primary">true negative</div></div></div>
        <div className="grid min-h-[82px] place-items-center rounded-lg border border-accent/20 bg-accent/10"><div><div className="text-xl font-extrabold">{values[0]?.[1] ?? 0}</div><div className="mt-1 font-mono text-[9px] text-accent">false positive</div></div></div>
        <div className="flex items-center justify-center [writing-mode:vertical-rl] rotate-180 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Actual fraud</div>
        <div className="grid min-h-[82px] place-items-center rounded-lg border border-destructive/20 bg-destructive/10"><div><div className="text-xl font-extrabold">{values[1]?.[0] ?? 0}</div><div className="mt-1 font-mono text-[9px] text-destructive">false negative</div></div></div>
        <div className="grid min-h-[82px] place-items-center rounded-lg border border-primary/20 bg-primary/10"><div><div className="text-xl font-extrabold">{values[1]?.[1] ?? 0}</div><div className="mt-1 font-mono text-[9px] text-primary">true positive</div></div></div>
      </div>
      <div className="mt-5 flex items-start gap-2 border-t border-border pt-4 text-[10px] leading-relaxed text-muted-foreground"><AlertTriangle size={13} className="mt-0.5 shrink-0 text-accent" />False negatives are the expensive miss. Read this alongside prevented value before changing thresholds.</div>
    </div>
  );
}

export default function Analytics() {
  const metrics = useGetModelMetrics();
  const model = metrics.data;
  const roc = model?.roc_curve ?? [];
  const pr = model?.pr_curve ?? [];

  return (
    <div className="mx-auto max-w-[1440px] animate-rise">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.16em] text-primary"><BarChart3 size={13} /> trust operations</div>
          <h1 className="mt-2 text-[30px] font-extrabold tracking-[-.045em] md:text-[36px]">Confidence behind the call.</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Model metrics are supporting evidence for the decision desk — useful when tuning trust, queues, and verification policy.</p>
        </div>
        {model && <div className="flex items-center gap-2 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2 text-[11px] font-bold text-primary"><ShieldCheck size={14} /> {model.model_name} <span className="font-mono text-[9px] text-primary/65">{model.model_version}</span></div>}
      </div>

      {metrics.isLoading ? <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{[1, 2, 3, 4, 5].map((item) => <div key={item} className="skeleton h-[140px] rounded-xl" />)}</div> : metrics.isError ? <div className="mt-7"><QueryError onRetry={() => metrics.refetch()} label="Model intelligence unavailable" /></div> : !model ? <div className="mt-7"><QueryError label="No model evaluation data returned" /></div> :
        <>
          <section className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Metric label="Precision" value={percent(model.precision)} note="Alerts worth an analyst look" icon={Target} />
            <Metric label="Recall" value={percent(model.recall)} note="Known fraud caught" icon={Crosshair} accent="bg-accent/20 text-accent" />
            <Metric label="F1 score" value={percent(model.f1_score)} note="Balance of precision and recall" icon={Activity} />
            <Metric label="ROC AUC" value={model.roc_auc.toFixed(3)} note="Ranking quality overall" icon={TrendingUp} />
            <Metric label="PR AUC" value={model.pr_auc.toFixed(3)} note="Ranking quality in rare fraud" icon={BarChart3} accent="bg-accent/20 text-accent" />
          </section>

          <section className="mt-7 rounded-xl border border-primary/25 bg-primary/5 p-5">
            <div className="flex items-start gap-3"><CheckCircle2 size={17} className="mt-0.5 shrink-0 text-primary" /><div><div className="panel-label text-primary">How to use this page</div><p className="mt-1 max-w-3xl text-sm font-semibold leading-relaxed">Start every investigation on the decision desk. Use these curves to understand alert quality and threshold trade-offs, then pair them with transaction evidence before changing platform behavior.</p></div></div>
          </section>

          <div className="mt-7 grid gap-5 xl:grid-cols-[1.15fr_1.15fr_.9fr]">
            <MiniChart points={roc} color="hsl(172 70% 47%)" label="ROC curve" caption="Trade-off between catching fraud and raising false alarms" insight="A strong upper-left bend means the engine can separate clear payments from suspicious ones before the analyst queue grows." />
            <MiniChart points={pr} color="hsl(40 92% 58%)" label="Precision / recall curve" caption="Alert quality as sensitivity changes" insight="Use this when fraud is sparse. It shows whether the queue stays useful as the platform asks the model to catch more." />
            <Matrix matrix={model.confusion_matrix} />
          </div>

          <section className="mt-7 rounded-xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="panel-label">Operator notes</div><h2 className="mt-1 text-sm font-extrabold">Three ways to read the model</h2><p className="mt-1 text-xs text-muted-foreground">Keep the team focused on trust outcomes, not vanity metrics.</p></div><button type="button" data-testid="button-refresh-metrics" onClick={() => metrics.refetch()} className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-[11px] font-bold text-muted-foreground transition hover:border-primary hover:text-primary"><RefreshCw size={13} className={metrics.isFetching ? 'animate-spin' : ''} /> Refresh metrics</button></div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4"><div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.12em] text-primary"><CheckCircle2 size={13} /> Queue quality</div><p className="mt-2 text-xs leading-relaxed text-foreground/75">Precision tells operations whether a review alert is likely to contain a meaningful signal.</p></div>
              <div className="rounded-lg border border-accent/25 bg-accent/5 p-4"><div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.12em] text-accent"><Info size={13} /> Coverage</div><p className="mt-2 text-xs leading-relaxed text-foreground/75">Recall shows what can pass unseen. Protect coverage when the cost of a missed fraud event is high.</p></div>
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4"><div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.12em] text-destructive"><AlertTriangle size={13} /> Threshold watch</div><p className="mt-2 text-xs leading-relaxed text-foreground/75">False positives consume trust and analyst time. False negatives consume money. Tune with both in view.</p></div>
            </div>
          </section>
        </>
      }
    </div>
  );
}