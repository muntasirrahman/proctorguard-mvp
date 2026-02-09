import { auth } from '@proctorguard/auth';
import { prisma, SessionStatus } from '@proctorguard/database';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@proctorguard/ui';
import { Button } from '@proctorguard/ui';
import { Clock, FileText } from 'lucide-react';
import Link from 'next/link';

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

  // 5. Calculate time info
  const startedAt = examSession.startedAt ? new Date(examSession.startedAt) : null;
  const scheduledEnd = examSession.exam.scheduledEnd ? new Date(examSession.exam.scheduledEnd) : null;

  let timeRemaining = 'Unknown';
  if (startedAt && scheduledEnd) {
    const durationEnd = new Date(startedAt.getTime() + examSession.exam.duration * 60 * 1000);
    const expiresAt = scheduledEnd < durationEnd ? scheduledEnd : durationEnd;
    const remaining = Math.floor((expiresAt.getTime() - now.getTime()) / 1000 / 60);

    if (remaining > 0) {
      if (remaining < 60) {
        timeRemaining = `${remaining} minutes`;
      } else {
        const hours = Math.floor(remaining / 60);
        const mins = remaining % 60;
        timeRemaining = `${hours}h ${mins}m`;
      }
    } else {
      timeRemaining = 'Expired';
    }
  }

  // 6. Render placeholder
  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            {examSession.exam.title}
          </CardTitle>
          <p className="text-sm text-gray-600">{examSession.exam.organization.name}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Session Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Session Information</h3>
            <div className="space-y-1 text-sm">
              <p>Attempt: {examSession.attemptNumber} of {examSession.exam.allowedAttempts}</p>
              <p>Status: {examSession.status}</p>
              {startedAt && <p>Started: {startedAt.toLocaleString()}</p>}
              <div className="flex items-center gap-2 font-semibold text-blue-700">
                <Clock className="h-4 w-4" />
                <span>Time Remaining: {timeRemaining}</span>
              </div>
            </div>
          </div>

          {/* Coming Soon Message */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Exam Interface Coming Soon</h2>
            <p className="text-gray-600 mb-4">
              The exam-taking interface will be implemented in Phase 4.
            </p>
            <p className="text-sm text-gray-500">
              This page validates that your session exists and you have permission to access it.
            </p>
          </div>

          {/* Timer Display (Non-functional) */}
          <div className="border border-gray-300 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Timer (Placeholder)</span>
              <div className="text-2xl font-bold font-mono text-gray-400">
                {timeRemaining}
              </div>
            </div>
          </div>

          {/* Exit Button */}
          <div className="flex justify-center pt-4">
            <Button asChild variant="outline" size="lg">
              <Link href="/dashboard/exams">
                Exit to Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
