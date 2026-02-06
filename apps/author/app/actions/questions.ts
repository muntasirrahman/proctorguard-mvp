'use server';

import { auth } from '@proctorguard/auth';
import { headers } from 'next/headers';
import { prisma, QuestionStatus, Difficulty, Prisma } from '@proctorguard/database';
import { requirePermission, Permission } from '@proctorguard/permissions';
import { revalidatePath } from 'next/cache';

interface QuestionData {
  type: 'multiple_choice' | 'true_false' | 'essay';
  text: string;
  difficulty: Difficulty;
  points: number;
  timeLimit?: number | null;
  explanation?: string | null;
  status: QuestionStatus;
  tags?: string[];
  // Type-specific fields
  options?: { A: string; B: string; C: string; D: string; E: string }; // For MCQ
  correctAnswer?: string | boolean; // For MCQ: 'A'|'B'|'C'|'D'|'E', for T/F: true|false
}

export async function getQuestions(bankId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  // Verify bank ownership first to get organizationId
  const bank = await prisma.questionBank.findUnique({
    where: { id: bankId }
  });

  if (!bank) throw new Error('Question bank not found');
  if (bank.authorId !== session.user.id) {
    throw new Error('Access denied: You can only view questions from your own banks');
  }

  await requirePermission(
    { userId: session.user.id, organizationId: bank.organizationId },
    Permission.VIEW_QUESTION
  );

  const questions = await prisma.question.findMany({
    where: { questionBankId: bankId },
    orderBy: { createdAt: 'desc' }
  });

  return questions;
}

export async function getQuestion(questionId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: { questionBank: true }
  });

  if (!question) throw new Error('Question not found');
  if (question.questionBank.authorId !== session.user.id) {
    throw new Error('Access denied: You can only view your own questions');
  }

  await requirePermission(
    { userId: session.user.id, organizationId: question.questionBank.organizationId },
    Permission.VIEW_QUESTION
  );

  return question;
}

export async function createQuestion(bankId: string, data: QuestionData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  // Verify bank ownership first to get organizationId
  const bank = await prisma.questionBank.findUnique({
    where: { id: bankId }
  });

  if (!bank) throw new Error('Question bank not found');
  if (bank.authorId !== session.user.id) {
    throw new Error('Access denied: You can only add questions to your own banks');
  }

  await requirePermission(
    { userId: session.user.id, organizationId: bank.organizationId },
    Permission.CREATE_QUESTION
  );

  // Validate input
  const trimmedText = data.text?.trim();
  if (!trimmedText) {
    throw new Error('Question text is required');
  }

  if (data.points < 1) {
    throw new Error('Points must be at least 1');
  }

  // Validate type-specific data
  if (data.type === 'multiple_choice') {
    if (!data.options || !data.correctAnswer) {
      throw new Error('Multiple choice questions require options and correct answer');
    }
    // Validate all 5 options are provided
    const requiredOptions = ['A', 'B', 'C', 'D', 'E'];
    for (const opt of requiredOptions) {
      if (!data.options[opt as keyof typeof data.options]?.trim()) {
        throw new Error(`Option ${opt} is required for multiple choice questions`);
      }
    }
    // Validate correctAnswer is one of A-E
    if (!['A', 'B', 'C', 'D', 'E'].includes(data.correctAnswer as string)) {
      throw new Error('Correct answer must be A, B, C, D, or E');
    }
  } else if (data.type === 'true_false') {
    if (typeof data.correctAnswer !== 'boolean') {
      throw new Error('True/false questions require a boolean correct answer');
    }
  }

  const question = await prisma.question.create({
    data: {
      type: data.type,
      text: trimmedText,
      difficulty: data.difficulty,
      points: data.points,
      timeLimit: data.timeLimit,
      explanation: data.explanation?.trim() || null,
      status: data.status,
      tags: data.tags?.map(t => t.trim()).filter(Boolean) || [],
      options: data.options || {},
      correctAnswer: data.correctAnswer !== undefined ? (data.correctAnswer as Prisma.InputJsonValue) : Prisma.JsonNull,
      questionBankId: bankId
    }
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'created',
      resource: 'question',
      resourceId: question.id,
      details: { type: question.type, text: trimmedText.substring(0, 100) }
    }
  });

  revalidatePath(`/dashboard/banks/${bankId}`);
  return question;
}

export async function updateQuestion(questionId: string, data: Partial<QuestionData>) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  // Verify ownership first to get organizationId
  const existing = await prisma.question.findUnique({
    where: { id: questionId },
    include: { questionBank: true }
  });

  if (!existing) throw new Error('Question not found');
  if (existing.questionBank.authorId !== session.user.id) {
    throw new Error('Access denied: You can only edit your own questions');
  }

  await requirePermission(
    { userId: session.user.id, organizationId: existing.questionBank.organizationId },
    Permission.EDIT_QUESTION
  );

  // Validate text if provided
  if (data.text !== undefined) {
    const trimmedText = data.text?.trim();
    if (!trimmedText) {
      throw new Error('Question text is required');
    }
  }

  // Validate points if provided
  if (data.points !== undefined && data.points < 1) {
    throw new Error('Points must be at least 1');
  }

  // Validate type-specific fields if being updated
  if (data.type === 'multiple_choice' || (data.options !== undefined && existing.type === 'multiple_choice')) {
    if (data.options) {
      const requiredOptions = ['A', 'B', 'C', 'D', 'E'];
      for (const opt of requiredOptions) {
        if (!data.options[opt as keyof typeof data.options]?.trim()) {
          throw new Error(`Option ${opt} is required for multiple choice questions`);
        }
      }
    }
    if (data.correctAnswer !== undefined && typeof data.correctAnswer === 'string') {
      if (!['A', 'B', 'C', 'D', 'E'].includes(data.correctAnswer)) {
        throw new Error('Correct answer must be A, B, C, D, or E');
      }
    }
  } else if (data.type === 'true_false' || (data.correctAnswer !== undefined && typeof data.correctAnswer === 'boolean' && existing.type === 'true_false')) {
    if (data.correctAnswer !== undefined && typeof data.correctAnswer !== 'boolean') {
      throw new Error('True/false questions require a boolean correct answer');
    }
  }

  // Build update data
  const updateData: Partial<{
    text: string;
    difficulty: Difficulty;
    points: number;
    timeLimit: number | null;
    explanation: string | null;
    status: QuestionStatus;
    tags: string[];
    options: { A: string; B: string; C: string; D: string; E: string };
    correctAnswer: Prisma.InputJsonValue;
  }> = {};
  if (data.text !== undefined) updateData.text = data.text.trim();
  if (data.difficulty !== undefined) updateData.difficulty = data.difficulty;
  if (data.points !== undefined) updateData.points = data.points;
  if (data.timeLimit !== undefined) updateData.timeLimit = data.timeLimit;
  if (data.explanation !== undefined) updateData.explanation = data.explanation?.trim() || null;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.tags !== undefined) updateData.tags = data.tags.map(t => t.trim()).filter(Boolean);
  if (data.options !== undefined) updateData.options = data.options;
  if (data.correctAnswer !== undefined) updateData.correctAnswer = data.correctAnswer as Prisma.InputJsonValue;

  const question = await prisma.question.update({
    where: { id: questionId },
    data: updateData
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'updated',
      resource: 'question',
      resourceId: question.id,
      details: Object.keys(updateData)
    }
  });

  revalidatePath(`/dashboard/banks/${existing.questionBankId}`);
  revalidatePath(`/dashboard/banks/${existing.questionBankId}/questions/${questionId}`);
  return question;
}

export async function deleteQuestion(questionId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  // Verify ownership first to get organizationId
  const existing = await prisma.question.findUnique({
    where: { id: questionId },
    include: { questionBank: true }
  });

  if (!existing) throw new Error('Question not found');
  if (existing.questionBank.authorId !== session.user.id) {
    throw new Error('Access denied: You can only delete your own questions');
  }

  await requirePermission(
    { userId: session.user.id, organizationId: existing.questionBank.organizationId },
    Permission.DELETE_QUESTION
  );

  await prisma.question.delete({
    where: { id: questionId }
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'deleted',
      resource: 'question',
      resourceId: questionId,
      details: { text: existing.text.substring(0, 100) }
    }
  });

  revalidatePath(`/dashboard/banks/${existing.questionBankId}`);
}
