'use client';

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { ApiError } from '@/lib/api';

export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter();

  // useState, not a module-level constant: one client per browser session,
  // never shared between users during server rendering
  const [queryClient] = useState(() => {
    // Session expired mid-use (any query or mutation gets 401): back to login, then return here
    const onError = (error: unknown) => {
      if (error instanceof ApiError && error.status === 401) {
        router.replace(`/login?from=${encodeURIComponent(window.location.pathname)}`);
      }
    };

    return new QueryClient({
      queryCache: new QueryCache({ onError }),
      mutationCache: new MutationCache({ onError }),
      defaultOptions: {
        queries: {
          staleTime: 30_000, // data stays "fresh" for 30s: no refetch when revisiting a page
          refetchOnWindowFocus: false,
          // Don't retry client errors (400/401/404): they won't fix themselves
          retry: (failureCount, error) =>
            error instanceof ApiError && error.status < 500 ? false : failureCount < 2,
        },
      },
    });
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster richColors position="top-right" />
      <ReactQueryDevtools buttonPosition="bottom-left" />
    </QueryClientProvider>
  );
}
