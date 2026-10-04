import type { Metadata } from 'next';
import { Suspense } from 'react';
import { TableSkeleton } from '@/components/shared/states';
import { DoctorDetailView } from '@/features/doctors/doctor-detail-view';

export const metadata: Metadata = { title: 'Doctor' };

export default async function DoctorPage({ params }: PageProps<'/doctors/[id]'>) {
  const { id } = await params; // route params are async in Next.js 15+
  return (
    <Suspense fallback={<TableSkeleton />}>
      <DoctorDetailView id={id} />
    </Suspense>
  );
}
