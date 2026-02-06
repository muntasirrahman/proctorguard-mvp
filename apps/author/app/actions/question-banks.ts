'use server';

import { auth } from '@proctorguard/auth';
import { headers } from 'next/headers';
import { prisma, QuestionBankStatus } from '@proctorguard/database';
import { requirePermission, Permission } from '@proctorguard/permissions';
import { revalidatePath } from 'next/cache';

interface QuestionBankData {
  title: string;
  description?: string | null;
  tags?: string[];
  status: QuestionBankStatus;
  organizationId: string;
}

export async function getQuestionBanks(organizationId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  await requirePermission(
    { userId: session.user.id, organizationId },
    Permission.VIEW_QUESTION
  );

  const banks = await prisma.questionBank.findMany({
    where: {
      authorId: session.user.id,
      organizationId
    },
    include: {
      _count: {
        select: { questions: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return banks.map(bank => ({
    ...bank,
    questionCount: bank._count.questions
  }));
}

export async function getQuestionBank(bankId: string, organizationId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  await requirePermission(
    { userId: session.user.id, organizationId },
    Permission.VIEW_QUESTION
  );

  const bank = await prisma.questionBank.findUnique({
    where: {
      id: bankId,
      authorId: session.user.id,
      organizationId
    },
    include: {
      _count: {
        select: { questions: true }
      }
    }
  });

  if (!bank) throw new Error('Question bank not found');

  return {
    ...bank,
    questionCount: bank._count.questions
  };
}

export async function createQuestionBank(data: QuestionBankData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  await requirePermission(
    { userId: session.user.id, organizationId: data.organizationId },
    Permission.CREATE_QUESTION_BANK
  );

  const bank = await prisma.questionBank.create({
    data: {
      title: data.title,
      description: data.description,
      tags: data.tags || [],
      status: data.status,
      organizationId: data.organizationId,
      authorId: session.user.id
    }
  });

  revalidatePath('/dashboard');
  return bank;
}

export async function updateQuestionBank(bankId: string, data: Partial<QuestionBankData>) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  // Verify ownership first to get organizationId
  const existing = await prisma.questionBank.findUnique({
    where: { id: bankId }
  });

  if (!existing) throw new Error('Question bank not found');
  if (existing.authorId !== session.user.id) throw new Error('Forbidden');

  await requirePermission(
    { userId: session.user.id, organizationId: existing.organizationId },
    Permission.EDIT_QUESTION_BANK
  );

  const bank = await prisma.questionBank.update({
    where: { id: bankId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.tags !== undefined && { tags: data.tags }),
      ...(data.status !== undefined && { status: data.status })
    }
  });

  revalidatePath('/dashboard');
  revalidatePath(`/dashboard/banks/${bankId}`);
  return bank;
}

export async function deleteQuestionBank(bankId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  // Verify ownership first to get organizationId
  const existing = await prisma.questionBank.findUnique({
    where: { id: bankId },
    include: {
      _count: {
        select: { questions: true }
      }
    }
  });

  if (!existing) throw new Error('Question bank not found');
  if (existing.authorId !== session.user.id) throw new Error('Forbidden');
  if (existing._count.questions > 0) {
    throw new Error('Cannot delete question bank with questions');
  }

  await requirePermission(
    { userId: session.user.id, organizationId: existing.organizationId },
    Permission.DELETE_QUESTION_BANK
  );

  await prisma.questionBank.delete({
    where: { id: bankId }
  });

  revalidatePath('/dashboard');
}
