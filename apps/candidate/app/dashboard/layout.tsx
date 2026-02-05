import { auth } from '@proctorguard/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@proctorguard/ui';

const navItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'My Exams', href: '/dashboard/exams' },
  { label: 'Results', href: '/dashboard/results' },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/auth/signin');

  return (
    <DashboardShell appName="Candidate Portal" navItems={navItems}>
      {children}
    </DashboardShell>
  );
}
