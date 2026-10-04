import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type ChartCardProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
};

export function ChartCard({ title, description, action, className, children }: ChartCardProps) {
  return (
    <section className={cn('bg-background flex flex-col rounded-xl border p-5', className)}>
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold">{title}</h2>
          {description && <p className="text-muted-foreground text-sm">{description}</p>}
        </div>
        {action}
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}

/** Shared tooltip look for every chart, using the theme's colours (works in dark mode). */
export const tooltipStyle = {
  contentStyle: {
    background: 'var(--popover)',
    color: 'var(--popover-foreground)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    fontSize: 12,
  },
  labelStyle: { color: 'var(--muted-foreground)', marginBottom: 4 },
  cursor: { fill: 'var(--muted)', opacity: 0.6 },
};

export const axisProps = {
  stroke: 'var(--muted-foreground)',
  fontSize: 12,
  tickLine: false,
  axisLine: false,
};
