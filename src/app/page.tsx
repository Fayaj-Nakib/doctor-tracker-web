'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

type Me = { id: string; name: string; email: string; role: string };

export default function HomePage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    fetch('/api/v1/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => setMe(body?.data ?? null));
  }, []);

  async function logout() {
    await fetch('/api/v1/auth/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-md space-y-4 p-8">
      <h1 className="text-2xl font-semibold">Signed in</h1>
      <pre className="bg-muted rounded p-4 text-sm">
        {me ? JSON.stringify(me, null, 2) : 'Loading…'}
      </pre>
      <Button variant="outline" onClick={logout}>
        Log out
      </Button>
    </main>
  );
}