import { Badge } from '@/components/ui/badge';
import { capitalize } from '@/lib/format';
import type { Condition } from '@/lib/types';
import { cn } from '@/lib/utils';

// Colour supports the text label, never replaces it (readable for colour-blind users)
const STYLES: Record<Condition, string> = {
  stable: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  recovering: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  critical: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  discharged: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

export function ConditionBadge({ condition }: { condition: Condition }) {
  return (
    <Badge variant="secondary" className={cn('border-transparent font-medium', STYLES[condition])}>
      {capitalize(condition)}
    </Badge>
  );
}
