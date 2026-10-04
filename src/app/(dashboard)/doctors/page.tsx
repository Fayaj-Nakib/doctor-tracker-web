import type { Metadata } from 'next';
import { Suspense } from 'react';
import { TableSkeleton } from '@/components/shared/states';
import { DoctorsView } from '@/features/doctors/doctors-view';

export const metadata: Metadata = { title: 'Doctors' };

// The view reads the URL (useSearchParams), so it renders inside a Suspense boundary
export default function DoctorsPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <DoctorsView />
    </Suspense>
  );
}
