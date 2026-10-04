import { HeartPulse } from 'lucide-react';
import Link from 'next/link';

export function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2 px-3 font-semibold tracking-tight">
      <span className="bg-primary text-primary-foreground grid size-8 place-items-center rounded-lg">
        <HeartPulse className="size-4" aria-hidden />
      </span>
      Doctor Tracker
    </Link>
  );
}
