import { format, subDays, subMonths } from 'date-fns';

export const RANGES = [
  { value: '', label: 'All time' },
  { value: '12m', label: 'Last 12 months' },
  { value: '90d', label: 'Last 90 days' },
  { value: '30d', label: 'Last 30 days' },
] as const;

/** Turns a preset into the API's ?from=yyyy-mm-dd (no "to": up to today). */
export function rangeToParams(range: string): { from?: string } {
  const now = new Date();
  const from =
    range === '12m'
      ? subMonths(now, 12)
      : range === '90d'
        ? subDays(now, 90)
        : range === '30d'
          ? subDays(now, 30)
          : undefined;
  return from ? { from: format(from, 'yyyy-MM-dd') } : {};
}

export const rangeLabel = (range: string) =>
  RANGES.find((r) => r.value === range)?.label ?? 'All time';
