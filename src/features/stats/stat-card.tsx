import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

type StatCardProps = {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: ReactNode;
  tone?: 'default' | 'critical';
};

export function StatCard({ label, value, icon: Icon, hint, tone = 'default' }: StatCardProps) {
  return (
    <div className="bg-background rounded-xl border p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-muted-foreground text-sm font-medium">{label}</p>
        <span
          className={
            tone === 'critical'
              ? 'grid size-8 place-items-center rounded-lg bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
              : 'bg-primary/10 text-primary grid size-8 place-items-center rounded-lg'
          }
        >
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
      {hint && <p className="text-muted-foreground mt-1 text-xs">{hint}</p>}
    </div>
  );
}
