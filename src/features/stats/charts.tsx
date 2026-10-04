'use client';

import { format, parseISO } from 'date-fns';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { capitalize, formatNumber } from '@/lib/format';
import type { Condition, Overview } from '@/lib/types';
import { axisProps, tooltipStyle } from './chart-card';

/** Admissions per day or month (the API picks the bucket from the range length). */
export function AdmissionsChart({ series }: { series: Overview['patientsOverTime'] }) {
  const pattern = series.unit === 'day' ? 'd MMM' : 'MMM yy';
  const data = series.points.map((p) => ({
    label: format(parseISO(p.date), pattern),
    count: p.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="admissionsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey="label" {...axisProps} minTickGap={16} />
        <YAxis {...axisProps} allowDecimals={false} width={48} />
        <Tooltip
          {...tooltipStyle}
          cursor={{ stroke: 'var(--border)' }}
          formatter={(value) => [formatNumber(Number(value)), 'Admissions']}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="var(--chart-1)"
          strokeWidth={2}
          fill="url(#admissionsFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** Top 10 doctors by patient count, horizontal so long names stay readable. */
export function TopDoctorsChart({ doctors }: { doctors: Overview['topDoctors'] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(200, doctors.length * 34)}>
      <BarChart data={doctors} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid horizontal={false} stroke="var(--border)" />
        <XAxis type="number" {...axisProps} allowDecimals={false} />
        <YAxis type="category" dataKey="name" {...axisProps} width={120} />
        <Tooltip
          {...tooltipStyle}
          formatter={(value) => [formatNumber(Number(value)), 'Patients']}
        />
        <Bar dataKey="count" fill="var(--chart-1)" radius={[0, 4, 4, 0]} barSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Same meaning as the condition badges in the tables
const CONDITION_COLORS: Record<Condition, string> = {
  stable: 'var(--chart-5)',
  recovering: 'var(--chart-2)',
  critical: 'var(--chart-3)',
  discharged: 'var(--muted-foreground)',
};

/** Donut plus a legend with counts and percentages: the legend carries the numbers. */
export function ConditionChart({ data }: { data: Overview['patientsByCondition'] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="size-40">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="condition"
              innerRadius="62%"
              outerRadius="100%"
              paddingAngle={2}
              stroke="none"
            >
              {data.map((d) => (
                <Cell key={d.condition} fill={CONDITION_COLORS[d.condition]} />
              ))}
            </Pie>
            <Tooltip
              {...tooltipStyle}
              formatter={(value, name) => [formatNumber(Number(value)), capitalize(String(name))]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="w-full space-y-2 text-sm">
        {data.map((d) => (
          <li key={d.condition} className="flex items-center gap-2">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: CONDITION_COLORS[d.condition] }}
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate">{capitalize(d.condition)}</span>
            <span className="font-medium whitespace-nowrap tabular-nums">
              {formatNumber(d.count)}
            </span>
            <span className="text-muted-foreground w-10 shrink-0 text-right whitespace-nowrap tabular-nums">
              {total ? Math.round((d.count / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** How the doctors are spread across specializations. */
/** Horizontal bars: long specialization names stay readable without rotated labels. */
export function SpecializationChart({ data }: { data: Overview['doctorsBySpecialization'] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 30)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid horizontal={false} stroke="var(--border)" />
        <XAxis type="number" {...axisProps} allowDecimals={false} />
        <YAxis type="category" dataKey="specialization" {...axisProps} width={130} />
        <Tooltip
          {...tooltipStyle}
          formatter={(value) => [formatNumber(Number(value)), 'Doctors']}
        />
        <Bar dataKey="count" fill="var(--chart-4)" radius={[0, 4, 4, 0]} barSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}
