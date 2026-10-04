'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { Options, Single } from '@/lib/types';

/** Dropdown values from the API. Rarely change, so cached for the whole session. */
export function useOptions() {
  return useQuery({
    queryKey: queryKeys.options,
    queryFn: () => api.get<Single<Options>>('/meta/options').then((res) => res.data),
    staleTime: Infinity,
  });
}
