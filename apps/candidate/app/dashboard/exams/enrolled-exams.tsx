'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { startExam, resumeSession } from '../../actions/sessions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@proctorguard/ui';
import { Button } from '@proctorguard/ui';
import { Badge } from '@proctorguard/ui';
import { Clock, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';

type EnrolledExam = {
  id: string;
  approvedAt: Date | null;
  attemptsUsed: number;
  exam: {
    id: string;
    title: string;
    description: string | null;
    duration: number;
    scheduledStart: Date | null;
    scheduledEnd: Date | null;
    status: string;
    allowedAttempts: number;
    organization: {
      name: string;
    };
  };
  sessions: Array<{
    id: string;
    status: string;
    startedAt: Date | null;
    completedAt: Date | null;
    score: number | null;
    passed: boolean | null;
  }>;
};

type Props = {
  exams: EnrolledExam[];
};

type ExamState = 'IN_PROGRESS' | 'AVAILABLE' | 'UPCOMING' | 'COMPLETED';

function formatDate(date: Date | null): string {
  if (!date) return 'Not scheduled';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} minutes`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours} hour${hours > 1 ? 's' : ''}`;
}

/**
 * Calculates minutes remaining for an in-progress exam session.
 * Returns -1 if expired or invalid inputs.
 *
 * TIMEZONE: All Date objects from database are assumed to be in the same timezone
 * as the client. Both startedAt and scheduledEnd are compared against local time.
 */
function getMinutesRemaining(
  session: { startedAt: Date | null },
  exam: { duration: number; scheduledEnd: Date | null }
): number {
  if (!session.startedAt || !exam.scheduledEnd) return -1;

  const now = new Date();
  const start = new Date(session.startedAt);
  const windowEnd = new Date(exam.scheduledEnd);
  const durationEnd = new Date(start.getTime() + exam.duration * 60 * 1000);
  const expiresAt = windowEnd < durationEnd ? windowEnd : durationEnd;

  const remainingMs = expiresAt.getTime() - now.getTime();
  return Math.floor(remainingMs / 1000 / 60);
}

function getTimeRemaining(
  session: { startedAt: Date | null },
  exam: { duration: number; scheduledEnd: Date | null }
): string {
  const remaining = getMinutesRemaining(session, exam);

  if (remaining < 0) return 'Expired';
  if (remaining === 0) return 'Less than 1 minute remaining';
  if (remaining < 60) return `${remaining} minutes remaining`;

  const hours = Math.floor(remaining / 60);
  const mins = remaining % 60;
  return `${hours}h ${mins}m remaining`;
}

function determineExamState(enrollment: EnrolledExam): ExamState {
  const { exam, sessions, attemptsUsed } = enrollment;
  const now = new Date();

  // Check for IN_PROGRESS session
  const latestSession = sessions[0];
  if (latestSession?.status === 'IN_PROGRESS') {
    const minutesRemaining = getMinutesRemaining(
      { startedAt: latestSession.startedAt },
      { duration: exam.duration, scheduledEnd: exam.scheduledEnd }
    );
    if (minutesRemaining > 0) {
      return 'IN_PROGRESS';
    }
  }

  // Check if within exam window and attempts available
  if (exam.scheduledStart && exam.scheduledEnd) {
    const start = new Date(exam.scheduledStart);
    const end = new Date(exam.scheduledEnd);

    if (now >= start && now <= end && attemptsUsed < exam.allowedAttempts) {
      return 'AVAILABLE';
    }

    if (now < start) {
      return 'UPCOMING';
    }
  }

  return 'COMPLETED';
}

function groupExamsByState(exams: EnrolledExam[]) {
  const groups = {
    inProgress: [] as EnrolledExam[],
    available: [] as EnrolledExam[],
    upcoming: [] as EnrolledExam[],
    completed: [] as EnrolledExam[],
  };

  exams.forEach((exam) => {
    const state = determineExamState(exam);
    switch (state) {
      case 'IN_PROGRESS':
        groups.inProgress.push(exam);
        break;
      case 'AVAILABLE':
        groups.available.push(exam);
        break;
      case 'UPCOMING':
        groups.upcoming.push(exam);
        break;
      case 'COMPLETED':
        groups.completed.push(exam);
        break;
    }
  });

  // Sort each group
  groups.inProgress.sort((a, b) => {
    const aSession = a.sessions[0];
    const bSession = b.sessions[0];
    if (!aSession?.startedAt || !bSession?.startedAt) return 0;
    return new Date(bSession.startedAt).getTime() - new Date(aSession.startedAt).getTime();
  });

  groups.available.sort((a, b) => {
    if (!a.exam.scheduledEnd || !b.exam.scheduledEnd) return 0;
    return new Date(a.exam.scheduledEnd).getTime() - new Date(b.exam.scheduledEnd).getTime();
  });

  groups.upcoming.sort((a, b) => {
    if (!a.exam.scheduledStart || !b.exam.scheduledStart) return 0;
    return new Date(a.exam.scheduledStart).getTime() - new Date(b.exam.scheduledStart).getTime();
  });

  groups.completed.sort((a, b) => {
    const aSession = a.sessions[0];
    const bSession = b.sessions[0];
    if (!aSession?.completedAt || !bSession?.completedAt) return 0;
    return new Date(bSession.completedAt).getTime() - new Date(aSession.completedAt).getTime();
  });

  return groups;
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  if (count === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">
        {title} ({count})
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        {children}
      </div>
    </div>
  );
}

export function EnrolledExams({ exams }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  // Group exams by state
  const { inProgress, available, upcoming, completed } = groupExamsByState(exams);

  const handleStart = async (enrollmentId: string) => {
    setLoading(enrollmentId);
    try {
      const result = await startExam(enrollmentId);
      if (result.success) {
        router.push(`/dashboard/exams/${enrollmentId}/take?session=${result.sessionId}`);
      } else {
        alert(result.error); // We'll use toast in next step
      }
    } catch (error) {
      console.error('Failed to start exam:', error);
      alert('Failed to start exam. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const handleResume = async (enrollmentId: string) => {
    setLoading(enrollmentId);
    try {
      const result = await resumeSession(enrollmentId);
      if (result.success) {
        router.push(`/dashboard/exams/${enrollmentId}/take?session=${result.sessionId}`);
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Failed to resume session:', error);
      alert('Failed to resume session. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* In Progress Section */}
      <Section title="Active Session" count={inProgress.length}>
        {inProgress.map((enrollment) => {
          const examState = determineExamState(enrollment);
          const isLoading = loading === enrollment.id;
          const latestSession = enrollment.sessions[0];
          const minutesRemaining = latestSession ? getMinutesRemaining(latestSession, enrollment.exam) : -1;
          const timeRemaining = latestSession ? getTimeRemaining(latestSession, enrollment.exam) : '';
          const isLowTime = minutesRemaining > 0 && minutesRemaining < 10;

          return (
            <Card key={enrollment.id} className="border-l-4 border-green-500">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{enrollment.exam.title}</span>
                  <Badge variant="default" className="bg-green-600">In Progress</Badge>
                </CardTitle>
                <CardDescription>{enrollment.exam.organization.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  <span className={isLowTime ? 'text-red-600 font-semibold' : ''}>
                    {timeRemaining}
                  </span>
                </div>
                {latestSession?.startedAt && (
                  <div className="text-sm text-gray-600">
                    Started {formatDate(latestSession.startedAt)}
                  </div>
                )}
                <div className="text-sm text-gray-600">
                  Attempt {enrollment.attemptsUsed} of {enrollment.exam.allowedAttempts}
                </div>
                <Button
                  onClick={() => handleResume(enrollment.id)}
                  disabled={isLoading}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? 'Loading...' : 'Resume Exam'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </Section>

      {/* Available Section */}
      <Section title="Available Now" count={available.length}>
        {available.map((enrollment) => {
          const examState = determineExamState(enrollment);
          const isLoading = loading === enrollment.id;

          return (
            <Card key={enrollment.id} className="border-l-4 border-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{enrollment.exam.title}</span>
                  <Badge variant="default" className="bg-blue-600">Available</Badge>
                </CardTitle>
                <CardDescription>{enrollment.exam.organization.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {enrollment.exam.description && (
                  <p className="text-sm text-gray-700">{enrollment.exam.description}</p>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>Duration: {formatDuration(enrollment.exam.duration)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Available until {formatDate(enrollment.exam.scheduledEnd)}</span>
                </div>
                <div className="text-sm text-gray-600">
                  Attempts: {enrollment.attemptsUsed} / {enrollment.exam.allowedAttempts} used
                </div>
                <Button
                  onClick={() => handleStart(enrollment.id)}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Loading...' : 'Start Exam'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </Section>

      {/* Upcoming Section */}
      <Section title="Upcoming" count={upcoming.length}>
        {upcoming.map((enrollment) => (
          <Card key={enrollment.id} className="border-l-4 border-gray-300">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{enrollment.exam.title}</span>
                <Badge variant="secondary">Upcoming</Badge>
              </CardTitle>
              <CardDescription>{enrollment.exam.organization.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {enrollment.exam.description && (
                <p className="text-sm text-gray-700">{enrollment.exam.description}</p>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>Starts {formatDate(enrollment.exam.scheduledStart)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>Duration: {formatDuration(enrollment.exam.duration)}</span>
              </div>
              <Button disabled variant="outline" className="w-full">
                Opens {formatDate(enrollment.exam.scheduledStart)}
              </Button>
            </CardContent>
          </Card>
        ))}
      </Section>

      {/* Completed Section */}
      <Section title="Past Exams" count={completed.length}>
        {completed.map((enrollment) => {
          const latestSession = enrollment.sessions[0];
          const isPassed = latestSession?.passed === true;
          const isFailed = latestSession?.passed === false;

          return (
            <Card key={enrollment.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{enrollment.exam.title}</span>
                  {isPassed && (
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Passed
                    </Badge>
                  )}
                  {isFailed && (
                    <Badge variant="destructive">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Not Passed
                    </Badge>
                  )}
                  {!isPassed && !isFailed && (
                    <Badge variant="secondary">Completed</Badge>
                  )}
                </CardTitle>
                <CardDescription>{enrollment.exam.organization.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {latestSession?.score !== null && latestSession?.score !== undefined && (
                  <div className="text-lg font-semibold">
                    Score: {latestSession.score} / 100
                  </div>
                )}
                {latestSession?.completedAt && (
                  <div className="text-sm text-gray-600">
                    Completed {formatDate(latestSession.completedAt)}
                  </div>
                )}
                {enrollment.attemptsUsed >= enrollment.exam.allowedAttempts && (
                  <Badge variant="secondary" className="mt-2">
                    Maximum attempts reached ({enrollment.attemptsUsed}/{enrollment.exam.allowedAttempts})
                  </Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Section>

      {/* Empty State */}
      {inProgress.length === 0 &&
        available.length === 0 &&
        upcoming.length === 0 &&
        completed.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No enrolled exams yet.</p>
            <p className="text-sm text-gray-400 mt-2">
              Check the "Pending Invitations" tab to accept exam invitations.
            </p>
          </div>
        )}
    </div>
  );
}
