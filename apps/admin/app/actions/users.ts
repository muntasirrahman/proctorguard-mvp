'use server';

import { auth } from '@proctorguard/auth';
import { prisma, Role } from '@proctorguard/database';
import { requirePermission, Permission } from '@proctorguard/permissions';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function getUsers(orgId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  await requirePermission(
    { userId: session.user.id, organizationId: orgId },
    Permission.MANAGE_USERS
  );

  const members = await prisma.organizationMember.findMany({
    where: { organizationId: orgId },
    include: {
      user: {
        select: { id: true, name: true, email: true, createdAt: true },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });

  // Get roles for each user
  const userIds = members.map((m) => m.user.id);
  const roles = await prisma.userRole.findMany({
    where: { userId: { in: userIds }, organizationId: orgId },
  });

  const rolesByUser = roles.reduce(
    (acc, role) => {
      if (!acc[role.userId]) acc[role.userId] = [];
      acc[role.userId].push(role.role);
      return acc;
    },
    {} as Record<string, Role[]>
  );

  return members.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    email: m.user.email,
    joinedAt: m.joinedAt,
    roles: rolesByUser[m.user.id] || [],
  }));
}

export async function inviteUser(
  orgId: string,
  email: string,
  name: string | null,
  roles: Role[]
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  await requirePermission(
    { userId: session.user.id, organizationId: orgId },
    Permission.MANAGE_USERS
  );
  await requirePermission(
    { userId: session.user.id, organizationId: orgId },
    Permission.MANAGE_ROLES
  );

  if (roles.length === 0) {
    throw new Error('At least one role is required');
  }

  // Create or find user
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: { email, name },
    });
  }

  // Check if already a member
  const existingMember = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId: orgId } },
  });

  if (existingMember) {
    throw new Error('User is already a member of this organization');
  }

  // Add as member and assign roles
  await prisma.$transaction([
    prisma.organizationMember.create({
      data: { userId: user.id, organizationId: orgId },
    }),
    ...roles.map((role) =>
      prisma.userRole.create({
        data: { userId: user.id, organizationId: orgId, role, assignedBy: session.user.id },
      })
    ),
    prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'invited',
        resource: 'user',
        resourceId: user.id,
        details: { email, roles },
      },
    }),
  ]);

  revalidatePath('/dashboard/users');
  return { success: true };
}

export async function updateUserRoles(orgId: string, userId: string, roles: Role[]) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  await requirePermission(
    { userId: session.user.id, organizationId: orgId },
    Permission.MANAGE_ROLES
  );

  if (roles.length === 0) {
    throw new Error('At least one role is required');
  }

  // Delete existing roles and create new ones
  await prisma.$transaction([
    prisma.userRole.deleteMany({ where: { userId, organizationId: orgId } }),
    ...roles.map((role) =>
      prisma.userRole.create({
        data: { userId, organizationId: orgId, role, assignedBy: session.user.id },
      })
    ),
    prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'updated_roles',
        resource: 'user_role',
        resourceId: userId,
        details: { roles },
      },
    }),
  ]);

  revalidatePath('/dashboard/users');
  revalidatePath(`/dashboard/users/${userId}`);
  return { success: true };
}

export async function removeUser(orgId: string, userId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  await requirePermission(
    { userId: session.user.id, organizationId: orgId },
    Permission.MANAGE_USERS
  );

  // Prevent removing yourself
  if (userId === session.user.id) {
    throw new Error('You cannot remove yourself from the organization');
  }

  await prisma.$transaction([
    prisma.userRole.deleteMany({ where: { userId, organizationId: orgId } }),
    prisma.organizationMember.delete({
      where: { userId_organizationId: { userId, organizationId: orgId } },
    }),
    prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'removed',
        resource: 'organization_member',
        resourceId: userId,
      },
    }),
  ]);

  revalidatePath('/dashboard/users');
  return { success: true };
}

export async function getUser(orgId: string, userId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  await requirePermission(
    { userId: session.user.id, organizationId: orgId },
    Permission.MANAGE_USERS
  );

  const member = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId: orgId } },
    include: { user: { select: { id: true, name: true, email: true, createdAt: true } } },
  });

  if (!member) throw new Error('User not found');

  const roles = await prisma.userRole.findMany({
    where: { userId, organizationId: orgId },
  });

  return {
    id: member.user.id,
    name: member.user.name,
    email: member.user.email,
    createdAt: member.user.createdAt,
    joinedAt: member.joinedAt,
    roles: roles.map((r) => r.role),
  };
}
