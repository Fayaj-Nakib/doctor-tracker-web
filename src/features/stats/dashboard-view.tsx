'use client';

import { Activity, AlertTriangle, Stethoscope, Users } from 'lucide-react';
import Link from 'next/link';
import { FilterSelect } from '@/components/shared/filter-select';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState, ErrorState } from '@/components/shared/states';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useUrlState } from '@/hooks/use-url-state';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import { ChartCard } from './chart-card';
import { AdmissionsChart, ConditionChart, SpecializationChart, TopDoctorsChart } from './charts';
import { useOverview } from './hooks';
import { RANGES, rangeLabel, rangeToParams } from './ranges';
import { StatCard } from './stat-card';

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-80 rounded-xl lg:col-span-2" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );
}

export function DashboardView() {
  const { get, set } = useUrlState();
  const range = get('range');
  const { data, isPending, isError, error, refetch, isPlaceholderData } = useOverview(
    rangeToParams(range),
  );

  const period = rangeLabel(range).toLowerCase();
  const inRange = range ? ` (${period})` : '';

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Doctors, patients and admissions at a glance."
        actions={
          <FilterSelect
            label="Time range"
            allLabel="All time"
            value={range}
            onChange={(value) => set({ range: value })}
            options={RANGES.slice(1).map((r) => ({ value: r.value, label: r.label }))}
            className="sm:w-44"
          />
        }
      />

      {isPending ? (
        <DashboardSkeleton />
      ) : isError ? (
        <ErrorState message={error.message} onRetry={() => refetch()} />
      ) : data.totalDoctors === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title="No data yet"
          description="Add doctors and patients to see analytics here."
          action={
            <Button asChild>
              <Link href="/doctors">Go to doctors</Link>
            </Button>
          }
        />
      ) : (
        <div className={cn('space-y-6 transition-opacity', isPlaceholderData && 'opacity-60')}>
          {/* KPIs */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total doctors"
              value={formatNumber(data.totalDoctors)}
              icon={Stethoscope}
              hint={`Across ${data.doctorsBySpecialization.length} specializations`}
            />
            <StatCard
              label={`Patients${inRange}`}
              value={formatNumber(data.totalPatients)}
              icon={Users}
              hint={`${formatNumber(data.newPatientsThisMonth)} admitted this month`}
            />
            <StatCard
              label="Avg. patients per doctor"
              value={data.avgPatientsPerDoctor.toFixed(1)}
              icon={Activity}
              hint={
                data.topDoctors[0]
                  ? `Busiest: ${data.topDoctors[0].name} (${formatNumber(data.topDoctors[0].count)})`
                  : undefined
              }
            />
            <StatCard
              label={`Critical patients${inRange}`}
              value={formatNumber(data.criticalPatients)}
              icon={AlertTriangle}
              tone="critical"
              hint={
                data.totalPatients
                  ? `${Math.round((data.criticalPatients / data.totalPatients) * 100)}% of patients`
                  : undefined
              }
            />
          </div>

          {/* Trends */}
          <div className="grid gap-4 lg:grid-cols-3">
            <ChartCard
              title="Admissions over time"
              description={
                data.patientsOverTime.unit === 'day'
                  ? 'Patients admitted per day'
                  : 'Patients admitted per month'
              }
              className="lg:col-span-2"
            >
              <AdmissionsChart series={data.patientsOverTime} />
            </ChartCard>
            <ChartCard title="Patients by condition" description={`Share of patients${inRange}`}>
              <ConditionChart data={data.patientsByCondition} />
            </ChartCard>
          </div>

          {/* Distribution */}
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard
              title="Patients per doctor"
              description="Top 10 doctors by patient count"
              action={
                <Button asChild variant="ghost" size="sm">
                  <Link href="/doctors">View all</Link>
                </Button>
              }
            >
              <TopDoctorsChart doctors={data.topDoctors} />
            </ChartCard>
            <ChartCard
              title="Doctors by specialization"
              description="Where the team's expertise sits"
            >
              <SpecializationChart data={data.doctorsBySpecialization} />
            </ChartCard>
          </div>
        </div>
      )}
    </>
  );
}
