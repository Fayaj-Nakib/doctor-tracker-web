import type { Metadata } from 'next';
import { Suspense } from 'react';
import { TableSkeleton } from '@/components/shared/states';
import { PatientsView } from '@/features/patients/patients-view';

export const metadata: Metadata = { title: 'Patients' };

export default function PatientsPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <PatientsView />
    </Suspense>
  );
}
