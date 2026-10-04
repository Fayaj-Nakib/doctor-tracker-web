'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api, type QueryParams } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { Overview, Single } from '@/lib/types';

/** The whole dashboard in one request: the API computes it in a single aggregation. */
export function useOverview(params: QueryParams) {
  return useQuery({
    queryKey: queryKeys.stats.overview(params),
    queryFn: () => api.get<Single<Overview>>('/stats/overview', params).then((res) => res.data),
    placeholderData: keepPreviousData, // switching range keeps the old charts until new data lands
  });
}
