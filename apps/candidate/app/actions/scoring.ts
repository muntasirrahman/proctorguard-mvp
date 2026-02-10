'use server';

import { prisma, QuestionStatus } from '@proctorguard/database';
import type { Prisma } from '@proctorguard/database';

/**
 * Result of scoring an exam session
 */
export type ScoringResult = {
  sessionId: string;
  totalScore: number;
  maxPossibleScore: number;
  percentage: number;
  passed: boolean;
  questionsScored: number;
  questionsTotal: number;
};

/**
 * Main entry point for scoring an exam session
 * Can accept an optional transaction client for use within existing transactions
 */
export async function scoreExamSession(
  sessionId: string,
  tx?: Prisma.TransactionClient
): Promise<ScoringResult> {
  if (tx) {
    // Use provided transaction
    return await scoreExamSessionInTransaction(tx, sessionId);
  } else {
    // Create new transaction
    return await prisma.$transaction(async (newTx) => {
      return await scoreExamSessionInTransaction(newTx, sessionId);
    });
  }
}

/**
 * Transaction-scoped scoring orchestrator
 * Scores all objective questions and updates Answer and ExamSession records
 */
async function scoreExamSessionInTransaction(
  tx: Prisma.TransactionClient,
  sessionId: string
): Promise<ScoringResult> {
  // 1. Fetch session with exam details
  const session = await tx.examSession.findUnique({
    where: { id: sessionId },
    include: {
      exam: {
        select: {
          id: true,
          questionBankId: true,
          passingScore: true,
        },
      },
    },
  });

  if (!session) {
    throw new Error('Exam session not found');
  }

  // 2. Fetch all APPROVED questions from the question bank
  const questions = await tx.question.findMany({
    where: {
      questionBankId: session.exam.questionBankId,
      status: QuestionStatus.APPROVED,
    },
    select: {
      id: true,
      type: true,
      correctAnswer: true,
      points: true,
    },
  });

  // 3. Fetch all answers for this session
  const answers = await tx.answer.findMany({
    where: { sessionId },
    select: {
      id: true,
      questionId: true,
      answer: true,
    },
  });

  // Build a map of questionId -> answer for quick lookup
  const answerMap = new Map(
    answers.map((a) => [a.questionId, a])
  );

  // 4. Score each question
  let totalScore = 0;
  let maxPossibleScore = 0;
  let questionsScored = 0;

  const updatePromises: Promise<any>[] = [];

  for (const question of questions) {
    // Skip essay questions (require manual grading)
    if (question.type === 'essay') {
      continue;
    }

    // Count this question towards max possible score
    maxPossibleScore += question.points;

    const answerRecord = answerMap.get(question.id);

    // Handle unanswered questions
    if (!answerRecord) {
      // Create a record marking it as incorrect with 0 points
      updatePromises.push(
        tx.answer.create({
          data: {
            sessionId,
            questionId: question.id,
            answer: { selectedOption: null, textResponse: null, isFlagged: false },
            isCorrect: false,
            points: 0,
          },
        })
      );
      questionsScored++;
      continue;
    }

    // Parse the answer JSON
    const answerJson = answerRecord.answer as {
      selectedOption?: string | null;
      textResponse?: string | null;
      isFlagged?: boolean;
    };

    const userAnswer = answerJson.selectedOption;

    // Handle empty answers
    if (!userAnswer || userAnswer.trim() === '') {
      updatePromises.push(
        tx.answer.update({
          where: { id: answerRecord.id },
          data: {
            isCorrect: false,
            points: 0,
          },
        })
      );
      questionsScored++;
      continue;
    }

    // Normalize correct answer
    const normalizedCorrectAnswer = normalizeCorrectAnswer(
      question.type,
      question.correctAnswer
    );

    // Score based on question type
    let isCorrect = false;

    if (question.type === 'multiple_choice') {
      const result = scoreMCQ(normalizedCorrectAnswer, userAnswer);
      isCorrect = result.isCorrect;
    } else if (question.type === 'true_false') {
      const result = scoreTrueFalse(normalizedCorrectAnswer, userAnswer);
      isCorrect = result.isCorrect;
    }

    // Award points if correct
    const pointsAwarded = isCorrect ? question.points : 0;
    totalScore += pointsAwarded;
    questionsScored++;

    // Update Answer record
    updatePromises.push(
      tx.answer.update({
        where: { id: answerRecord.id },
        data: {
          isCorrect,
          points: pointsAwarded,
        },
      })
    );
  }

  // Execute all answer updates in parallel
  await Promise.all(updatePromises);

  // 5. Calculate percentage and pass/fail
  const percentage = maxPossibleScore > 0
    ? Math.round((totalScore / maxPossibleScore) * 100)
    : 0;

  const passed = percentage >= session.exam.passingScore;

  // 6. Update ExamSession with score and passed status
  await tx.examSession.update({
    where: { id: sessionId },
    data: {
      score: percentage,
      passed,
    },
  });

  // 7. Return scoring results
  return {
    sessionId,
    totalScore,
    maxPossibleScore,
    percentage,
    passed,
    questionsScored,
    questionsTotal: questions.length,
  };
}

/**
 * Score a multiple choice question
 * Compares selectedOption (user's choice) with correctAnswer (uppercase)
 */
function scoreMCQ(
  correctAnswer: string | boolean | null,
  userAnswer: string
): { isCorrect: boolean } {
  if (typeof correctAnswer !== 'string' || !correctAnswer) {
    return { isCorrect: false };
  }

  // Normalize both to uppercase for comparison
  const normalizedCorrect = correctAnswer.toUpperCase().trim();
  const normalizedUser = userAnswer.toUpperCase().trim();

  return { isCorrect: normalizedCorrect === normalizedUser };
}

/**
 * Score a true/false question
 * Converts selectedOption string to boolean and compares with correctAnswer
 */
function scoreTrueFalse(
  correctAnswer: string | boolean | null,
  userAnswer: string
): { isCorrect: boolean } {
  if (typeof correctAnswer !== 'boolean') {
    return { isCorrect: false };
  }

  // Convert string "true"/"false" to boolean
  const userBool = userAnswer.toLowerCase().trim() === 'true';

  return { isCorrect: correctAnswer === userBool };
}

/**
 * Normalize correctAnswer from various formats to string | boolean | null
 * Handles legacy format like {answer: "a"} and converts to "A"
 */
function normalizeCorrectAnswer(
  questionType: string,
  rawCorrectAnswer: any
): string | boolean | null {
  if (rawCorrectAnswer === null || rawCorrectAnswer === undefined) {
    return null;
  }

  // Handle true/false questions
  if (questionType === 'true_false') {
    if (typeof rawCorrectAnswer === 'boolean') {
      return rawCorrectAnswer;
    }
    // Try to parse from JSON object
    if (typeof rawCorrectAnswer === 'object' && rawCorrectAnswer.answer !== undefined) {
      return Boolean(rawCorrectAnswer.answer);
    }
    return null;
  }

  // Handle multiple choice questions
  if (questionType === 'multiple_choice') {
    // Direct string format: "A", "B", etc.
    if (typeof rawCorrectAnswer === 'string') {
      return rawCorrectAnswer.toUpperCase().trim();
    }

    // Legacy object format: {answer: "a"}
    if (typeof rawCorrectAnswer === 'object' && rawCorrectAnswer.answer) {
      return String(rawCorrectAnswer.answer).toUpperCase().trim();
    }

    return null;
  }

  return null;
}
