'use server';

import { auth } from '@proctorguard/auth';
import { prisma, EnrollmentStatus } from '@proctorguard/database';
import { requirePermission, Permission } from '@proctorguard/permissions';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

/**
 * Helper to get session and validate candidate role
 */
async function getSessionAndOrg() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    throw new Error('Unauthorized');
  }

  const userRole = await prisma.userRole.findFirst({
    where: {
      userId: session.user.id,
      role: 'CANDIDATE',
    },
  });

  if (!userRole) {
    throw new Error('No candidate role found');
  }

  return { session, orgId: userRole.organizationId };
}

/**
 * Get all pending enrollment invitations for the current candidate
 */
export async function getPendingInvitations() {
  const { session, orgId } = await getSessionAndOrg();

  await requirePermission(
    { userId: session.user.id, organizationId: orgId },
    Permission.VIEW_PENDING_INVITATIONS
  );

  const enrollments = await prisma.enrollment.findMany({
    where: {
      candidateId: session.user.id,
      organizationId: orgId,
      status: EnrollmentStatus.PENDING,
    },
    include: {
      exam: {
        select: {
          id: true,
          title: true,
          description: true,
          duration: true,
          scheduledStart: true,
          scheduledEnd: true,
          requireIdentityVerification: true,
          requireLockdownBrowser: true,
          enableRecording: true,
          enableAIMonitoring: true,
          organization: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      invitedAt: 'desc',
    },
  });

  // Filter out expired invitations (but still return them for display)
  return enrollments.map((enrollment) => ({
    ...enrollment,
    isExpired:
      enrollment.expiresAt ? new Date(enrollment.expiresAt) < new Date() : false,
  }));
}

/**
 * Get all enrolled exams for the current candidate
 */
export async function getEnrolledExams() {
  const { session, orgId } = await getSessionAndOrg();

  await requirePermission(
    { userId: session.user.id, organizationId: orgId },
    Permission.VIEW_PENDING_INVITATIONS
  );

  const enrollments = await prisma.enrollment.findMany({
    where: {
      candidateId: session.user.id,
      organizationId: orgId,
      status: EnrollmentStatus.ENROLLED,
    },
    include: {
      exam: {
        select: {
          id: true,
          title: true,
          description: true,
          duration: true,
          scheduledStart: true,
          scheduledEnd: true,
          status: true,
          allowedAttempts: true,
          organization: {
            select: {
              name: true,
            },
          },
        },
      },
      _count: {
        select: {
          sessions: true,
        },
      },
    },
    orderBy: {
      exam: {
        scheduledStart: 'asc',
      },
    },
  });

  // Map to include attemptsUsed from session count
  return enrollments.map((enrollment) => ({
    ...enrollment,
    attemptsUsed: enrollment._count.sessions,
  }));
}

/**
 * Accept a pending enrollment invitation
 */
export async function acceptEnrollment(enrollmentId: string) {
  const { session, orgId } = await getSessionAndOrg();

  await requirePermission(
    { userId: session.user.id, organizationId: orgId },
    Permission.ACCEPT_ENROLLMENT
  );

  // Fetch enrollment with validation
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    select: {
      id: true,
      status: true,
      candidateId: true,
      organizationId: true,
      expiresAt: true,
    },
  });

  if (!enrollment) {
    throw new Error('Enrollment not found');
  }

  if (enrollment.candidateId !== session.user.id) {
    throw new Error('Unauthorized: You are not the candidate for this enrollment');
  }

  if (enrollment.organizationId !== orgId) {
    throw new Error('Enrollment does not belong to your organization');
  }

  if (enrollment.status !== EnrollmentStatus.PENDING) {
    throw new Error('Enrollment is not in pending status');
  }

  // Check if expired
  if (enrollment.expiresAt && new Date(enrollment.expiresAt) < new Date()) {
    throw new Error('This invitation has expired');
  }

  // Update enrollment to ENROLLED
  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: {
      status: EnrollmentStatus.ENROLLED,
      approvedBy: session.user.id, // Candidate approves their own enrollment
      approvedAt: new Date(),
    },
  });

  revalidatePath('/dashboard/exams');
}

/**
 * Decline a pending enrollment invitation
 */
export async function declineEnrollment(enrollmentId: string) {
  const { session, orgId } = await getSessionAndOrg();

  await requirePermission(
    { userId: session.user.id, organizationId: orgId },
    Permission.DECLINE_ENROLLMENT
  );

  // Fetch enrollment with validation
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    select: {
      id: true,
      status: true,
      candidateId: true,
      organizationId: true,
    },
  });

  if (!enrollment) {
    throw new Error('Enrollment not found');
  }

  if (enrollment.candidateId !== session.user.id) {
    throw new Error('Unauthorized: You are not the candidate for this enrollment');
  }

  if (enrollment.organizationId !== orgId) {
    throw new Error('Enrollment does not belong to your organization');
  }

  if (enrollment.status !== EnrollmentStatus.PENDING) {
    throw new Error('Enrollment is not in pending status');
  }

  // Update enrollment to REJECTED
  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: {
      status: EnrollmentStatus.REJECTED,
    },
  });

  revalidatePath('/dashboard/exams');
}
