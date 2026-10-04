'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { format, parseISO } from 'date-fns';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { FormField } from '@/components/shared/form-field';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { capitalize } from '@/lib/format';
import { applyServerErrors, errorProps } from '@/lib/forms';
import type { Condition, Gender, Patient } from '@/lib/types';
import { useCreatePatient, useUpdatePatient, type PatientInput } from './hooks';

const CONDITIONS = [
  'stable',
  'recovering',
  'critical',
  'discharged',
] as const satisfies readonly Condition[];
const GENDERS = ['male', 'female', 'other'] as const satisfies readonly Gender[];

const today = () => format(new Date(), 'yyyy-MM-dd');
const notInFuture = (value: string) => value <= today(); // yyyy-mm-dd strings compare correctly

const patientFormSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  dateOfBirth: z
    .string()
    .min(1, 'Date of birth is required')
    .refine(notInFuture, 'Date of birth cannot be in the future'),
  gender: z.enum(GENDERS, { error: 'Choose a gender' }),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9][0-9\s-]{6,18}$/, 'Enter a valid phone number'),
  condition: z.enum(CONDITIONS, { error: 'Choose a condition' }),
  diagnosis: z.string().trim().max(200),
  admittedAt: z
    .string()
    .min(1, 'Admission date is required')
    .refine(notInFuture, 'Admission date cannot be in the future'),
});

type PatientFormValues = z.infer<typeof patientFormSchema>;

const toDateInput = (iso: string) => format(parseISO(iso), 'yyyy-MM-dd');

const valuesFrom = (patient?: Patient): PatientFormValues =>
  patient
    ? {
        name: patient.name,
        dateOfBirth: toDateInput(patient.dateOfBirth),
        gender: patient.gender,
        phone: patient.phone,
        condition: patient.condition,
        diagnosis: patient.diagnosis ?? '',
        admittedAt: toDateInput(patient.admittedAt),
      }
    : {
        name: '',
        dateOfBirth: '',
        gender: 'female',
        phone: '',
        condition: 'stable',
        diagnosis: '',
        admittedAt: today(),
      };

type PatientFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
} & ({ mode: 'create'; doctorId: string; doctorName: string } | { mode: 'edit'; patient: Patient });

/**
 * One form for create and edit. For edit, render it with key={patient._id}
 * so the form starts from that patient's values.
 */
export function PatientFormDialog(props: PatientFormDialogProps) {
  const { open, onOpenChange } = props;
  const isEdit = props.mode === 'edit';
  const patient = isEdit ? props.patient : undefined;

  const createPatient = useCreatePatient(isEdit ? '' : props.doctorId);
  const updatePatient = useUpdatePatient(patient?._id ?? '');
  const mutation = isEdit ? updatePatient : createPatient;

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: valuesFrom(patient),
  });

  const close = (next: boolean) => {
    if (!next) reset(valuesFrom(patient));
    onOpenChange(next);
  };

  const onSubmit = handleSubmit((values) => {
    const input: PatientInput = { ...values, diagnosis: values.diagnosis || undefined };
    mutation.mutate(input, {
      onSuccess: (saved) => {
        toast.success(isEdit ? `${saved.name} updated` : `${saved.name} added`);
        onOpenChange(false);
        if (!isEdit) reset(valuesFrom());
      },
      onError: (error) => {
        if (!applyServerErrors(error, setError)) toast.error(error.message);
      },
    });
  });

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit patient' : 'Add patient'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? `Under ${props.patient.doctor.name}`
              : `This patient will be assigned to ${props.doctorName}.`}
          </DialogDescription>
        </DialogHeader>

        <form id="patient-form" onSubmit={onSubmit} className="grid gap-4" noValidate>
          <FormField id="patient-name" label="Full name" error={errors.name?.message}>
            <Input {...register('name')} {...errorProps('patient-name', errors.name?.message)} />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="patient-dob" label="Date of birth" error={errors.dateOfBirth?.message}>
              <Input
                type="date"
                max={today()}
                {...register('dateOfBirth')}
                {...errorProps('patient-dob', errors.dateOfBirth?.message)}
              />
            </FormField>
            <FormField id="patient-gender" label="Gender" error={errors.gender?.message}>
              <Controller
                control={control}
                name="gender"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      className="w-full"
                      {...errorProps('patient-gender', errors.gender?.message)}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDERS.map((g) => (
                        <SelectItem key={g} value={g}>
                          {capitalize(g)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="patient-phone" label="Phone" error={errors.phone?.message}>
              <Input
                type="tel"
                placeholder="+8801…"
                {...register('phone')}
                {...errorProps('patient-phone', errors.phone?.message)}
              />
            </FormField>
            <FormField id="patient-condition" label="Condition" error={errors.condition?.message}>
              <Controller
                control={control}
                name="condition"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      className="w-full"
                      {...errorProps('patient-condition', errors.condition?.message)}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONDITIONS.map((c) => (
                        <SelectItem key={c} value={c}>
                          {capitalize(c)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="patient-diagnosis"
              label="Diagnosis (optional)"
              error={errors.diagnosis?.message}
            >
              <Input
                {...register('diagnosis')}
                {...errorProps('patient-diagnosis', errors.diagnosis?.message)}
              />
            </FormField>
            <FormField id="patient-admitted" label="Admitted on" error={errors.admittedAt?.message}>
              <Input
                type="date"
                max={today()}
                {...register('admittedAt')}
                {...errorProps('patient-admitted', errors.admittedAt?.message)}
              />
            </FormField>
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="patient-form"
            disabled={mutation.isPending || (isEdit && !isDirty)}
          >
            {mutation.isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Add patient'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
