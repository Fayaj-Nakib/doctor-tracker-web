'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type QueryParams } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { Condition, Gender, Paginated, Patient, Single } from '@/lib/types';

export type PatientInput = {
  name: string;
  dateOfBirth: string;
  gender: Gender;
  phone: string;
  condition: Condition;
  diagnosis?: string;
  admittedAt: string;
};

/** All patients, or one doctor's patients when doctorId is given (nested REST route). */
export function usePatients(params: QueryParams & { doctorId?: string }) {
  const { doctorId, ...query } = params;
  return useQuery({
    queryKey: queryKeys.patients.list(params),
    queryFn: () =>
      api.get<Paginated<Patient>>(doctorId ? `/doctors/${doctorId}/patients` : '/patients', query),
    placeholderData: keepPreviousData,
  });
}

/** After any patient change, counts change everywhere: lists, doctor pages, dashboard. */
function useInvalidatePatientData() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
  };
}

export function useCreatePatient(doctorId: string) {
  const invalidate = useInvalidatePatientData();
  return useMutation({
    mutationFn: (input: PatientInput) =>
      api.post<Single<Patient>>(`/doctors/${doctorId}/patients`, input).then((res) => res.data),
    onSuccess: invalidate,
  });
}

export function useUpdatePatient(id: string) {
  const invalidate = useInvalidatePatientData();
  return useMutation({
    mutationFn: (input: Partial<PatientInput>) =>
      api.patch<Single<Patient>>(`/patients/${id}`, input).then((res) => res.data),
    onSuccess: invalidate,
  });
}

export function useDeletePatient() {
  const invalidate = useInvalidatePatientData();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/patients/${id}`),
    onSuccess: invalidate,
  });
}
