import { Brand } from '@/components/layout/brand';
import { MobileNav } from '@/components/layout/mobile-nav';
import { NavLinks } from '@/components/layout/nav-links';
import { UserMenu } from '@/components/layout/user-menu';

export default function DashboardLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="bg-muted/30 flex min-h-svh">
      {/* Desktop sidebar */}
      <aside className="bg-background sticky top-0 hidden h-svh w-64 shrink-0 flex-col gap-6 border-r p-4 md:flex">
        <div className="pt-2">
          <Brand />
        </div>
        <NavLinks />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-background/80 sticky top-0 z-20 flex h-14 items-center justify-between gap-2 border-b px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-2">
            <MobileNav />
            <span className="font-semibold md:hidden">Doctor Tracker</span>
          </div>
          <UserMenu />
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
