import { auth } from '@proctorguard/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@proctorguard/ui';

const navItems = [
  { label: 'Exams', href: '/dashboard', icon: 'Calendar' },
  // Add more items as needed in future phases
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/auth/signin');

  return (
    <DashboardShell appName="Exam Coordinator" navItems={navItems}>
      {children}
    </DashboardShell>
  );
}
