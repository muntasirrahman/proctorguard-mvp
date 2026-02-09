import { auth } from '@proctorguard/auth';
import { headers } from 'next/headers';
import { requirePermission, Permission } from '@proctorguard/permissions';
import { prisma } from '@proctorguard/database';
import { Card, CardContent, CardHeader, CardTitle } from '@proctorguard/ui';

export default async function FlaggedSessionsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  const userRole = await prisma.userRole.findFirst({
    where: { userId: session.user.id },
    select: { organizationId: true },
  });

  if (!userRole) throw new Error('No role found');

  await requirePermission(
    { userId: session.user.id, organizationId: userRole.organizationId },
    Permission.RESOLVE_FLAG
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Flagged Sessions</h1>
        <p className="text-muted-foreground">Review and resolve flagged exam sessions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Flagged Sessions Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Flag resolution features will be implemented in Phase 3 of the MVP.
          </p>
          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <p>Planned features:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>View all sessions with unresolved flags</li>
              <li>Review flag details and timestamps</li>
              <li>Watch video at flagged moments</li>
              <li>Clear flags (false positive)</li>
              <li>Confirm violations and escalate</li>
              <li>Add reviewer notes</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
