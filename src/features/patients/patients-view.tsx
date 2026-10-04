'use client';

import { Users } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { DateRangeFilter } from '@/components/shared/date-range-filter';
import { FilterSelect } from '@/components/shared/filter-select';
import { PageHeader } from '@/components/shared/page-header';
import { Pagination } from '@/components/shared/pagination';
import { SearchInput } from '@/components/shared/search-input';
import { EmptyState, ErrorState, TableSkeleton } from '@/components/shared/states';
import { Button } from '@/components/ui/button';
import { useDoctors } from '@/features/doctors/hooks';
import { useOptions } from '@/features/meta/use-options';
import { useUrlState } from '@/hooks/use-url-state';
import { capitalize } from '@/lib/format';
import type { Patient } from '@/lib/types';
import { useDeletePatient, usePatients } from './hooks';
import { PatientFormDialog } from './patient-form-dialog';
import { PatientsTable } from './patients-table';

const SORT_OPTIONS = [
  { value: 'oldest', label: 'Oldest admission' },
  { value: 'name', label: 'Name A–Z' },
];

export function PatientsView() {
  const { get, set, clear, hasFilters } = useUrlState();
  const { data: options } = useOptions();
  // Doctor filter options: all doctors by name (61 today; a searchable combobox would scale further)
  const { data: doctors } = useDoctors({ limit: 100, sort: 'name' });
  const [searchKey, setSearchKey] = useState(0);
  const [toEdit, setToEdit] = useState<Patient | null>(null);
  const [toDelete, setToDelete] = useState<Patient | null>(null);
  const deletePatient = useDeletePatient();

  const params = {
    page: get('page') || 1,
    limit: 10,
    search: get('search'),
    condition: get('condition'),
    gender: get('gender'),
    doctorId: get('doctorId'),
    from: get('from'),
    to: get('to'),
    sort: get('sort'),
  };
  // With a doctor selected this calls /doctors/:id/patients, which returns the same filtered list
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
        toast.success(`${toDelete.name} deleted`);
        setToDelete(null);
      },
      onError: (error) => toast.error(error.message),
    });
  };

  return (
    <>
      <PageHeader
        title="Patients"
        description="Search, filter and update every patient across all doctors."
      />

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
          options={(options?.conditions ?? []).map((c) => ({ value: c, label: capitalize(c) }))}
          className="sm:w-40"
        />
        <FilterSelect
          label="Gender"
          allLabel="All genders"
          value={params.gender}
          onChange={(gender) => set({ gender })}
          options={(options?.genders ?? []).map((g) => ({ value: g, label: capitalize(g) }))}
          className="sm:w-36"
        />
        <FilterSelect
          label="Doctor"
          allLabel="All doctors"
          value={params.doctorId}
          onChange={(value) => set({ doctorId: value })}
          options={(doctors?.data ?? []).map((d) => ({ value: d._id, label: d.name }))}
        />
        <DateRangeFilter
          label="Admitted"
          from={params.from}
          to={params.to}
          onChange={(range) => set(range)}
        />
        <FilterSelect
          label="Sort"
          allLabel="Newest admission"
          value={params.sort === 'newest' ? '' : params.sort}
          onChange={(sort) => set({ sort })}
          options={SORT_OPTIONS}
          className="sm:w-44"
        />
        {hasFilters && (
          <Button variant="ghost" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
      </div>

      {patients.isPending ? (
        <TableSkeleton />
      ) : patients.isError ? (
        <ErrorState message={patients.error.message} onRetry={() => patients.refetch()} />
      ) : patients.data.data.length === 0 ? (
        <EmptyState
          icon={Users}
          title={hasFilters ? 'No patients match these filters' : 'No patients yet'}
          description={
            hasFilters
              ? 'Try a different search or clear the filters.'
              : 'Patients are added from a doctor’s page.'
          }
          action={
            hasFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-4">
          <PatientsTable
            patients={patients.data.data}
            onEdit={setToEdit}
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

      {/* key: a fresh form for each patient, pre-filled with their values */}
      {toEdit && (
        <PatientFormDialog
          key={toEdit._id}
          mode="edit"
          patient={toEdit}
          open
          onOpenChange={(open) => !open && setToEdit(null)}
        />
      )}

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
