import type { Metadata } from 'next';
import { PageHeader } from '@/components/shared/page-header';

export const metadata: Metadata = { title: 'Patients' };

export default function PatientsPage() {
  return <PageHeader title="Patients" description="Search, filter and update every patient." />;
}
