import { auth } from '@proctorguard/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getUserPermissions } from '@proctorguard/permissions';
import { StaffNavigation } from '@proctorguard/ui';
import { prisma } from '@proctorguard/database';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/auth/signin');

  // Get user's organization (assuming first role for now)
  const userRole = await prisma.userRole.findFirst({
    where: { userId: session.user.id },
    select: { organizationId: true },
  });

  if (!userRole) {
    throw new Error('User has no roles assigned');
  }

  // Get aggregated permissions
  const permissions = await getUserPermissions(session.user.id, userRole.organizationId);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <StaffNavigation
        userPermissions={permissions}
        user={{
          name: session.user.name,
          email: session.user.email,
        }}
      />
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
