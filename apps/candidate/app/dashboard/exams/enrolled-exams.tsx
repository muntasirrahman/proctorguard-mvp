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
};

type Props = {
  exams: EnrolledExam[];
};

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
