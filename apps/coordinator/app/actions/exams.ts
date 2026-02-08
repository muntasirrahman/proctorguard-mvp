'use server';

import { auth } from '@proctorguard/auth';
import { prisma, ExamStatus } from '@proctorguard/database';
import { requirePermission, Permission } from '@proctorguard/permissions';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

async function getSessionAndOrg() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect('/auth/signin');
  }

  // Get user's organization (coordinators have exactly one)
  const userRole = await prisma.userRole.findFirst({
    where: {
      userId: session.user.id,
      role: 'EXAM_COORDINATOR',
    },
    include: {
      organization: true,
    },
  });

  if (!userRole) {
    throw new Error('No coordinator role found');
  }

  return { session, org: userRole.organization, orgId: userRole.organizationId };
}

export async function getExams() {
  const { session, orgId } = await getSessionAndOrg();

  await requirePermission(
    { userId: session.user.id, organizationId: orgId },
    Permission.VIEW_EXAM_CONFIG
  );

  const exams = await prisma.exam.findMany({
    where: {
      organizationId: orgId,
    },
    include: {
      questionBank: {
        select: {
          title: true,
        },
      },
      department: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          enrollments: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return exams;
}

export async function getExamById(examId: string) {
  const { session, orgId } = await getSessionAndOrg();

  await requirePermission(
    { userId: session.user.id, organizationId: orgId },
    Permission.VIEW_EXAM_CONFIG
  );

  const exam = await prisma.exam.findUnique({
    where: {
      id: examId,
      organizationId: orgId,
    },
    include: {
      questionBank: true,
      department: true,
      enrollments: {
        include: {
          candidate: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!exam) {
    throw new Error('Exam not found');
  }

  return exam;
}

export async function getApprovedQuestionBanks() {
  const { session, orgId } = await getSessionAndOrg();

  const banks = await prisma.questionBank.findMany({
    where: {
      organizationId: orgId,
      status: 'APPROVED',
    },
    select: {
      id: true,
      title: true,
      description: true,
      _count: {
        select: {
          questions: {
            where: {
              status: 'APPROVED',
            },
          },
        },
      },
    },
    orderBy: {
      title: 'asc',
    },
  });

  return banks;
}

export async function getDepartments() {
  const { orgId } = await getSessionAndOrg();

  const departments = await prisma.department.findMany({
    where: {
      organizationId: orgId,
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  return departments;
}
