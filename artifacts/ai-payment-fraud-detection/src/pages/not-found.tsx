import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

export default function NotFound() {
  return (
    <div className="app-grid flex min-h-[100dvh] w-full items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md border-border bg-card">
        <CardContent className="pt-6">
          <div className="mb-4 flex gap-3">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <div><div className="font-mono text-[10px] uppercase tracking-[.16em] text-destructive">signal lost · 404</div><h1 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">Page not found</h1></div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">This route is outside the active risk workspace.</p>
          <Link href="/" data-testid="link-return-overview" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-extrabold text-primary-foreground"><ArrowLeft size={14} /> Return to overview</Link>
        </CardContent>
      </Card>
    </div>
  );
}
