import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  CircleAlert,
  Clock3,
  Cpu,
  Fingerprint,
  Globe2,
  Laptop,
  LoaderCircle,
  MessageSquareText,
  Radar,
  RefreshCw,
  Search,
  ShieldAlert,
  Smartphone,
  Sparkles,
  Tablet,
  Target,
  Zap,
} from 'lucide-react';
import {
  useAskRiskInvestigator,
  useGetDashboardSummary,
  useListTransactions,
  usePredictTransaction,
} from '@workspace/api-client-react';
import type { InvestigationAnswer, Reason, TransactionInput } from '@workspace/api-client-react';
import { QueryError, StatSkeleton } from '@/components/data-states';

type FormState = {
  transaction_amount: string;
  transaction_hour: string;
  day_of_week: string;
  merchant_category: string;
  country: string;
  device_type: string;
  is_new_device: boolean;
  transactions_last_1h: string;
  transactions_last_24h: string;
  avg_spend: string;
  spend_std_dev: string;
  account_age_days: string;
};

const initialForm: FormState = {
  transaction_amount: '184.25',
  transaction_hour: '21',
  day_of_week: '4',
  merchant_category: 'digital_goods',
  country: 'US',
  device_type: 'mobile',
  is_new_device: true,
  transactions_last_1h: '3',
  transactions_last_24h: '7',
  avg_spend: '92.40',
  spend_std_dev: '48.60',
  account_age_days: '218',
};

const fieldLabels: Record<string, string> = {
  transaction_hour: 'Transaction hour',
  day_of_week: 'Day of week',
  merchant_category: 'Merchant category',
  country: 'Country',
  device_type: 'Device type',
  is_new_device: 'New device',
  transactions_last_1h: 'Transactions · 1h',
  transactions_last_24h: 'Transactions · 24h',
  avg_spend: 'Average spend',
  spend_std_dev: 'Spend deviation',
  account_age_days: 'Account age',
};

function formatCurrency(value?: number) {
  return typeof value === 'number'
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
    : '—';
}

function formatTime(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatLabel(value: string) {
  return value.replaceAll('_', ' ');
}

function toneForDecision(decision?: string) {
  if (decision === 'BLOCK') return 'alert';
  if (decision === 'REVIEW') return 'warm';
  return 'safe';
}

function DecisionPill({ decision, large = false }: { decision?: string; large?: boolean }) {
  const tone = toneForDecision(decision);
  return (
    <span
      data-testid="status-decision"
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono font-bold uppercase tracking-[.14em] ${
        large ? 'text-sm' : 'text-[10px]'
      } ${
        tone === 'alert'
          ? 'border-destructive/35 bg-destructive/10 text-destructive'
          : tone === 'warm'
            ? 'border-accent/40 bg-accent/10 text-accent'
            : 'border-primary/35 bg-primary/10 text-primary'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${tone === 'alert' ? 'bg-destructive' : tone === 'warm' ? 'bg-accent' : 'bg-primary'}`} />
      {decision ?? 'Awaiting decision'}
    </span>
  );
}

function MetricCard({
  label,
  value,
  detail,
  tone = 'default',
  loading,
}: {
  label: string;
  value: string;
  detail: string;
  tone?: 'default' | 'warm' | 'teal';
  loading?: boolean;
}) {
  if (loading) return <StatSkeleton />;
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/35">
      <div className={`absolute right-0 top-0 h-20 w-20 translate-x-8 -translate-y-8 rounded-full blur-2xl ${tone === 'warm' ? 'bg-accent/15' : tone === 'teal' ? 'bg-primary/15' : 'bg-secondary'}`} />
      <div className="relative flex items-start justify-between">
        <span className="panel-label">{label}</span>
        <ArrowUpRight size={14} className="text-muted-foreground/45 transition group-hover:text-primary" />
      </div>
      <div className="relative mt-3 text-[25px] font-extrabold tracking-[-.04em]">{value}</div>
      <div className="relative mt-1 text-[11px] font-medium text-muted-foreground">{detail}</div>
    </div>
  );
}

function FormField({
  label,
  name,
  value,
  onChange,
  type = 'text',
  min,
  max,
  step,
  suffix,
}: {
  label: string;
  name: keyof FormState;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  min?: string;
  max?: string;
  step?: string;
  suffix?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-[.11em] text-muted-foreground">{label}</span>
      <div className="relative">
        <input
          data-testid={`input-${name}`}
          required
          name={name}
          value={value}
          onChange={onChange}
          type={type}
          min={min}
          max={max}
          step={step}
          className={`h-10 w-full rounded-lg border border-input bg-background/70 px-3 text-sm font-semibold text-foreground outline-none transition placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/15 ${suffix ? 'pr-12' : ''}`}
        />
        {suffix && <span className="pointer-events-none absolute right-3 top-2.5 font-mono text-[11px] text-muted-foreground">{suffix}</span>}
      </div>
    </label>
  );
}

function EvidenceRow({ reason, index }: { reason: Reason; index: number }) {
  const positive = reason.impact === 'positive';
  return (
    <div data-testid={`evidence-${index}`} className="rounded-lg border border-border bg-background/45 p-3.5">
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md ${positive ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
          {positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-extrabold">{fieldLabels[reason.feature] ?? formatLabel(reason.feature)}</span>
            <span className={`font-mono text-[10px] font-bold ${positive ? 'text-destructive' : 'text-primary'}`}>
              {positive ? '+' : '−'}{Math.abs(reason.contribution).toFixed(2)}
            </span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{reason.detail}</p>
        </div>
      </div>
    </div>
  );
}

export default function Overview() {
  const summary = useGetDashboardSummary();
  const transactions = useListTransactions({ limit: 8 });
  const prediction = usePredictTransaction();
  const investigator = useAskRiskInvestigator();
  const [form, setForm] = useState<FormState>(initialForm);
  const [lastScoredInput, setLastScoredInput] = useState<TransactionInput | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<InvestigationAnswer>();

  const records = useMemo(() => transactions.data ?? [], [transactions.data]);
  const result = prediction.data;
  const tone = toneForDecision(result?.decision);
  const riskScore = result?.risk_score ?? 0;

  const change = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const buildInput = (): TransactionInput => ({
    transaction_amount: Number(form.transaction_amount),
    transaction_hour: Number(form.transaction_hour),
    day_of_week: Number(form.day_of_week),
    merchant_category: form.merchant_category as TransactionInput['merchant_category'],
    country: form.country.toUpperCase(),
    device_type: form.device_type as TransactionInput['device_type'],
    is_new_device: form.is_new_device,
    transactions_last_1h: Number(form.transactions_last_1h),
    transactions_last_24h: Number(form.transactions_last_24h),
    avg_spend: Number(form.avg_spend),
    spend_std_dev: Number(form.spend_std_dev),
    account_age_days: Number(form.account_age_days),
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const transaction = buildInput();
    setAnswer(undefined);
    prediction.mutate({ data: transaction }, { onSuccess: () => setLastScoredInput(transaction) });
  };

  const askQuestion = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!lastScoredInput || question.trim().length < 2) return;
    investigator.mutate(
      { data: { question: question.trim(), transaction: lastScoredInput } },
      { onSuccess: (data) => setAnswer(data) },
    );
  };

  return (
    <div className="mx-auto max-w-[1440px] animate-rise">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[.16em] text-primary">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" /> live risk command center
          </div>
          <h1 className="mt-2 text-[30px] font-extrabold tracking-[-.05em] md:text-[38px]">Make the call. Know why.</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">A payment decision desk for the three questions that matter: what is the risk, why is it risky, and what should happen next.</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2 text-[11px] font-semibold text-primary">
          <Target size={14} /> RISKWISE engine <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[9px]">live</span>
        </div>
      </div>

      <section className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard loading={summary.isLoading} label="Payments monitored" value={summary.data ? summary.data.total_transactions.toLocaleString() : '—'} detail="Across the current operations window" tone="teal" />
        <MetricCard loading={summary.isLoading} label="Flagged for review" value={summary.data ? summary.data.flagged_transactions.toLocaleString() : '—'} detail={summary.data ? `${(summary.data.alert_rate * 100).toFixed(1)}% of payment flow` : 'Awaiting signal'} tone="warm" />
        <MetricCard loading={summary.isLoading} label="Exposure prevented" value={summary.data ? formatCurrency(summary.data.prevented_value) : '—'} detail="Estimated value held by decisions" />
        <MetricCard loading={summary.isLoading} label="Average risk" value={summary.data ? `${(summary.data.avg_probability * 100).toFixed(1)}%` : '—'} detail={summary.data ? `Engine ${summary.data.model_status.toLowerCase()}` : 'Awaiting signal'} tone="teal" />
      </section>
      {summary.isError && <div className="mt-3"><QueryError onRetry={() => summary.refetch()} label="Operations summary unavailable" /></div>}

      <section className="mt-7 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(430px,.92fr)]">
        <div className="rounded-xl border border-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <div className="panel-label text-primary">01 / risk input</div>
              <h2 className="mt-1 text-sm font-extrabold">Score a payment</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Give the engine the payment context. It returns a decision and an evidence trail.</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 font-mono text-[9px] font-medium text-primary"><Zap size={11} /> low-latency scoring</div>
          </div>
          <form onSubmit={submit} className="p-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FormField label="Amount" name="transaction_amount" value={form.transaction_amount} onChange={change} type="number" min="0.01" step="0.01" suffix="USD" />
              <FormField label="Country" name="country" value={form.country} onChange={change} />
              <label className="block"><span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-[.11em] text-muted-foreground">Merchant category</span><select data-testid="select-merchant-category" name="merchant_category" value={form.merchant_category} onChange={change} className="h-10 w-full rounded-lg border border-input bg-background/70 px-3 text-sm font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"><option value="retail">Retail</option><option value="travel">Travel</option><option value="digital_goods">Digital goods</option><option value="grocery">Grocery</option><option value="dining">Dining</option><option value="services">Services</option></select></label>
              <FormField label="Hour (UTC)" name="transaction_hour" value={form.transaction_hour} onChange={change} type="number" min="0" max="23" />
              <label className="block"><span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-[.11em] text-muted-foreground">Day of week</span><select data-testid="select-day-of-week" name="day_of_week" value={form.day_of_week} onChange={change} className="h-10 w-full rounded-lg border border-input bg-background/70 px-3 text-sm font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"><option value="0">Monday</option><option value="1">Tuesday</option><option value="2">Wednesday</option><option value="3">Thursday</option><option value="4">Friday</option><option value="5">Saturday</option><option value="6">Sunday</option></select></label>
              <label className="block"><span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-[.11em] text-muted-foreground">Device type</span><select data-testid="select-device-type" name="device_type" value={form.device_type} onChange={change} className="h-10 w-full rounded-lg border border-input bg-background/70 px-3 text-sm font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"><option value="mobile">Mobile</option><option value="desktop">Desktop</option><option value="tablet">Tablet</option></select></label>
            </div>

            <div className="mt-6 border-t border-border pt-5">
              <div className="mb-3 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.13em] text-muted-foreground"><Fingerprint size={13} className="text-primary" /> Account and velocity context</div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <FormField label="Transactions · 1h" name="transactions_last_1h" value={form.transactions_last_1h} onChange={change} type="number" min="0" />
                <FormField label="Transactions · 24h" name="transactions_last_24h" value={form.transactions_last_24h} onChange={change} type="number" min="0" />
                <FormField label="Average spend" name="avg_spend" value={form.avg_spend} onChange={change} type="number" min="0" step="0.01" suffix="USD" />
                <FormField label="Spend deviation" name="spend_std_dev" value={form.spend_std_dev} onChange={change} type="number" min="0" step="0.01" suffix="USD" />
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <FormField label="Account age" name="account_age_days" value={form.account_age_days} onChange={change} type="number" min="0" suffix="days" />
                <label className="flex h-10 items-center gap-3 self-end rounded-lg border border-input bg-background/70 px-3">
                  <input data-testid="input-is-new-device" type="checkbox" checked={form.is_new_device} onChange={(event) => setForm((current) => ({ ...current, is_new_device: event.target.checked }))} className="h-4 w-4 accent-[hsl(var(--primary))]" />
                  <span className="text-xs font-bold">New device detected</span>
                  <span className="ml-auto rounded bg-accent/20 px-1.5 py-0.5 font-mono text-[9px] text-accent">signal</span>
                </label>
              </div>
            </div>

            <button type="submit" data-testid="button-score-transaction" disabled={prediction.isPending} className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-extrabold text-primary-foreground shadow-[0_8px_18px_hsl(var(--primary)/.18)] transition hover:brightness-95 disabled:cursor-wait disabled:opacity-70">
              {prediction.isPending ? <><LoaderCircle size={16} className="animate-spin" /> Investigating payment</> : <><Radar size={16} /> Run risk decision</>}
            </button>
            {prediction.isError && <p data-testid="status-score-error" className="mt-3 flex items-center justify-center gap-2 text-center text-xs font-semibold text-destructive"><CircleAlert size={13} /> Scoring failed. Check the payment context and retry.</p>}
          </form>
        </div>

        <div className={`overflow-hidden rounded-xl border ${result ? tone === 'alert' ? 'border-destructive/35' : tone === 'warm' ? 'border-accent/35' : 'border-primary/35' : 'border-border'} bg-card`}>
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div><div className="panel-label text-primary">02 / decision outcome</div><h2 className="mt-1 text-sm font-extrabold">What should the platform do?</h2><p className="mt-0.5 text-xs text-muted-foreground">The recommended action leads. Evidence follows.</p></div>
            <Cpu size={17} className="text-muted-foreground" />
          </div>
          {!result && !prediction.isPending ? (
            <div className="flex min-h-[470px] flex-col items-center justify-center px-10 text-center">
              <div className="relative grid h-16 w-16 place-items-center rounded-2xl border border-dashed border-primary/35 bg-primary/5"><div className="absolute inset-2 rounded-xl border border-primary/15" /><Search size={24} className="text-primary/70" /></div>
              <h3 className="mt-5 text-sm font-extrabold">Decision desk is ready</h3>
              <p className="mt-2 max-w-xs text-xs leading-relaxed text-muted-foreground">Run a payment through the engine to see the 0–100 risk score, action, and investigation trail.</p>
              <div className="mt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.1em] text-muted-foreground/65"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> awaiting payment context</div>
            </div>
          ) : prediction.isPending ? (
            <div className="space-y-4 p-5"><div className="skeleton h-44 rounded-xl" /><div className="skeleton h-4 w-2/3 rounded" /><div className="skeleton h-20 rounded-lg" /><div className="skeleton h-20 rounded-lg" /></div>
          ) : result ? (
            <div className="animate-rise p-5">
              <div className={`decision-halo ${tone === 'alert' ? 'alert' : ''} rounded-xl border p-5 ${tone === 'alert' ? 'border-destructive/25 bg-destructive/5' : tone === 'warm' ? 'border-accent/25 bg-accent/5' : 'border-primary/25 bg-primary/5'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="panel-label">Risk score</div>
                    <div data-testid="text-risk-score" className="mt-2 text-[64px] font-extrabold leading-none tracking-[-.08em]">{Math.round(riskScore)}<span className="text-2xl text-muted-foreground">/100</span></div>
                    <div className="mt-2 text-[11px] font-semibold text-muted-foreground">fraud probability {(result.fraud_probability * 100).toFixed(1)}%</div>
                  </div>
                  <DecisionPill decision={result.decision} large />
                </div>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-background/70"><div className={`h-full rounded-full transition-all duration-700 ${tone === 'alert' ? 'bg-destructive' : tone === 'warm' ? 'bg-accent' : 'bg-primary'}`} style={{ width: `${Math.max(Math.min(riskScore, 100), 2)}%` }} /></div>
                <div className="mt-3 flex items-start gap-2 border-t border-border/70 pt-3"><Zap size={14} className={`mt-0.5 shrink-0 ${tone === 'alert' ? 'text-destructive' : tone === 'warm' ? 'text-accent' : 'text-primary'}`} /><div><div className="panel-label">Recommended action</div><p data-testid="text-recommended-action" className="mt-1 text-sm font-extrabold leading-snug">{result.recommended_action}</p></div></div>
              </div>

              <div className="mt-5 flex items-center justify-between"><div><div className="panel-label text-primary">03 / why it is risky</div><h3 className="mt-1 text-xs font-extrabold uppercase tracking-[.1em]">AI risk investigator</h3></div><span className="font-mono text-[10px] text-muted-foreground">{result.model_version}</span></div>
              <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3.5"><div className="flex items-start gap-2"><Sparkles size={14} className="mt-0.5 shrink-0 text-primary" /><p data-testid="text-investigation-headline" className="text-xs font-bold leading-relaxed">{result.investigation.headline}</p></div><p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">{result.investigation.transaction_summary}</p></div>
              <div className="mt-3 space-y-2">{result.investigation.evidence.slice(0, 3).map((reason, index) => <EvidenceRow key={`${reason.feature}-${index}`} reason={reason} index={index} />)}</div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-background/35 p-3"><div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.1em] text-muted-foreground"><Clock3 size={12} className="text-accent" /> Historical pattern</div><p className="mt-2 text-[11px] leading-relaxed text-foreground/75">{result.investigation.historical_pattern}</p></div>
                <div className="rounded-lg border border-border bg-background/35 p-3"><div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.1em] text-muted-foreground"><ShieldAlert size={12} className="text-primary" /> Verification</div><p className="mt-2 text-[11px] leading-relaxed text-foreground/75">{result.investigation.suggested_verification}</p></div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="mt-5 rounded-xl border border-primary/25 bg-card">
        <div className="flex flex-col gap-4 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div><div className="panel-label text-primary">Ask the desk</div><h2 className="mt-1 text-sm font-extrabold">Have a question about this payment?</h2><p className="mt-0.5 text-xs text-muted-foreground">The investigator uses the latest scored payment context, not a generic answer.</p></div>
          <MessageSquareText size={18} className="text-primary" />
        </div>
        <div className="grid gap-5 p-5 lg:grid-cols-[1fr_.9fr]">
          <form onSubmit={askQuestion} className="flex flex-col gap-3">
            <textarea data-testid="input-investigator-question" value={question} onChange={(event) => setQuestion(event.target.value)} disabled={!lastScoredInput || investigator.isPending} placeholder={lastScoredInput ? 'For example: which signal should an analyst verify first?' : 'Score a payment first to open the investigator.'} className="min-h-24 w-full resize-y rounded-lg border border-input bg-background/60 p-3 text-sm font-medium outline-none transition placeholder:text-muted-foreground/55 focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60" />
            <button type="submit" data-testid="button-ask-investigator" disabled={!lastScoredInput || question.trim().length < 2 || investigator.isPending} className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg border border-primary/40 bg-primary/10 px-4 text-xs font-extrabold text-primary transition hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-45">{investigator.isPending ? <><LoaderCircle size={14} className="animate-spin" /> Investigator is reading</> : <><MessageSquareText size={14} /> Ask risk investigator</>}</button>
            {investigator.isError && <p data-testid="status-investigator-error" className="flex items-center gap-2 text-xs font-semibold text-destructive"><CircleAlert size={13} /> The investigator could not answer. Try the question again.</p>}
          </form>
          <div className="min-h-28 rounded-lg border border-border bg-background/35 p-4">
            {!answer && !investigator.isPending ? <div className="flex h-full items-center gap-3 text-xs text-muted-foreground"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-secondary"><Sparkles size={15} /></div><span>Answers will include supporting evidence and the next best action.</span></div> : investigator.isPending ? <div className="space-y-3"><div className="skeleton h-3 w-4/5 rounded" /><div className="skeleton h-3 w-full rounded" /><div className="skeleton h-3 w-2/3 rounded" /></div> : answer ? <div data-testid="panel-investigator-answer"><div className="flex items-center justify-between gap-3"><span className="panel-label text-primary">Investigator answer</span><span className="font-mono text-[10px] text-primary">{(answer.confidence * 100).toFixed(0)}% confidence</span></div><p className="mt-2 text-sm font-bold leading-relaxed">{answer.answer}</p><div className="mt-3 border-t border-border pt-3"><div className="panel-label">Next best action</div><p className="mt-1 text-xs font-extrabold">{answer.next_best_action}</p></div></div> : null}
          </div>
        </div>
      </section>

      <section className="mt-7 rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div><div className="panel-label">Recent decisions</div><h2 className="mt-1 text-sm font-extrabold">The payment flow, at a glance</h2><p className="mt-0.5 text-xs text-muted-foreground">Latest scored payments entering your review queue.</p></div>
          <button type="button" data-testid="button-refresh-transactions" onClick={() => transactions.refetch()} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-[11px] font-bold text-muted-foreground transition hover:border-primary hover:text-primary"><RefreshCw size={13} className={transactions.isFetching ? 'animate-spin' : ''} /> Refresh feed</button>
        </div>
        {transactions.isLoading ? <div className="space-y-3 p-5">{[1, 2, 3, 4].map((item) => <div key={item} className="skeleton h-12 rounded-lg" />)}</div> : transactions.isError ? <div className="p-5"><QueryError onRetry={() => transactions.refetch()} label="Decision feed unavailable" /></div> : records.length === 0 ? <div className="flex min-h-40 flex-col items-center justify-center p-6 text-center"><div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary"><Radar size={18} className="text-muted-foreground" /></div><p className="mt-3 text-sm font-bold">No scored payments yet</p><p className="mt-1 text-xs text-muted-foreground">The live feed will populate after the first decision.</p></div> :
          <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead><tr className="border-b border-border text-[10px] uppercase tracking-[.12em] text-muted-foreground"><th className="px-5 py-3 font-extrabold">Payment</th><th className="px-3 py-3 font-extrabold">Amount</th><th className="px-3 py-3 font-extrabold">Context</th><th className="px-3 py-3 font-extrabold">Probability</th><th className="px-3 py-3 font-extrabold">Signal</th><th className="px-5 py-3 text-right font-extrabold">Time</th></tr></thead><tbody>{records.map((record) => <tr key={record.id} data-testid={`row-transaction-${record.id}`} className="border-b border-border/65 last:border-0 transition hover:bg-secondary/35"><td className="px-5 py-3.5"><div className="flex items-center gap-3"><div className="grid h-8 w-8 place-items-center rounded-lg bg-secondary">{record.device_type === 'mobile' ? <Smartphone size={14} /> : record.device_type === 'tablet' ? <Tablet size={14} /> : <Laptop size={14} />}</div><div><div className="font-mono text-[11px] font-medium">{record.id.slice(0, 12)}</div><div className="mt-0.5 text-[10px] capitalize text-muted-foreground">{formatLabel(record.merchant_category)}</div></div></div></td><td className="px-3 py-3.5 text-xs font-extrabold">{formatCurrency(record.transaction_amount)}</td><td className="px-3 py-3.5"><div className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Globe2 size={12} />{record.country}<span className="text-border">·</span>{record.is_new_device ? 'new device' : 'known device'}</div></td><td className={`px-3 py-3.5 font-mono text-xs font-bold ${record.fraud_probability >= .5 ? 'text-destructive' : 'text-primary'}`}>{(record.fraud_probability * 100).toFixed(1)}%</td><td className="px-3 py-3.5"><DecisionPill decision={record.prediction === 'HIGH RISK' ? 'REVIEW' : 'APPROVE'} /></td><td className="px-5 py-3.5 text-right font-mono text-[10px] text-muted-foreground">{formatTime(record.created_at)}</td></tr>)}</tbody></table></div>}
      </section>
    </div>
  );
}