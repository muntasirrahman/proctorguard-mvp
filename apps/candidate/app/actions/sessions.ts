'use server';

import { auth } from '@proctorguard/auth';
import { prisma, SessionStatus } from '@proctorguard/database';
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
    },
    select: { organizationId: true },
  });

  if (!userRole) {
    throw new Error('No organization found for user');
  }

  return { session, orgId: userRole.organizationId };
}

/**
 * Creates a new exam session and redirects to exam page
 */
export async function startExam(enrollmentId: string) {
  try {
    const { session } = await getSessionAndOrg();

    // Fetch enrollment with exam details
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        exam: true,
        sessions: {
          where: { status: SessionStatus.IN_PROGRESS },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!enrollment) {
      return { success: false, error: 'Enrollment not found' };
    }

    // Validate candidate owns this enrollment
    if (enrollment.candidateId !== session.user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check for existing IN_PROGRESS session
    if (enrollment.sessions.length > 0) {
      return { success: false, error: 'You already have an active session for this exam' };
    }

    // Validate exam is ACTIVE or SCHEDULED
    if (enrollment.exam.status !== 'ACTIVE' && enrollment.exam.status !== 'SCHEDULED') {
      return { success: false, error: 'Exam is not available' };
    }

    // Check within exam window
    const now = new Date();
    if (enrollment.exam.scheduledStart && enrollment.exam.scheduledEnd) {
      const start = new Date(enrollment.exam.scheduledStart);
      const end = new Date(enrollment.exam.scheduledEnd);

      if (now < start) {
        return { success: false, error: 'Exam has not started yet' };
      }

      if (now > end) {
        return { success: false, error: 'Exam window has closed' };
      }
    }

    // Use transaction for atomic session creation
    const examSession = await prisma.$transaction(async (tx) => {
      // Re-fetch enrollment inside transaction to avoid race conditions
      const freshEnrollment = await tx.enrollment.findUnique({
        where: { id: enrollmentId },
        include: { exam: true },
      });

      if (!freshEnrollment) {
        throw new Error('Enrollment not found');
      }

      // Count attempts inside transaction
      const totalAttempts = await tx.examSession.count({
        where: { enrollmentId: freshEnrollment.id },
      });

      if (totalAttempts >= freshEnrollment.exam.allowedAttempts) {
        throw new Error('Maximum attempts reached');
      }

      // Create session
      const examSession = await tx.examSession.create({
        data: {
          examId: freshEnrollment.exam.id,
          enrollmentId: freshEnrollment.id,
          candidateId: session.user.id,
          attemptNumber: totalAttempts + 1,
          status: SessionStatus.NOT_STARTED,
        },
      });

      // Increment attemptsUsed
      await tx.enrollment.update({
        where: { id: enrollmentId },
        data: { attemptsUsed: freshEnrollment.attemptsUsed + 1 },
      });

      return examSession;
    });

    revalidatePath('/dashboard/exams');

    return { success: true, sessionId: examSession.id };
  } catch (error) {
    console.error('Error starting exam:', error);
    return { success: false, error: 'Failed to start exam. Please try again.' };
  }
}

/**
 * Resumes an in-progress exam session
 */
export async function resumeSession(enrollmentId: string) {
  try {
    const { session } = await getSessionAndOrg();

    // Find enrollment with IN_PROGRESS session
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        exam: true,
        sessions: {
          where: { status: SessionStatus.IN_PROGRESS },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!enrollment) {
      return { success: false, error: 'Enrollment not found' };
    }

    // Validate candidate owns this enrollment
    if (enrollment.candidateId !== session.user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check for IN_PROGRESS session
    if (enrollment.sessions.length === 0) {
      return { success: false, error: 'No active session found' };
    }

    const examSession = enrollment.sessions[0];

    // Check expiration
    const now = new Date();
    let expiresAt: Date;

    if (enrollment.exam.scheduledEnd && examSession.startedAt) {
      // Session expires at the earlier of: window end OR duration elapsed
      const windowEnd = new Date(enrollment.exam.scheduledEnd);
      const durationEnd = new Date(
        examSession.startedAt.getTime() + enrollment.exam.duration * 60 * 1000
      );
      expiresAt = windowEnd < durationEnd ? windowEnd : durationEnd;
    } else if (enrollment.exam.scheduledEnd) {
      expiresAt = new Date(enrollment.exam.scheduledEnd);
    } else {
      // No expiration if no schedule or startedAt
      return { success: true, sessionId: examSession.id };
    }

    // Check if expired
    if (now >= expiresAt) {
      // Auto-complete the session
      await prisma.examSession.update({
        where: { id: examSession.id },
        data: {
          status: SessionStatus.COMPLETED,
          completedAt: now,
        },
      });

      revalidatePath('/dashboard/exams');

      return {
        success: false,
        error: 'Session expired. Your answers have been submitted.',
      };
    }

    return { success: true, sessionId: examSession.id };
  } catch (error) {
    console.error('Error resuming session:', error);
    return { success: false, error: 'Failed to resume session. Please try again.' };
  }
}
