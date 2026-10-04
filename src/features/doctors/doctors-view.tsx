'use client';

import { Plus, Stethoscope } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { DateRangeFilter } from '@/components/shared/date-range-filter';
import { FilterSelect } from '@/components/shared/filter-select';
import { PageHeader } from '@/components/shared/page-header';
import { Pagination } from '@/components/shared/pagination';
import { SearchInput } from '@/components/shared/search-input';
import { EmptyState, ErrorState, TableSkeleton } from '@/components/shared/states';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useOptions } from '@/features/meta/use-options';
import { useUrlState } from '@/hooks/use-url-state';
import { formatDate, formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import { DoctorFormDialog } from './doctor-form-dialog';
import { useDoctors } from './hooks';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'name', label: 'Name A–Z' },
];

export function DoctorsView() {
  const router = useRouter();
  const { get, set, clear, hasFilters } = useUrlState();
  const { data: options } = useOptions();
  const [createOpen, setCreateOpen] = useState(false);
  const [searchKey, setSearchKey] = useState(0); // bump to reset the search box

  const params = {
    page: get('page') || 1,
    limit: 10,
    search: get('search'),
    specialization: get('specialization'),
    hospital: get('hospital'),
    from: get('from'),
    to: get('to'),
    sort: get('sort'),
  };
  const { data, isPending, isError, error, refetch, isPlaceholderData } = useDoctors(params);

  // Stable identity, so the search box's debounce timer isn't restarted by unrelated re-renders
  const onSearch = useCallback((search: string) => set({ search }), [set]);

  const clearFilters = () => {
    clear();
    setSearchKey((key) => key + 1);
  };

  return (
    <>
      <PageHeader
        title="Doctors"
        description="Manage doctors and see how many patients each one has."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus /> Add doctor
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
        <SearchInput
          key={searchKey}
          defaultValue={params.search}
          onSearch={onSearch}
          placeholder="Search by name or email"
          className="lg:w-72"
        />
        <FilterSelect
          label="Specialization"
          allLabel="All specializations"
          value={params.specialization}
          onChange={(specialization) => set({ specialization })}
          options={(options?.specializations ?? []).map((s) => ({ value: s, label: s }))}
        />
        <FilterSelect
          label="Hospital"
          allLabel="All hospitals"
          value={params.hospital}
          onChange={(hospital) => set({ hospital })}
          options={(options?.hospitals ?? []).map((h) => ({ value: h, label: h }))}
        />
        <DateRangeFilter
          label="Joined"
          from={params.from}
          to={params.to}
          onChange={(range) => set(range)}
        />
        <FilterSelect
          label="Sort"
          allLabel="Newest first"
          value={params.sort === 'newest' ? '' : params.sort}
          onChange={(sort) => set({ sort })}
          options={SORT_OPTIONS.slice(1)}
          className="sm:w-40"
        />
        {hasFilters && (
          <Button variant="ghost" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
      </div>

      {/* Results */}
      {isPending ? (
        <TableSkeleton />
      ) : isError ? (
        <ErrorState message={error.message} onRetry={() => refetch()} />
      ) : data.data.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title={hasFilters ? 'No doctors match these filters' : 'No doctors yet'}
          description={
            hasFilters
              ? 'Try a different search or clear the filters.'
              : 'Add your first doctor to get started.'
          }
          action={
            hasFilters ? (
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus /> Add doctor
              </Button>
            )
          }
        />
      ) : (
        <div className={cn('space-y-4 transition-opacity', isPlaceholderData && 'opacity-60')}>
          {/* Desktop: table. Whole row is clickable; the name is a real link for keyboard users */}
          <div className="bg-background hidden overflow-x-auto rounded-xl border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Specialization</TableHead>
                  <TableHead>Hospital</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Patients</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((doctor) => (
                  <TableRow
                    key={doctor._id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/doctors/${doctor._id}`)}
                  >
                    <TableCell>
                      <Link
                        href={`/doctors/${doctor._id}`}
                        className="font-medium hover:underline"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {doctor.name}
                      </Link>
                      <p className="text-muted-foreground text-xs">{doctor.email}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{doctor.specialization}</Badge>
                    </TableCell>
                    <TableCell>{doctor.hospital}</TableCell>
                    <TableCell className="tabular-nums">{doctor.phone}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatNumber(doctor.patientCount)}
                    </TableCell>
                    <TableCell className="tabular-nums">{formatDate(doctor.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile: cards */}
          <ul className="grid gap-3 md:hidden">
            {data.data.map((doctor) => (
              <li key={doctor._id}>
                <Link
                  href={`/doctors/${doctor._id}`}
                  className="bg-background hover:border-primary/40 block rounded-xl border p-4 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{doctor.name}</p>
                      <p className="text-muted-foreground text-xs">{doctor.hospital}</p>
                    </div>
                    <span className="text-right">
                      <span className="block font-semibold tabular-nums">
                        {formatNumber(doctor.patientCount)}
                      </span>
                      <span className="text-muted-foreground text-xs">patients</span>
                    </span>
                  </div>
                  <Badge variant="outline" className="mt-3">
                    {doctor.specialization}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>

          <Pagination
            meta={data.meta}
            isFetching={isPlaceholderData}
            onPageChange={(page) => set({ page })}
          />
        </div>
      )}

      <DoctorFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
