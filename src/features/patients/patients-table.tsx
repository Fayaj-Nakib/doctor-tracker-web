'use client';

import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ageFrom, capitalize, formatDate } from '@/lib/format';
import type { Patient } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ConditionBadge } from './condition-badge';

type PatientsTableProps = {
  patients: Patient[];
  /** Hide the doctor column on a doctor's own page. */
  showDoctor?: boolean;
  onEdit?: (patient: Patient) => void;
  onDelete: (patient: Patient) => void;
  /** Dim rows while the next page loads (previous data stays visible). */
  isFetching?: boolean;
};

function RowActions({
  patient,
  onEdit,
  onDelete,
}: Pick<PatientsTableProps, 'onEdit' | 'onDelete'> & { patient: Patient }) {
  // modal={false}: the menu opens a dialog; a modal menu can leave the page unclickable
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Actions for ${patient.name}`}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onEdit && (
          <DropdownMenuItem onSelect={() => onEdit(patient)}>
            <Pencil /> Edit
          </DropdownMenuItem>
        )}
        <DropdownMenuItem variant="destructive" onSelect={() => onDelete(patient)}>
          <Trash2 /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function PatientsTable({
  patients,
  showDoctor = true,
  onEdit,
  onDelete,
  isFetching,
}: PatientsTableProps) {
  return (
    <div className={cn('transition-opacity', isFetching && 'opacity-60')}>
      {/* Desktop: table */}
      <div className="bg-background hidden overflow-x-auto rounded-xl border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>Age / Gender</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead>Diagnosis</TableHead>
              {showDoctor && <TableHead>Doctor</TableHead>}
              <TableHead>Admitted</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.map((patient) => (
              <TableRow key={patient._id}>
                <TableCell>
                  <p className="font-medium">{patient.name}</p>
                  <p className="text-muted-foreground text-xs">{patient.phone}</p>
                </TableCell>
                <TableCell className="tabular-nums">
                  {ageFrom(patient.dateOfBirth)} · {capitalize(patient.gender)}
                </TableCell>
                <TableCell>
                  <ConditionBadge condition={patient.condition} />
                </TableCell>
                <TableCell className="text-muted-foreground max-w-48 truncate">
                  {patient.diagnosis ?? '—'}
                </TableCell>
                {showDoctor && (
                  <TableCell>
                    <Link href={`/doctors/${patient.doctor._id}`} className="hover:underline">
                      {patient.doctor.name}
                    </Link>
                    <p className="text-muted-foreground text-xs">{patient.doctor.specialization}</p>
                  </TableCell>
                )}
                <TableCell className="tabular-nums">{formatDate(patient.admittedAt)}</TableCell>
                <TableCell>
                  <RowActions patient={patient} onEdit={onEdit} onDelete={onDelete} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: cards (a 7-column table doesn't fit a phone) */}
      <ul className="grid gap-3 md:hidden">
        {patients.map((patient) => (
          <li key={patient._id} className="bg-background rounded-xl border p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{patient.name}</p>
                <p className="text-muted-foreground text-xs">
                  {ageFrom(patient.dateOfBirth)} · {capitalize(patient.gender)} · {patient.phone}
                </p>
              </div>
              <RowActions patient={patient} onEdit={onEdit} onDelete={onDelete} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <ConditionBadge condition={patient.condition} />
              {patient.diagnosis && (
                <span className="text-muted-foreground">{patient.diagnosis}</span>
              )}
            </div>
            <p className="text-muted-foreground mt-2 text-xs">
              Admitted {formatDate(patient.admittedAt)}
              {showDoctor && <> · {patient.doctor.name}</>}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
