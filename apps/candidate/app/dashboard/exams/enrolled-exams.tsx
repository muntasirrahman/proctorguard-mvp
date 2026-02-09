'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
} from '@proctorguard/ui';

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

function determineExamState(enrollment: EnrolledExam): ExamState {
  const { exam, sessions, attemptsUsed } = enrollment;
  const now = new Date();

  // Check for IN_PROGRESS session
  const latestSession = sessions[0];
  if (latestSession?.status === 'IN_PROGRESS') {
    // Check if expired
    if (exam.scheduledEnd && latestSession.startedAt) {
      const windowEnd = new Date(exam.scheduledEnd);
      const durationEnd = new Date(
        new Date(latestSession.startedAt).getTime() + exam.duration * 60 * 1000
      );
      const expiresAt = windowEnd < durationEnd ? windowEnd : durationEnd;

      if (now < expiresAt) {
        return 'IN_PROGRESS';
      }
    } else if (exam.scheduledEnd) {
      const windowEnd = new Date(exam.scheduledEnd);
      if (now < windowEnd) {
        return 'IN_PROGRESS';
      }
    } else {
      // No expiration if no schedule
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

export function EnrolledExams({ exams }: Props) {
  const getExamStatus = (exam: EnrolledExam['exam']) => {
    const now = new Date();

    if (exam.status === 'COMPLETED' || exam.status === 'CANCELLED') {
      return { label: 'Completed', variant: 'secondary' as const };
    }

    if (!exam.scheduledStart || !exam.scheduledEnd) {
      return { label: 'Scheduled', variant: 'default' as const };
    }

    const start = new Date(exam.scheduledStart);
    const end = new Date(exam.scheduledEnd);

    if (now < start) {
      return { label: 'Upcoming', variant: 'default' as const };
    }

    if (now >= start && now <= end) {
      return { label: 'Active', variant: 'default' as const };
    }

    return { label: 'Ended', variant: 'secondary' as const };
  };

  const canStartExam = (exam: EnrolledExam['exam'], attemptsUsed: number) => {
    const now = new Date();

    if (exam.status !== 'ACTIVE' && exam.status !== 'SCHEDULED') {
      return false;
    }

    if (!exam.scheduledStart || !exam.scheduledEnd) {
      return false;
    }

    const start = new Date(exam.scheduledStart);
    const end = new Date(exam.scheduledEnd);

    if (now < start || now > end) {
      return false;
    }

    if (attemptsUsed >= exam.allowedAttempts) {
      return false;
    }

    return true;
  };

  if (exams.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No enrolled exams yet</p>
        <p className="text-sm text-muted-foreground mt-2">
          Check Pending Invitations to accept exam invitations
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {exams.map((enrollment) => {
        const status = getExamStatus(enrollment.exam);
        const canStart = canStartExam(enrollment.exam, enrollment.attemptsUsed);

        return (
          <Card key={enrollment.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{enrollment.exam.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {enrollment.exam.organization.name}
                  </CardDescription>
                </div>
                <Badge variant={status.variant} className="ml-2">
                  {status.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {enrollment.exam.description && (
                <p className="text-sm text-muted-foreground">
                  {enrollment.exam.description}
                </p>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-medium">{enrollment.exam.duration} minutes</span>
                </div>

                {enrollment.exam.scheduledStart && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Starts:</span>
                    <span className="font-medium">
                      {new Date(enrollment.exam.scheduledStart).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}

                {enrollment.exam.scheduledEnd && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ends:</span>
                    <span className="font-medium">
                      {new Date(enrollment.exam.scheduledEnd).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Attempts:</span>
                  <span className="font-medium">
                    {enrollment.attemptsUsed} / {enrollment.exam.allowedAttempts}
                  </span>
                </div>

                {enrollment.approvedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Enrolled:</span>
                    <span className="font-medium">
                      {new Date(enrollment.approvedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <Button
                  disabled={!canStart}
                  className="w-full"
                  variant={canStart ? 'default' : 'outline'}
                >
                  {canStart ? 'Start Exam' : 'Not Available'}
                </Button>
                {!canStart && enrollment.attemptsUsed >= enrollment.exam.allowedAttempts && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Maximum attempts reached
                  </p>
                )}
                {!canStart && status.label === 'Upcoming' && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Exam will be available when it starts
                  </p>
                )}
                {!canStart && status.label === 'Ended' && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Exam period has ended
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
