'use server';

import { auth } from '@proctorguard/auth';
import { prisma } from '@proctorguard/database';
import { headers } from 'next/headers';

export async function getOrganizationForUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  const membership = await prisma.organizationMember.findFirst({
    where: { userId: session.user.id },
    include: { organization: true },
  });

  if (!membership) throw new Error('No organization found');
  return membership.organization;
}

export async function getDashboardStats(orgId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  const [userCount, departmentCount, roleCount] = await Promise.all([
    prisma.organizationMember.count({ where: { organizationId: orgId } }),
    prisma.department.count({ where: { organizationId: orgId } }),
    prisma.userRole.count({ where: { organizationId: orgId } }),
  ]);

  return { userCount, departmentCount, roleCount };
}

export async function getRecentActivity(orgId: string, limit: number = 10) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  const logs = await prisma.auditLog.findMany({
    where: {
      resource: { in: ['user', 'user_role', 'department', 'organization_member'] },
    },
    orderBy: { timestamp: 'desc' },
    take: limit,
    include: { user: { select: { name: true, email: true } } },
  });

  return logs;
}
