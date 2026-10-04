'use client';

import { ErrorState } from '@/components/shared/states';

/** Catches render errors in any dashboard page without taking down the sidebar. */
export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return <ErrorState message="This page failed to load." onRetry={reset} />;
}
