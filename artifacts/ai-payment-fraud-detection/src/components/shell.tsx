import { Activity, BarChart3, Bell, ChevronRight, CircleHelp, Command, ShieldCheck } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useHealthCheck } from '@workspace/api-client-react';
import type { ReactNode } from 'react';

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const health = useHealthCheck();
  const serviceReady = health.data?.status === 'ok' || health.data?.status === 'healthy' || !!health.data;

  return (
    <div className="noise min-h-[100dvh] bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-sidebar-border bg-sidebar px-4 py-5 text-sidebar-foreground md:flex">
        <div className="flex items-center gap-3 px-2">
          <div className="grid h-9 w-9 place-items-center rounded-[10px] bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_8px_22px_hsl(var(--sidebar-primary)/.18)]">
            <ShieldCheck size={20} strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-[15px] font-extrabold tracking-tight text-white">sentinel<span className="text-sidebar-primary">/</span>risk</div>
            <div className="font-mono text-[9px] uppercase tracking-[.18em] text-sidebar-foreground/50">payment intelligence</div>
          </div>
        </div>

        <div className="mt-10 px-2 font-mono text-[10px] uppercase tracking-[.18em] text-sidebar-foreground/35">workspace</div>
        <nav className="mt-3 space-y-1" aria-label="Primary navigation">
          <Link href="/" data-testid="link-overview" className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${location === '/' ? 'bg-sidebar-accent text-white' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-white'}`}>
            <Activity size={17} className={location === '/' ? 'text-sidebar-primary' : ''} />
            <span>Live overview</span>
            {location === '/' && <ChevronRight size={14} className="ml-auto text-sidebar-primary" />}
          </Link>
          <Link href="/analytics" data-testid="link-analytics" className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${location === '/analytics' ? 'bg-sidebar-accent text-white' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-white'}`}>
            <BarChart3 size={17} className={location === '/analytics' ? 'text-sidebar-primary' : ''} />
            <span>Model analytics</span>
            {location === '/analytics' && <ChevronRight size={14} className="ml-auto text-sidebar-primary" />}
          </Link>
        </nav>

        <div className="mt-auto space-y-4">
          <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/45 p-3.5">
            <div className="flex items-center gap-2 text-[11px] font-bold text-white">
              <span className={`h-1.5 w-1.5 rounded-full ${health.isError ? 'bg-destructive' : 'bg-sidebar-primary'}`} />
              scoring engine
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-sidebar-foreground/55">{health.isLoading ? 'Connecting to health endpoint…' : serviceReady ? 'Operational · decisions in real time' : 'Awaiting service heartbeat'}</p>
          </div>
          <div className="flex items-center gap-3 border-t border-sidebar-border pt-4">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-[#d8a16a] text-xs font-extrabold text-[#2a1c18]">AR</div>
            <div className="min-w-0">
              <div className="truncate text-xs font-bold text-white">Alex Rivera</div>
              <div className="truncate text-[10px] text-sidebar-foreground/50">Risk operations</div>
            </div>
            <CircleHelp size={15} className="ml-auto text-sidebar-foreground/35" />
          </div>
        </div>
      </aside>

      <div className="md:pl-[248px]">
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-border/80 bg-background/90 px-5 backdrop-blur-xl md:px-8">
          <div className="flex items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground md:hidden"><ShieldCheck size={17} /></div>
            <div className="hidden items-center gap-2 font-mono text-[11px] text-muted-foreground sm:flex">
              <span className="text-primary">OPS</span><span>/</span><span>{location === '/analytics' ? 'MODEL ANALYTICS' : 'LIVE OVERVIEW'}</span>
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground sm:hidden">{location === '/analytics' ? 'Analytics' : 'Overview'}</div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-semibold text-muted-foreground lg:flex">
              <Command size={13} /> <span>⌘ K</span>
            </div>
            <button type="button" data-testid="button-notifications" className="relative grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition hover:text-foreground">
              <Bell size={16} />
              <span className="absolute right-2 top-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
            </button>
            <div className="hidden h-7 w-px bg-border sm:block" />
            <div className="hidden text-right sm:block"><div className="text-[11px] font-bold">risk-ops / primary</div><div className="font-mono text-[9px] text-muted-foreground">UTC · 09:41:28</div></div>
          </div>
        </header>
        <main className="app-grid min-h-[calc(100dvh-68px)] px-5 py-7 md:px-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}