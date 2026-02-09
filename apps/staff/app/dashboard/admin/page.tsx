import { auth } from '@proctorguard/auth';
import { headers } from 'next/headers';
import { requirePermission, Permission } from '@proctorguard/permissions';
import { prisma } from '@proctorguard/database';

export default async function AdminDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  const userRole = await prisma.userRole.findFirst({
    where: { userId: session.user.id },
    select: { organizationId: true },
  });

  if (!userRole) throw new Error('No role found');

  await requirePermission(
    { userId: session.user.id, organizationId: userRole.organizationId },
    Permission.MANAGE_USERS
  );

  return (
    <div>
      <h1 className="text-3xl font-bold">Administration</h1>
      <p className="text-gray-600 mt-2">Manage users, departments, and organization settings</p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Users</h2>
          <p className="text-sm text-gray-600">User management features will be migrated here</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Departments</h2>
          <p className="text-sm text-gray-600">Department management features will be migrated here</p>
        </div>
      </div>
    </div>
  );
}
