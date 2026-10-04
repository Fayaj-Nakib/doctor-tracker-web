'use client';

import { ArrowLeft, Building2, CalendarDays, Mail, Phone, Plus, Users } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { DateRangeFilter } from '@/components/shared/date-range-filter';
import { FilterSelect } from '@/components/shared/filter-select';
import { Pagination } from '@/components/shared/pagination';
import { SearchInput } from '@/components/shared/search-input';
import { EmptyState, ErrorState, TableSkeleton } from '@/components/shared/states';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useDeletePatient, usePatients } from '@/features/patients/hooks';
import { PatientFormDialog } from '@/features/patients/patient-form-dialog';
import { PatientsTable } from '@/features/patients/patients-table';
import { useUrlState } from '@/hooks/use-url-state';
import { ApiError } from '@/lib/api';
import { capitalize, formatDate, formatNumber } from '@/lib/format';
import type { Condition, Patient } from '@/lib/types';
import { useDoctor } from './hooks';

const CONDITION_OPTIONS = (['stable', 'recovering', 'critical', 'discharged'] as Condition[]).map(
  (c) => ({ value: c, label: capitalize(c) }),
);

export function DoctorDetailView({ id }: { id: string }) {
  const doctor = useDoctor(id);
  const { get, set, clear, hasFilters } = useUrlState();
  const [addOpen, setAddOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Patient | null>(null);
  const [searchKey, setSearchKey] = useState(0);
  const deletePatient = useDeletePatient();

  const params = {
    doctorId: id,
    page: get('page') || 1,
    limit: 10,
    search: get('search'),
    condition: get('condition'),
    from: get('from'),
    to: get('to'),
  };
  const patients = usePatients(params);

  const onSearch = useCallback((search: string) => set({ search }), [set]);
  const clearFilters = () => {
    clear();
    setSearchKey((key) => key + 1);
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    deletePatient.mutate(toDelete._id, {
      onSuccess: () => {
        toast.success(
          `${toDelete.name} removed from ${doctor.data?.name ?? 'this doctor'}'s patients`,
        );
        setToDelete(null);
      },
      onError: (error) => toast.error(error.message),
    });
  };

  if (doctor.isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <TableSkeleton rows={5} />
      </div>
    );
  }

  if (doctor.isError) {
    const notFound = doctor.error instanceof ApiError && doctor.error.status === 404;
    return notFound ? (
      <EmptyState
        title="Doctor not found"
        description="This doctor may have been removed, or the link is wrong."
        action={
          <Button asChild variant="outline">
            <Link href="/doctors">Back to doctors</Link>
          </Button>
        }
      />
    ) : (
      <ErrorState message={doctor.error.message} onRetry={() => doctor.refetch()} />
    );
  }

  const d = doctor.data;

  return (
    <>
      <Link
        href="/doctors"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" /> All doctors
      </Link>

      {/* Profile */}
      <section className="bg-background grid gap-6 rounded-xl border p-6 md:grid-cols-[1fr_auto]">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{d.name}</h1>
            <Badge variant="outline">{d.specialization}</Badge>
          </div>
          <dl className="text-muted-foreground grid gap-2 text-sm sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <Building2 className="size-4" aria-hidden />
              <dt className="sr-only">Hospital</dt>
              <dd>{d.hospital}</dd>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="size-4" aria-hidden />
              <dt className="sr-only">Phone</dt>
              <dd>
                <a href={`tel:${d.phone}`} className="hover:text-foreground">
                  {d.phone}
                </a>
              </dd>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="size-4" aria-hidden />
              <dt className="sr-only">Email</dt>
              <dd className="truncate">
                <a href={`mailto:${d.email}`} className="hover:text-foreground">
                  {d.email}
                </a>
              </dd>
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4" aria-hidden />
              <dt className="sr-only">Joined</dt>
              <dd>Joined {formatDate(d.createdAt)}</dd>
            </div>
          </dl>
        </div>
        <div className="bg-muted/50 flex items-center gap-3 rounded-lg px-5 py-4 md:flex-col md:justify-center md:text-center">
          <Users className="text-primary size-5" aria-hidden />
          <div>
            <p className="text-3xl font-semibold tabular-nums">{formatNumber(d.patientCount)}</p>
            <p className="text-muted-foreground text-xs">patients</p>
          </div>
        </div>
      </section>

      {/* Patients */}
      <section className="space-y-4" aria-labelledby="patients-heading">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="patients-heading" className="text-lg font-semibold">
            Patients
          </h2>
          <Button onClick={() => setAddOpen(true)}>
            <Plus /> Add patient
          </Button>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
          <SearchInput
            key={searchKey}
            defaultValue={params.search}
            onSearch={onSearch}
            placeholder="Search patients by name"
            className="lg:w-72"
          />
          <FilterSelect
            label="Condition"
            allLabel="All conditions"
            value={params.condition}
            onChange={(condition) => set({ condition })}
            options={CONDITION_OPTIONS}
          />
          <DateRangeFilter
            label="Admitted"
            from={params.from}
            to={params.to}
            onChange={(range) => set(range)}
          />
          {hasFilters && (
            <Button variant="ghost" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>

        {patients.isPending ? (
          <TableSkeleton rows={5} />
        ) : patients.isError ? (
          <ErrorState message={patients.error.message} onRetry={() => patients.refetch()} />
        ) : patients.data.data.length === 0 ? (
          <EmptyState
            icon={Users}
            title={hasFilters ? 'No patients match these filters' : 'No patients yet'}
            description={
              hasFilters
                ? 'Try a different search or clear the filters.'
                : `Add ${d.name}'s first patient.`
            }
          />
        ) : (
          <div className="space-y-4">
            <PatientsTable
              patients={patients.data.data}
              showDoctor={false}
              onDelete={setToDelete}
              isFetching={patients.isPlaceholderData}
            />
            <Pagination
              meta={patients.data.meta}
              isFetching={patients.isPlaceholderData}
              onPageChange={(page) => set({ page })}
            />
          </div>
        )}
      </section>

      <PatientFormDialog
        mode="create"
        doctorId={d._id}
        doctorName={d.name}
        open={addOpen}
        onOpenChange={setAddOpen}
      />

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={`Delete ${toDelete?.name ?? 'patient'}?`}
        description="This permanently removes the patient and their record. This can't be undone."
        confirmLabel="Delete patient"
        onConfirm={confirmDelete}
        pending={deletePatient.isPending}
      />
    </>
  );
}
