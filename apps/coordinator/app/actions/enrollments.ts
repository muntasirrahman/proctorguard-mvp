'use server';

import { auth } from '@proctorguard/auth';
import { prisma, EnrollmentStatus, Role } from '@proctorguard/database';
import { requirePermission, Permission } from '@proctorguard/permissions';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

// Email validation helper
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Helper function to get session and org
async function getSessionAndOrg() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  // Get user's organization (coordinators have exactly one)
  const userRole = await prisma.userRole.findFirst({
    where: {
      userId: session.user.id,
      role: Role.EXAM_COORDINATOR,
    },
  });

  if (!userRole) {
    throw new Error('No coordinator role found');
  }

  return { session, orgId: userRole.organizationId };
}

// Get enrollments for an exam
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

// Invite a single candidate
export async function inviteCandidate(examId: string, candidateEmail: string) {
  const { session, orgId } = await getSessionAndOrg();

  await requirePermission(
    { userId: session.user.id, organizationId: orgId },
    Permission.INVITE_CANDIDATE
  );

  // Validate email format
  if (!isValidEmail(candidateEmail)) {
    throw new Error('Invalid email format');
  }

  // Verify exam exists and belongs to org
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    select: { organizationId: true, title: true },
  });

  if (!exam || exam.organizationId !== orgId) {
    throw new Error('Exam not found');
  }

  // Find candidate by email
  const candidate = await prisma.user.findUnique({
    where: { email: candidateEmail },
    select: { id: true },
  });

  if (!candidate) {
    throw new Error(`Candidate with email ${candidateEmail} not found`);
  }

  // Check if already enrolled (unique constraint: examId_candidateId)
  const existingEnrollment = await prisma.enrollment.findUnique({
    where: {
      examId_candidateId: {
        examId,
        candidateId: candidate.id,
      },
    },
  });

  if (existingEnrollment) {
    throw new Error('Candidate is already enrolled in this exam');
  }

  // Create enrollment
  const enrollment = await prisma.enrollment.create({
    data: {
      examId,
      candidateId: candidate.id,
      organizationId: orgId,
      status: EnrollmentStatus.PENDING,
      invitedBy: session.user.id,
    },
  });

  // Log to audit trail
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'ENROLLMENT_INVITED',
      resource: 'ENROLLMENT',
      resourceId: enrollment.id,
      details: {
        examId,
        examTitle: exam.title,
        candidateEmail,
        candidateId: candidate.id,
      },
      timestamp: new Date(),
    },
  });

  revalidatePath(`/dashboard/exams/${examId}`);
  return enrollment;
}

// Bulk invite candidates
export async function bulkInviteCandidates(examId: string, emails: string[]) {
  const { session, orgId } = await getSessionAndOrg();

  await requirePermission(
    { userId: session.user.id, organizationId: orgId },
    Permission.INVITE_CANDIDATE
  );

  // Validate email list
  if (!emails || emails.length === 0) {
    throw new Error('Email list cannot be empty');
  }

  // Verify exam exists and belongs to org
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    select: { organizationId: true, title: true },
  });

  if (!exam || exam.organizationId !== orgId) {
    throw new Error('Exam not found');
  }

  const results: {
    success: string[];
    errors: { email: string; error: string }[];
  } = {
    success: [],
    errors: [],
  };

  // Process each email
  for (const email of emails) {
    try {
      // Validate email format
      if (!isValidEmail(email)) {
        results.errors.push({ email, error: 'Invalid email format' });
        continue;
      }

      // Find candidate by email
      const candidate = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (!candidate) {
        results.errors.push({ email, error: 'Candidate not found' });
        continue;
      }

      // Check if already enrolled
      const existingEnrollment = await prisma.enrollment.findUnique({
        where: {
          examId_candidateId: {
            examId,
            candidateId: candidate.id,
          },
        },
      });

      if (existingEnrollment) {
        results.errors.push({ email, error: 'Already enrolled' });
        continue;
      }

      // Create enrollment
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
      results.errors.push({
        email,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Log to audit trail
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'ENROLLMENT_BULK_INVITED',
      resource: 'ENROLLMENT',
      resourceId: examId,
      details: {
        examId,
        examTitle: exam.title,
        totalAttempted: emails.length,
        successCount: results.success.length,
        errorCount: results.errors.length,
      },
      timestamp: new Date(),
    },
  });

  revalidatePath(`/dashboard/exams/${examId}`);
  return results;
}

// Approve enrollment
export async function approveEnrollment(enrollmentId: string) {
  const { session, orgId } = await getSessionAndOrg();

  await requirePermission(
    { userId: session.user.id, organizationId: orgId },
    Permission.APPROVE_ENROLLMENT
  );

  // Verify enrollment belongs to org
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    select: {
      organizationId: true,
      examId: true,
      candidate: {
        select: {
          email: true,
        },
      },
      exam: {
        select: {
          title: true,
        },
      },
    },
  });

  if (!enrollment || enrollment.organizationId !== orgId) {
    throw new Error('Enrollment not found');
  }

  // Update status to APPROVED
  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: {
      status: EnrollmentStatus.APPROVED,
      approvedBy: session.user.id,
      approvedAt: new Date(),
    },
  });

  // Log to audit trail
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'ENROLLMENT_APPROVED',
      resource: 'ENROLLMENT',
      resourceId: enrollmentId,
      details: {
        examId: enrollment.examId,
        examTitle: enrollment.exam.title,
        candidateEmail: enrollment.candidate.email,
      },
      timestamp: new Date(),
    },
  });

  revalidatePath(`/dashboard/exams/${enrollment.examId}`);
}

// Reject enrollment
export async function rejectEnrollment(enrollmentId: string) {
  const { session, orgId } = await getSessionAndOrg();

  await requirePermission(
    { userId: session.user.id, organizationId: orgId },
    Permission.REJECT_ENROLLMENT
  );

  // Verify enrollment belongs to org
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    select: {
      organizationId: true,
      examId: true,
      candidate: {
        select: {
          email: true,
        },
      },
      exam: {
        select: {
          title: true,
        },
      },
    },
  });

  if (!enrollment || enrollment.organizationId !== orgId) {
    throw new Error('Enrollment not found');
  }

  // Update status to REJECTED
  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: {
      status: EnrollmentStatus.REJECTED,
    },
  });

  // Log to audit trail
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'ENROLLMENT_REJECTED',
      resource: 'ENROLLMENT',
      resourceId: enrollmentId,
      details: {
        examId: enrollment.examId,
        examTitle: enrollment.exam.title,
        candidateEmail: enrollment.candidate.email,
      },
      timestamp: new Date(),
    },
  });

  revalidatePath(`/dashboard/exams/${enrollment.examId}`);
}

// Remove enrollment
export async function removeEnrollment(enrollmentId: string) {
  const { session, orgId } = await getSessionAndOrg();

  await requirePermission(
    { userId: session.user.id, organizationId: orgId },
    Permission.REJECT_ENROLLMENT
  );

  // Verify enrollment belongs to org
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    select: {
      organizationId: true,
      examId: true,
      candidate: {
        select: {
          email: true,
        },
      },
      exam: {
        select: {
          title: true,
        },
      },
    },
  });

  if (!enrollment || enrollment.organizationId !== orgId) {
    throw new Error('Enrollment not found');
  }

  // Delete enrollment
  await prisma.enrollment.delete({
    where: { id: enrollmentId },
  });

  // Log to audit trail
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'ENROLLMENT_REMOVED',
      resource: 'ENROLLMENT',
      resourceId: enrollmentId,
      details: {
        examId: enrollment.examId,
        examTitle: enrollment.exam.title,
        candidateEmail: enrollment.candidate.email,
      },
      timestamp: new Date(),
    },
  });

  revalidatePath(`/dashboard/exams/${enrollment.examId}`);
}
