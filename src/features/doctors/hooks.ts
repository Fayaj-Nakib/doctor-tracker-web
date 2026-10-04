'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type QueryParams } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { Doctor, Paginated, Single } from '@/lib/types';

export type DoctorInput = Pick<Doctor, 'name' | 'specialization' | 'hospital' | 'phone' | 'email'>;

export function useDoctors(params: QueryParams) {
  return useQuery({
    queryKey: queryKeys.doctors.list(params),
    queryFn: () => api.get<Paginated<Doctor>>('/doctors', params),
    // Keep showing the current page while the next one loads: no flash of empty table
    placeholderData: keepPreviousData,
  });
}

export function useDoctor(id: string) {
  return useQuery({
    queryKey: queryKeys.doctors.detail(id),
    queryFn: () => api.get<Single<Doctor>>(`/doctors/${id}`).then((res) => res.data),
  });
}

export function useCreateDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DoctorInput) =>
      api.post<Single<Doctor>>('/doctors', input).then((res) => res.data),
    onSuccess: () => {
      // Refresh everything that shows doctors: lists, dashboard totals, hospital dropdown
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.options });
    },
  });
}
