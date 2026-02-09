'use server';

import { auth } from '@proctorguard/auth';
import { prisma } from '@proctorguard/database';
import { requirePermission, Permission } from '@proctorguard/permissions';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function getDepartments(orgId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  await requirePermission(
    { userId: session.user.id, organizationId: orgId },
    Permission.MANAGE_DEPARTMENTS
  );

  const departments = await prisma.department.findMany({
    where: { organizationId: orgId },
    orderBy: { name: 'asc' },
  });

  // Get member counts
  const memberCounts = await prisma.userRole.groupBy({
    by: ['departmentId'],
    where: { organizationId: orgId, departmentId: { not: null } },
    _count: { userId: true },
  });

  const countMap = memberCounts.reduce(
    (acc, item) => {
      if (item.departmentId) acc[item.departmentId] = item._count.userId;
      return acc;
    },
    {} as Record<string, number>
  );

  return departments.map((dept) => ({
    ...dept,
    memberCount: countMap[dept.id] || 0,
  }));
}

export async function createDepartment(orgId: string, name: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  await requirePermission(
    { userId: session.user.id, organizationId: orgId },
    Permission.MANAGE_DEPARTMENTS
  );

  if (!name.trim()) {
    throw new Error('Department name is required');
  }

  const department = await prisma.department.create({
    data: { name: name.trim(), organizationId: orgId },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'created',
      resource: 'department',
      resourceId: department.id,
      details: { name },
    },
  });

  revalidatePath('/dashboard/departments');
  return department;
}

export async function updateDepartment(orgId: string, deptId: string, name: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  await requirePermission(
    { userId: session.user.id, organizationId: orgId },
    Permission.MANAGE_DEPARTMENTS
  );

  if (!name.trim()) {
    throw new Error('Department name is required');
  }

  const department = await prisma.department.update({
    where: { id: deptId, organizationId: orgId },
    data: { name: name.trim() },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'updated',
      resource: 'department',
      resourceId: department.id,
      details: { name },
    },
  });

  revalidatePath('/dashboard/departments');
  return department;
}

export async function deleteDepartment(orgId: string, deptId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  await requirePermission(
    { userId: session.user.id, organizationId: orgId },
    Permission.MANAGE_DEPARTMENTS
  );

  // Check for members
  const memberCount = await prisma.userRole.count({
    where: { departmentId: deptId },
  });

  if (memberCount > 0) {
    throw new Error(`Cannot delete department with ${memberCount} assigned members`);
  }

  await prisma.department.delete({
    where: { id: deptId, organizationId: orgId },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'deleted',
      resource: 'department',
      resourceId: deptId,
    },
  });

  revalidatePath('/dashboard/departments');
  return { success: true };
}
