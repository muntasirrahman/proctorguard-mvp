import { getExamById } from '../../../actions/exams/exams';
import { getEnrollments } from '../../../actions/exams/enrollments';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
} from '@proctorguard/ui';
import { Calendar, Clock, Target, Users, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { ExamStatus } from '@proctorguard/database';
import { ExamActions } from './exam-actions';
import { EnrollmentList } from './enrollment-list';

type PageProps = {
  params: Promise<{ id: string }>;
};

function getStatusVariant(status: ExamStatus): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (status) {
    case ExamStatus.DRAFT:
      return 'outline';
    case ExamStatus.SCHEDULED:
      return 'default';
    case ExamStatus.ACTIVE:
      return 'default';
    case ExamStatus.COMPLETED:
      return 'secondary';
    default:
      return 'outline';
  }
}

export default async function ExamDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [exam, enrollments] = await Promise.all([getExamById(id), getEnrollments(id)]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{exam.title}</h1>
            <Badge variant={getStatusVariant(exam.status)}>{exam.status}</Badge>
          </div>
          {exam.department && (
            <p className="text-muted-foreground">{exam.department.name}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/exams/${id}/edit`}>
            <Button variant="outline">Edit</Button>
          </Link>
          <ExamActions examId={id} status={exam.status} />
        </div>
      </div>

      {exam.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{exam.description}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center text-sm">
              <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Duration:</span>
              <span className="ml-auto font-medium">{exam.duration} minutes</span>
            </div>
            <div className="flex items-center text-sm">
              <Target className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Passing Score:</span>
              <span className="ml-auto font-medium">{exam.passingScore}%</span>
            </div>
            <div className="flex items-center text-sm">
              <Users className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Allowed Attempts:</span>
              <span className="ml-auto font-medium">{exam.allowedAttempts}</span>
            </div>
            <div className="flex items-center text-sm">
              <CheckCircle className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Recording:</span>
              <span className="ml-auto font-medium">
                {exam.enableRecording ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center text-sm">
              <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Start:</span>
              <span className="ml-auto font-medium">
                {exam.scheduledStart
                  ? new Date(exam.scheduledStart).toLocaleString()
                  : 'Not scheduled'}
              </span>
            </div>
            <div className="flex items-center text-sm">
              <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">End:</span>
              <span className="ml-auto font-medium">
                {exam.scheduledEnd
                  ? new Date(exam.scheduledEnd).toLocaleString()
                  : 'Not scheduled'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Question Bank</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="font-medium">{exam.questionBank.title}</p>
            {exam.questionBank.description && (
              <p className="text-sm text-muted-foreground">{exam.questionBank.description}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Status: <Badge variant="secondary">{exam.questionBank.status}</Badge>
            </p>
          </div>
        </CardContent>
      </Card>

      <EnrollmentList examId={id} enrollments={enrollments} />
    </div>
  );
}
