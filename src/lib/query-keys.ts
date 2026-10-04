import type { QueryParams } from './api';

/**
 * One place for every cache key. Keys are hierarchical, so invalidating
 * ['patients'] refreshes every patient list at once after an edit.
 */
export const queryKeys = {
  me: ['me'] as const,
  options: ['options'] as const,
  doctors: {
    all: ['doctors'] as const,
    list: (params: QueryParams) => ['doctors', 'list', params] as const,
    detail: (id: string) => ['doctors', 'detail', id] as const,
  },
  patients: {
    all: ['patients'] as const,
    list: (params: QueryParams) => ['patients', 'list', params] as const,
  },
  stats: {
    all: ['stats'] as const,
    overview: (params: QueryParams) => ['stats', 'overview', params] as const,
  },
};
