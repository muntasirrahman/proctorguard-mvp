'use server';

import { auth } from '@proctorguard/auth';
import { prisma, EnrollmentStatus } from '@proctorguard/database';
import { requirePermission, Permission } from '@proctorguard/permissions';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

async function getSessionAndOrg() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    throw new Error('Unauthorized');
  }

  const userRole = await prisma.userRole.findFirst({
    where: {
      userId: session.user.id,
      role: 'EXAM_COORDINATOR',
    },
  });

  if (!userRole) {
    throw new Error('No coordinator role found');
  }

  return { session, orgId: userRole.organizationId };
}

export async function getEnrollments(examId: string) {
  const { session, orgId } = await getSessionAndOrg();

  await requirePermission(
    { userId: session.user.id, organizationId: orgId },
    Permission.VIEW_ENROLLMENTS
  );

  const enrollments = await prisma.enrollment.findMany({
    where: {
      examId,
      organizationId: orgId,
    },
    include: {
      candidate: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      invitedAt: 'desc',
    },
  });

  return enrollments;
}

export async function inviteCandidate(examId: string, candidateEmail: string) {
  const { session, orgId } = await getSessionAndOrg();

  await requirePermission(
    { userId: session.user.id, organizationId: orgId },
    Permission.INVITE_CANDIDATE
  );

  // Verify exam exists and belongs to org
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    select: { organizationId: true },
  });

  if (!exam || exam.organizationId !== orgId) {
    throw new Error('Exam not found');
  }

  // Find candidate by email
  const candidate = await prisma.user.findUnique({
    where: { email: candidateEmail },
  });

  if (!candidate) {
    throw new Error('Candidate not found');
  }

  // Check if already enrolled
  const existing = await prisma.enrollment.findUnique({
    where: {
      examId_candidateId: {
        examId,
        candidateId: candidate.id,
      },
    },
  });

  if (existing) {
    throw new Error('Candidate already enrolled');
  }

  const enrollment = await prisma.enrollment.create({
    data: {
      examId,
      candidateId: candidate.id,
      organizationId: orgId,
      status: EnrollmentStatus.PENDING,
      invitedBy: session.user.id,
    },
  });

  revalidatePath(`/dashboard/exams/${examId}`);
  return enrollment;
}

export async function bulkInviteCandidates(examId: string, emails: string[]) {
  const { session, orgId } = await getSessionAndOrg();

  await requirePermission(
    { userId: session.user.id, organizationId: orgId },
    Permission.INVITE_CANDIDATE
  );

  // Verify exam
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    select: { organizationId: true },
  });

  if (!exam || exam.organizationId !== orgId) {
    throw new Error('Exam not found');
  }

  const results = {
    success: [] as string[],
    errors: [] as { email: string; error: string }[],
  };

  for (const email of emails) {
    try {
      const candidate = await prisma.user.findUnique({
        where: { email: email.trim() },
      });

      if (!candidate) {
        results.errors.push({ email, error: 'User not found' });
        continue;
      }

      // Check if already enrolled
      const existing = await prisma.enrollment.findUnique({
        where: {
          examId_candidateId: {
            examId,
            candidateId: candidate.id,
          },
        },
      });

      if (existing) {
        results.errors.push({ email, error: 'Already enrolled' });
        continue;
      }

      await prisma.enrollment.create({
        data: {
          examId,
          candidateId: candidate.id,
          organizationId: orgId,
          status: EnrollmentStatus.PENDING,
          invitedBy: session.user.id,
        },
      });

      results.success.push(email);
    } catch (error) {
      results.errors.push({ email, error: 'Failed to invite' });
    }
  }

  revalidatePath(`/dashboard/exams/${examId}`);
  return results;
}

export async function approveEnrollment(enrollmentId: string) {
  const { session, orgId } = await getSessionAndOrg();

  await requirePermission(
    { userId: session.user.id, organizationId: orgId },
    Permission.APPROVE_ENROLLMENT
  );

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    select: { organizationId: true, examId: true },
  });

  if (!enrollment || enrollment.organizationId !== orgId) {
    throw new Error('Enrollment not found');
  }

  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: {
      status: EnrollmentStatus.APPROVED,
      approvedBy: session.user.id,
      approvedAt: new Date(),
    },
  });

  revalidatePath(`/dashboard/exams/${enrollment.examId}`);
}

export async function rejectEnrollment(enrollmentId: string) {
  const { session, orgId } = await getSessionAndOrg();

  await requirePermission(
    { userId: session.user.id, organizationId: orgId },
    Permission.REJECT_ENROLLMENT
  );

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    select: { organizationId: true, examId: true },
  });

  if (!enrollment || enrollment.organizationId !== orgId) {
    throw new Error('Enrollment not found');
  }

  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: {
      status: EnrollmentStatus.REJECTED,
    },
  });

  revalidatePath(`/dashboard/exams/${enrollment.examId}`);
}

export async function removeEnrollment(enrollmentId: string) {
  const { session, orgId } = await getSessionAndOrg();

  await requirePermission(
    { userId: session.user.id, organizationId: orgId },
    Permission.REJECT_ENROLLMENT
  );

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    select: { organizationId: true, examId: true },
  });

  if (!enrollment || enrollment.organizationId !== orgId) {
    throw new Error('Enrollment not found');
  }

  await prisma.enrollment.delete({
    where: { id: enrollmentId },
  });

  revalidatePath(`/dashboard/exams/${enrollment.examId}`);
}
