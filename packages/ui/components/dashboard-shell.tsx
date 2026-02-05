'use client';

import { UserMenu } from './user-menu';

interface NavItem {
  label: string;
  href: string;
  icon?: string;
}

interface DashboardShellProps {
  appName: string;
  navItems: NavItem[];
  children: React.ReactNode;
}

export function DashboardShell({ appName, navItems, children }: DashboardShellProps) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col border-r bg-card">
        <div className="flex h-14 items-center border-b px-4">
          <span className="font-semibold text-lg">ProctorGuard</span>
        </div>
        <div className="px-3 py-2">
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {appName}
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="flex items-center rounded-md px-2 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex h-14 items-center justify-between border-b bg-card px-4 md:px-6">
          <div className="md:hidden font-semibold">ProctorGuard</div>
          <div className="hidden md:block" />
          <UserMenu />
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
