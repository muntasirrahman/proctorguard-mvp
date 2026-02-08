'use server';

import { auth } from '@proctorguard/auth';
import { prisma, ExamStatus } from '@proctorguard/database';
import { requirePermission, Permission } from '@proctorguard/permissions';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
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

export type CreateExamInput = {
  title: string;
  description?: string;
  departmentId?: string;
  questionBankId: string;
  duration: number;
  passingScore: number;
  allowedAttempts: number;
  scheduledStart?: Date;
  scheduledEnd?: Date;
  enableRecording: boolean;
};

export async function createExam(data: CreateExamInput) {
  const { session, orgId } = await getSessionAndOrg();

  await requirePermission(
    { userId: session.user.id, organizationId: orgId },
    Permission.CREATE_EXAM
  );

  const exam = await prisma.exam.create({
    data: {
      title: data.title,
      description: data.description,
      organizationId: orgId,
      departmentId: data.departmentId,
      coordinatorId: session.user.id,
      questionBankId: data.questionBankId,
      status: ExamStatus.DRAFT,
      duration: data.duration,
      passingScore: data.passingScore,
      allowedAttempts: data.allowedAttempts,
      scheduledStart: data.scheduledStart,
      scheduledEnd: data.scheduledEnd,
      enableRecording: data.enableRecording,
      // MVP: disable advanced proctoring features
      requireIdentityVerification: false,
      requireLockdownBrowser: false,
      enableAIMonitoring: false,
    },
  });

  revalidatePath('/dashboard');
  redirect(`/dashboard/exams/${exam.id}`);
}

export type UpdateExamInput = CreateExamInput & { id: string };

export async function updateExam(data: UpdateExamInput) {
  const { session, orgId } = await getSessionAndOrg();

  await requirePermission(
    { userId: session.user.id, organizationId: orgId },
    Permission.EDIT_EXAM
  );

  // Verify exam belongs to coordinator's org
  const existing = await prisma.exam.findUnique({
    where: { id: data.id },
    select: { organizationId: true, status: true },
  });

  if (!existing || existing.organizationId !== orgId) {
    throw new Error('Exam not found');
  }

  // Only allow editing if exam is DRAFT or SCHEDULED
  if (existing.status !== ExamStatus.DRAFT && existing.status !== ExamStatus.SCHEDULED) {
    throw new Error('Cannot edit exam in current status');
  }

  const exam = await prisma.exam.update({
    where: { id: data.id },
    data: {
      title: data.title,
      description: data.description,
      departmentId: data.departmentId,
      questionBankId: data.questionBankId,
      duration: data.duration,
      passingScore: data.passingScore,
      allowedAttempts: data.allowedAttempts,
      scheduledStart: data.scheduledStart,
      scheduledEnd: data.scheduledEnd,
      enableRecording: data.enableRecording,
    },
  });

  revalidatePath('/dashboard/exams');
  revalidatePath(`/dashboard/exams/${exam.id}`);
  return exam;
}

export async function updateExamStatus(examId: string, status: ExamStatus) {
  const { session, orgId } = await getSessionAndOrg();

  await requirePermission(
    { userId: session.user.id, organizationId: orgId },
    Permission.SCHEDULE_EXAM
  );

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    select: { organizationId: true },
  });

  if (!exam || exam.organizationId !== orgId) {
    throw new Error('Exam not found');
  }

  await prisma.exam.update({
    where: { id: examId },
    data: { status },
  });

  revalidatePath('/dashboard/exams');
  revalidatePath(`/dashboard/exams/${examId}`);
}

export async function deleteExam(examId: string) {
  const { session, orgId } = await getSessionAndOrg();

  await requirePermission(
    { userId: session.user.id, organizationId: orgId },
    Permission.DELETE_EXAM
  );

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    select: { organizationId: true, status: true },
  });

  if (!exam || exam.organizationId !== orgId) {
    throw new Error('Exam not found');
  }

  // Only allow deletion if exam is DRAFT
  if (exam.status !== ExamStatus.DRAFT) {
    throw new Error('Can only delete draft exams');
  }

  await prisma.exam.delete({
    where: { id: examId },
  });

  revalidatePath('/dashboard/exams');
  redirect('/dashboard/exams');
}
