import { auth } from '@proctorguard/auth';
import { prisma, SessionStatus } from '@proctorguard/database';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { PreExamChecks } from './pre-exam-checks';
import { ExamInterface } from './exam-interface';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ session?: string }>;
};

export default async function TakeExamPage({ params, searchParams }: PageProps) {
  // 1. Get session
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect('/auth/signin');
  }

  // 2. Await params and searchParams
  const { id: enrollmentId } = await params;
  const { session: sessionId } = await searchParams;

  if (!sessionId) {
    redirect('/dashboard/exams');
  }

  // 3. Fetch exam session
  let examSession;
  try {
    examSession = await prisma.examSession.findUnique({
      where: { id: sessionId },
      include: {
        exam: {
          include: {
            organization: true,
          },
        },
        enrollment: true,
      },
    });
  } catch (error) {
    console.error('Failed to load exam session:', error);
    redirect('/dashboard/exams');
  }

  // 4. Validate session
  if (!examSession) {
    redirect('/dashboard/exams');
  }

  if (examSession.candidateId !== session.user.id) {
    redirect('/dashboard/exams');
  }

  if (examSession.enrollmentId !== enrollmentId) {
    redirect('/dashboard/exams');
  }

  // Only allow access to NOT_STARTED or IN_PROGRESS sessions
  if (examSession.status !== SessionStatus.NOT_STARTED &&
      examSession.status !== SessionStatus.IN_PROGRESS) {
    redirect('/dashboard/exams');
  }

  // Check if exam window has closed
  const now = new Date();
  if (examSession.exam.scheduledEnd && now > new Date(examSession.exam.scheduledEnd)) {
    redirect('/dashboard/exams');
  }

  // 5. Fetch questions for this exam
  const questions = await prisma.question.findMany({
    where: {
      questionBankId: examSession.exam.questionBankId,
      status: 'APPROVED', // Only show approved questions
    },
    orderBy: { createdAt: 'asc' }, // Ensure consistent question order
  });

  // 6. Fetch existing answers for this session
  const existingAnswers = await prisma.answer.findMany({
    where: { sessionId: sessionId },
    select: {
      questionId: true,
      answer: true,
    },
  });

  // 7. Calculate attempt number
  const previousSessions = await prisma.examSession.count({
    where: {
      enrollmentId: enrollmentId,
      candidateId: session.user.id,
    },
  });
  const attemptNumber = previousSessions;

  // 8. Conditional rendering based on session status

  // If NOT_STARTED: show PreExamChecks
  if (examSession.status === SessionStatus.NOT_STARTED) {
    return (
      <PreExamChecks
        exam={{
          title: examSession.exam.title,
          instructions: examSession.exam.instructions,
          duration: examSession.exam.duration,
          enableRecording: examSession.exam.enableRecording,
          organization: {
            name: examSession.exam.organization.name,
          },
        }}
        questionCount={questions.length}
        attemptNumber={attemptNumber}
        enrollmentId={enrollmentId}
      />
    );
  }

  // If IN_PROGRESS: show ExamInterface
  if (examSession.status === SessionStatus.IN_PROGRESS) {
    return (
      <ExamInterface
        session={{
          id: examSession.id,
          startedAt: examSession.startedAt!,
          lastViewedQuestionIndex: examSession.lastViewedQuestionIndex || 0,
        }}
        exam={{
          title: examSession.exam.title,
          duration: examSession.exam.duration,
        }}
        questions={questions.map((q) => ({
          id: q.id,
          questionText: q.text,
          questionType: q.type as 'multiple_choice' | 'true_false' | 'short_answer' | 'essay',
          points: q.points,
          options: Array.isArray(q.options)
            ? (q.options as Array<{ id: string; optionText: string }>)
            : [],
        }))}
        existingAnswers={existingAnswers.map((a) => ({
          questionId: a.questionId,
          answer: a.answer as any, // Parse JSON answer field
        }))}
      />
    );
  }

  // Fallback (should not reach here due to earlier validation)
  redirect('/dashboard/exams');
}
