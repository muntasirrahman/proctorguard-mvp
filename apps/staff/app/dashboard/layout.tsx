import { auth } from '@proctorguard/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/auth/signin');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation will be added in next task */}
      <div className="p-8">
        {children}
      </div>
    </div>
  );
}
