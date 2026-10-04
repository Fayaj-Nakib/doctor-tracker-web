'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type DateRangeFilterProps = {
  from: string; // yyyy-mm-dd or ""
  to: string;
  onChange: (range: { from: string; to: string }) => void;
  label?: string;
};

/** Native date inputs: accessible, keyboard-friendly, and use the phone's own picker. */
export function DateRangeFilter({ from, to, onChange, label = 'Date' }: DateRangeFilterProps) {
  return (
    <fieldset className="flex items-end gap-2">
      <legend className="sr-only">{label} range</legend>
      <div className="grid gap-1">
        <Label htmlFor="date-from" className="text-muted-foreground text-xs">
          {label} from
        </Label>
        <Input
          id="date-from"
          type="date"
          value={from}
          max={to || undefined}
          onChange={(event) => onChange({ from: event.target.value, to })}
          className="w-full sm:w-40"
        />
      </div>
      <div className="grid gap-1">
        <Label htmlFor="date-to" className="text-muted-foreground text-xs">
          to
        </Label>
        <Input
          id="date-to"
          type="date"
          value={to}
          min={from || undefined}
          onChange={(event) => onChange({ from, to: event.target.value })}
          className="w-full sm:w-40"
        />
      </div>
    </fieldset>
  );
}
