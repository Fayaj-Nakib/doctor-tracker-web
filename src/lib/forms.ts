import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiError } from './api';

/**
 * Puts the API's field-level validation errors next to the matching inputs.
 * Returns true if at least one field error was applied.
 */
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
): boolean {
  if (!(error instanceof ApiError) || !Array.isArray(error.details)) return false;
  for (const detail of error.details) {
    setError(detail.field as Path<T>, { type: 'server', message: detail.message });
  }
  return error.details.length > 0;
}

/** Error props for an input: red border + error text linked for screen readers. */
export const errorProps = (id: string, message?: string) => ({
  id,
  'aria-invalid': message ? true : undefined,
  'aria-describedby': message ? `${id}-error` : undefined,
});
