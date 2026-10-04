import { Suspense } from 'react';
import { DashboardView } from '@/features/stats/dashboard-view';

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardView />
    </Suspense>
  );
}
