'use client';

import { zodResolver } from '@hookform/resolvers/zod';
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
import { useOptions } from '@/features/meta/use-options';
import { ApiError } from '@/lib/api';
import { applyServerErrors, errorProps } from '@/lib/forms';
import { useCreateDoctor } from './hooks';

// Mirrors the API's rules for instant feedback; the API still validates (never trust the client)
const doctorFormSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  specialization: z.string().min(1, 'Choose a specialization'),
  hospital: z.string().trim().min(2, 'Hospital is required').max(120),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9][0-9\s-]{6,18}$/, 'Enter a valid phone number'),
  email: z.string().trim().pipe(z.email('Enter a valid email address')),
});

type DoctorFormValues = z.infer<typeof doctorFormSchema>;

const EMPTY: DoctorFormValues = {
  name: '',
  specialization: '',
  hospital: '',
  phone: '',
  email: '',
};

export function DoctorFormDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: options } = useOptions();
  const createDoctor = useCreateDoctor();
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<DoctorFormValues>({ resolver: zodResolver(doctorFormSchema), defaultValues: EMPTY });

  const close = (next: boolean) => {
    if (!next) reset(EMPTY);
    onOpenChange(next);
  };

  const onSubmit = handleSubmit((values) => {
    createDoctor.mutate(values, {
      onSuccess: (doctor) => {
        toast.success(`${doctor.name} added`);
        close(false);
      },
      onError: (error) => {
        if (error instanceof ApiError && error.status === 409) {
          setError('email', { message: 'A doctor with this email already exists' });
        } else if (!applyServerErrors(error, setError)) {
          toast.error(error.message);
        }
      },
    });
  });

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add doctor</DialogTitle>
          <DialogDescription>New doctors appear in the list immediately.</DialogDescription>
        </DialogHeader>

        <form id="doctor-form" onSubmit={onSubmit} className="grid gap-4" noValidate>
          <FormField id="doctor-name" label="Full name" error={errors.name?.message}>
            <Input {...register('name')} {...errorProps('doctor-name', errors.name?.message)} />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="doctor-specialization"
              label="Specialization"
              error={errors.specialization?.message}
            >
              <Controller
                control={control}
                name="specialization"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      className="w-full"
                      {...errorProps('doctor-specialization', errors.specialization?.message)}
                    >
                      <SelectValue placeholder="Select…" />
                    </SelectTrigger>
                    <SelectContent>
                      {options?.specializations.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField id="doctor-hospital" label="Hospital" error={errors.hospital?.message}>
              {/* Free text with suggestions from existing hospitals */}
              <Input
                list="hospital-suggestions"
                {...register('hospital')}
                {...errorProps('doctor-hospital', errors.hospital?.message)}
              />
              <datalist id="hospital-suggestions">
                {options?.hospitals.map((h) => (
                  <option key={h} value={h} />
                ))}
              </datalist>
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="doctor-phone" label="Phone" error={errors.phone?.message}>
              <Input
                type="tel"
                placeholder="+8801…"
                {...register('phone')}
                {...errorProps('doctor-phone', errors.phone?.message)}
              />
            </FormField>
            <FormField id="doctor-email" label="Email" error={errors.email?.message}>
              <Input
                type="email"
                {...register('email')}
                {...errorProps('doctor-email', errors.email?.message)}
              />
            </FormField>
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)} disabled={createDoctor.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="doctor-form" disabled={createDoctor.isPending}>
            {createDoctor.isPending ? 'Saving…' : 'Add doctor'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
