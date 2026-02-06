import { auth } from '@proctorguard/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@proctorguard/ui';

const navItems = [
  { label: 'Overview', href: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Users', href: '/dashboard/users', icon: 'Users' },
  { label: 'Departments', href: '/dashboard/departments', icon: 'Building2' },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/auth/signin');

  return (
    <DashboardShell appName="Admin" navItems={navItems}>
      {children}
    </DashboardShell>
  );
}
