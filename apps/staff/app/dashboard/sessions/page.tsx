import { auth } from '@proctorguard/auth';
import { headers } from 'next/headers';
import { requirePermission, Permission } from '@proctorguard/permissions';
import { prisma } from '@proctorguard/database';
import { Card, CardContent, CardHeader, CardTitle } from '@proctorguard/ui';

export default async function SessionsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  const userRole = await prisma.userRole.findFirst({
    where: { userId: session.user.id },
    select: { organizationId: true },
  });

  if (!userRole) throw new Error('No role found');

  await requirePermission(
    { userId: session.user.id, organizationId: userRole.organizationId },
    Permission.REVIEW_SESSION
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Review Sessions</h1>
        <p className="text-muted-foreground">Review exam sessions and proctoring recordings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Session Review</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Session review features will be implemented in Phase 3 of the MVP.
          </p>
          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <p>Planned features:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>View all exam sessions for review</li>
              <li>Watch proctoring recordings</li>
              <li>Review automatically flagged incidents</li>
              <li>Create manual flags for suspicious behavior</li>
              <li>Approve or reject sessions</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
