import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';

type FormFieldProps = { id: string; label: string; error?: string; children: ReactNode };

/** Label + control + error message, wired with aria so screen readers announce errors. */
export function FormField({ id, label, error, children }: FormFieldProps) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-destructive text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
