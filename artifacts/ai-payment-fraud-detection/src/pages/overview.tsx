import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { ArrowUpRight, Check, Clock3, Cpu, Fingerprint, Globe2, Laptop, LoaderCircle, LockKeyhole, Radar, ShieldAlert, Smartphone, Tablet, Zap } from 'lucide-react';
import { useGetDashboardSummary, useListTransactions, usePredictTransaction } from '@workspace/api-client-react';
import { QueryError, StatSkeleton } from '@/components/data-states';

const defaults = {
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
  transactions_last_1h: 'Transactions · 1h',
  transactions_last_24h: 'Transactions · 24h',
  avg_spend: 'Average spend',
  spend_std_dev: 'Spend deviation',
  account_age_days: 'Account age',
};

function formatCurrency(value?: number) {
  return typeof value === 'number' ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value) : '—';
}

function formatTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function RiskBadge({ high }: { high: boolean }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-extrabold uppercase tracking-[.08em] ${high ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}><span className={`h-1.5 w-1.5 rounded-full ${high ? 'bg-destructive' : 'bg-primary'}`} />{high ? 'High risk' : 'Low risk'}</span>;
}

function MetricCard({ label, value, detail, tone = 'default', loading }: { label: string; value: string; detail: string; tone?: 'default' | 'warm' | 'teal'; loading?: boolean }) {
  if (loading) return <StatSkeleton />;
  return <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_12px_24px_hsl(222_32%_16%/.05)]">
    <div className={`absolute right-0 top-0 h-16 w-16 translate-x-7 -translate-y-7 rounded-full blur-2xl ${tone === 'warm' ? 'bg-accent/20' : tone === 'teal' ? 'bg-primary/15' : 'bg-muted'}`} />
    <div className="relative flex items-start justify-between"><span className="text-[11px] font-bold uppercase tracking-[.12em] text-muted-foreground">{label}</span><ArrowUpRight size={14} className="text-muted-foreground/45 transition group-hover:text-primary" /></div>
    <div className="relative mt-3 text-[25px] font-extrabold tracking-[-.04em]">{value}</div>
    <div className="relative mt-1 text-[11px] font-medium text-muted-foreground">{detail}</div>
  </div>;
}

function FormField({ label, name, value, onChange, type = 'text', min, max, step, suffix }: { label: string; name: string; value: string; onChange: (event: ChangeEvent<HTMLInputElement>) => void; type?: string; min?: string; max?: string; step?: string; suffix?: string }) {
  return <label className="block"><span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-[.11em] text-muted-foreground">{label}</span><div className="relative"><input data-testid={`input-${name}`} required name={name} value={value} onChange={onChange} type={type} min={min} max={max} step={step} className={`h-10 w-full rounded-lg border border-input bg-background/70 px-3 text-sm font-semibold outline-none transition placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/15 ${suffix ? 'pr-12' : ''}`} />{suffix && <span className="pointer-events-none absolute right-3 top-2.5 font-mono text-[11px] text-muted-foreground">{suffix}</span>}</div></label>;
}

export default function Overview() {
  const summary = useGetDashboardSummary();
  const transactions = useListTransactions({ limit: 8 });
  const prediction = usePredictTransaction();
  const [form, setForm] = useState(defaults);
  const [resultOpen, setResultOpen] = useState(false);

  const records = useMemo(() => transactions.data ?? [], [transactions.data]);
  const change = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    prediction.mutate({ data: {
      transaction_amount: Number(form.transaction_amount),
      transaction_hour: Number(form.transaction_hour),
      day_of_week: Number(form.day_of_week),
      merchant_category: form.merchant_category as 'retail' | 'travel' | 'digital_goods' | 'grocery' | 'dining' | 'services',
      country: form.country.toUpperCase(),
      device_type: form.device_type as 'mobile' | 'desktop' | 'tablet',
      is_new_device: form.is_new_device,
      transactions_last_1h: Number(form.transactions_last_1h),
      transactions_last_24h: Number(form.transactions_last_24h),
      avg_spend: Number(form.avg_spend),
      spend_std_dev: Number(form.spend_std_dev),
      account_age_days: Number(form.account_age_days),
    } }, { onSuccess: () => setResultOpen(true) });
  };

  const highRisk = prediction.data?.prediction === 'HIGH RISK';
  const probability = prediction.data ? Math.round(prediction.data.fraud_probability * 100) : 0;

  return <div className="mx-auto max-w-[1440px] animate-rise">
    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <div><div className="flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[.16em] text-primary"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" /> live scoring workspace</div><h1 className="mt-2 text-[30px] font-extrabold tracking-[-.045em] md:text-[36px]">Decide with evidence.</h1><p className="mt-1 max-w-xl text-sm text-muted-foreground">Score a payment in seconds, then see exactly what moved the model.</p></div>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-[11px] font-semibold text-muted-foreground"><LockKeyhole size={13} className="text-primary" /> Analyst mode <span className="ml-1 rounded bg-secondary px-1.5 py-0.5 font-mono text-[9px]">v2.4.1</span></div>
    </div>

    <section className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard loading={summary.isLoading} label="Transactions monitored" value={summary.data ? summary.data.total_transactions.toLocaleString() : '—'} detail="Across the last 24 hours" tone="teal" />
      <MetricCard loading={summary.isLoading} label="Flagged for review" value={summary.data ? summary.data.flagged_transactions.toLocaleString() : '—'} detail={summary.data ? `${(summary.data.alert_rate * 100).toFixed(1)}% alert rate` : 'Awaiting signal'} tone="warm" />
      <MetricCard loading={summary.isLoading} label="Prevented value" value={summary.data ? formatCurrency(summary.data.prevented_value) : '—'} detail="Estimated exposure blocked" />
      <MetricCard loading={summary.isLoading} label="Average probability" value={summary.data ? `${(summary.data.avg_probability * 100).toFixed(1)}%` : '—'} detail={summary.data ? `Model ${summary.data.model_status.toLowerCase()}` : 'Awaiting signal'} tone="teal" />
    </section>
    {summary.isError && <div className="mt-3"><QueryError onRetry={() => summary.refetch()} label="Dashboard summary unavailable" /></div>}

    <section className="mt-7 grid items-start gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(390px,.92fr)]">
      <div className="rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div><h2 className="text-sm font-extrabold">Score a transaction</h2><p className="mt-0.5 text-xs text-muted-foreground">Input the payment context for an instant model decision.</p></div>
          <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 font-mono text-[9px] font-medium text-primary"><Zap size={11} /> response &lt; 120ms</div>
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
          <div className="mt-6 border-t border-border pt-5"><div className="mb-3 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.13em] text-muted-foreground"><Fingerprint size={13} className="text-primary" /> Account &amp; velocity context</div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><FormField label="Transactions · 1h" name="transactions_last_1h" value={form.transactions_last_1h} onChange={change} type="number" min="0" /><FormField label="Transactions · 24h" name="transactions_last_24h" value={form.transactions_last_24h} onChange={change} type="number" min="0" /><FormField label="Average spend" name="avg_spend" value={form.avg_spend} onChange={change} type="number" min="0" step="0.01" suffix="USD" /><FormField label="Spend deviation" name="spend_std_dev" value={form.spend_std_dev} onChange={change} type="number" min="0" step="0.01" suffix="USD" /></div><div className="mt-4 grid gap-4 sm:grid-cols-2"><FormField label="Account age" name="account_age_days" value={form.account_age_days} onChange={change} type="number" min="0" suffix="days" /><label className="flex h-10 items-center gap-3 self-end rounded-lg border border-input bg-background/70 px-3"><input data-testid="input-is-new-device" type="checkbox" checked={form.is_new_device} onChange={(event) => setForm((current) => ({ ...current, is_new_device: event.target.checked }))} className="h-4 w-4 accent-[hsl(var(--primary))]" /><span className="text-xs font-bold">New device detected</span><span className="ml-auto rounded bg-accent/20 px-1.5 py-0.5 font-mono text-[9px] text-accent-foreground">signal</span></label></div></div>
          <button type="submit" data-testid="button-score-transaction" disabled={prediction.isPending} className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-extrabold text-primary-foreground shadow-[0_8px_18px_hsl(var(--primary)/.18)] transition hover:brightness-95 disabled:cursor-wait disabled:opacity-70">{prediction.isPending ? <><LoaderCircle size={16} className="animate-spin" /> Scoring transaction…</> : <><Radar size={16} /> Score transaction</>}</button>
          {prediction.isError && <p data-testid="status-score-error" className="mt-3 text-center text-xs font-semibold text-destructive">Scoring failed. Check the payment inputs and retry.</p>}
        </form>
      </div>

      <div className={`overflow-hidden rounded-xl border ${resultOpen && prediction.data ? highRisk ? 'border-destructive/35' : 'border-primary/35' : 'border-border'} bg-card`}>
        <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="text-sm font-extrabold">Decision trace</h2><p className="mt-0.5 text-xs text-muted-foreground">Model output and top contributing signals.</p></div><Cpu size={17} className="text-muted-foreground" /></div>
        {!resultOpen || !prediction.data ? <div className="flex min-h-[410px] flex-col items-center justify-center px-10 text-center"><div className="relative grid h-16 w-16 place-items-center rounded-2xl border border-dashed border-primary/35 bg-primary/5"><div className="absolute inset-2 rounded-xl border border-primary/15" /><Radar size={25} className="text-primary/65" /></div><h3 className="mt-5 text-sm font-extrabold">Waiting for a transaction</h3><p className="mt-2 max-w-xs text-xs leading-relaxed text-muted-foreground">Run a score to see the probability, decision, and the evidence behind it.</p><div className="mt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.1em] text-muted-foreground/65"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> model ready</div></div> :
          <div className="animate-rise p-5"><div className={`rounded-lg border p-4 ${highRisk ? 'border-destructive/25 bg-destructive/5' : 'border-primary/25 bg-primary/5'}`}><div className="flex items-start justify-between"><div><RiskBadge high={!!highRisk} /><div data-testid="text-fraud-probability" className="mt-3 text-[42px] font-extrabold leading-none tracking-[-.06em]">{probability}<span className="text-xl text-muted-foreground">%</span></div><div className="mt-1 text-[11px] font-semibold text-muted-foreground">fraud probability</div></div><div className={`grid h-11 w-11 place-items-center rounded-full ${highRisk ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground'}`}>{highRisk ? <ShieldAlert size={22} /> : <Check size={22} />}</div></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-background/80"><div className={`h-full rounded-full transition-all duration-700 ${highRisk ? 'bg-destructive' : 'bg-primary'}`} style={{ width: `${Math.max(probability, 2)}%` }} /></div></div><div className="mt-5 flex items-center justify-between"><h3 className="text-xs font-extrabold uppercase tracking-[.1em]">Why this decision</h3><span className="font-mono text-[10px] text-muted-foreground">{prediction.data.model_version}</span></div><div className="mt-3 space-y-2">{prediction.data.top_reasons.map((reason, index) => <div key={`${reason.feature}-${index}`} data-testid={`reason-${index}`} className="rounded-lg border border-border bg-background/45 p-3"><div className="flex items-center justify-between gap-3"><span className="text-xs font-extrabold">{fieldLabels[reason.feature] ?? reason.feature}</span><span className={`font-mono text-[10px] font-medium ${reason.impact === 'positive' ? 'text-destructive' : 'text-primary'}`}>{reason.impact === 'positive' ? '+' : '−'}{Math.abs(reason.contribution).toFixed(2)}</span></div><p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{reason.detail}</p></div>)}</div><div className="mt-4 flex items-center gap-2 border-t border-border pt-4 font-mono text-[10px] text-muted-foreground"><Clock3 size={12} /> Scored {formatTime(prediction.data.scored_at)}</div></div>}
      </div>
    </section>

    <section className="mt-7 rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4"><div><h2 className="text-sm font-extrabold">Recent decisions</h2><p className="mt-0.5 text-xs text-muted-foreground">The latest scored payments entering your review queue.</p></div><button type="button" data-testid="button-refresh-transactions" onClick={() => transactions.refetch()} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-[11px] font-bold text-muted-foreground transition hover:border-primary hover:text-primary"><RefreshIcon spinning={transactions.isFetching} /> Refresh feed</button></div>
      {transactions.isLoading ? <div className="space-y-3 p-5">{[1, 2, 3, 4].map((item) => <div key={item} className="skeleton h-12 rounded-lg" />)}</div> : transactions.isError ? <div className="p-5"><QueryError onRetry={() => transactions.refetch()} label="Decision feed unavailable" /></div> : records.length === 0 ? <div className="flex min-h-40 flex-col items-center justify-center p-6 text-center"><div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary"><Radar size={18} className="text-muted-foreground" /></div><p className="mt-3 text-sm font-bold">No scored transactions yet</p><p className="mt-1 text-xs text-muted-foreground">Your live feed will populate after the first decision.</p></div> :
        <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left"><thead><tr className="border-b border-border text-[10px] uppercase tracking-[.12em] text-muted-foreground"><th className="px-5 py-3 font-extrabold">Transaction</th><th className="px-3 py-3 font-extrabold">Amount</th><th className="px-3 py-3 font-extrabold">Context</th><th className="px-3 py-3 font-extrabold">Probability</th><th className="px-3 py-3 font-extrabold">Decision</th><th className="px-5 py-3 text-right font-extrabold">Time</th></tr></thead><tbody>{records.map((record) => <tr key={record.id} data-testid={`row-transaction-${record.id}`} className="border-b border-border/65 last:border-0 transition hover:bg-secondary/35"><td className="px-5 py-3.5"><div className="flex items-center gap-3"><div className="grid h-8 w-8 place-items-center rounded-lg bg-secondary">{record.device_type === 'mobile' ? <Smartphone size={14} /> : record.device_type === 'tablet' ? <Tablet size={14} /> : <Laptop size={14} />}</div><div><div className="font-mono text-[11px] font-medium">{record.id.slice(0, 12)}</div><div className="mt-0.5 text-[10px] text-muted-foreground">{record.merchant_category.replace('_', ' ')}</div></div></div></td><td className="px-3 py-3.5 text-xs font-extrabold">{formatCurrency(record.transaction_amount)}</td><td className="px-3 py-3.5"><div className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Globe2 size={12} />{record.country} <span className="text-border">·</span> {record.is_new_device ? 'new device' : 'known device'}</div></td><td className="px-3 py-3.5"><span className={`font-mono text-xs font-bold ${record.fraud_probability >= .5 ? 'text-destructive' : 'text-primary'}`}>{(record.fraud_probability * 100).toFixed(1)}%</span></td><td className="px-3 py-3.5"><RiskBadge high={record.prediction === 'HIGH RISK'} /></td><td className="px-5 py-3.5 text-right font-mono text-[10px] text-muted-foreground">{formatTime(record.created_at)}</td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return <svg className={spinning ? 'animate-spin' : ''} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 11a8.1 8.1 0 0 0-14.9-3M4 5v4h4M4 13a8.1 8.1 0 0 0 14.9 3M20 19v-4h-4" /></svg>;
}