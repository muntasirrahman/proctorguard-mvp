import { getExams } from '../actions/exams';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Badge } from '@proctorguard/ui';
import { Calendar, Users, Clock, Target } from 'lucide-react';
import Link from 'next/link';
import { ExamStatus } from '@proctorguard/database';

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

export default async function DashboardPage() {
  const exams = await getExams();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Exams</h1>
        <Button asChild>
          <Link href="/dashboard/exams/new">Create Exam</Link>
        </Button>
      </div>

      {exams.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No exams yet</CardTitle>
            <CardDescription>
              Get started by creating your first exam.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/exams/new">Create Your First Exam</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {exams.map((exam) => (
            <Link key={exam.id} href={`/dashboard/exams/${exam.id}`}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="line-clamp-1">{exam.title}</CardTitle>
                    <Badge variant={getStatusVariant(exam.status)}>
                      {exam.status}
                    </Badge>
                  </div>
                  {exam.department && (
                    <CardDescription>{exam.department.name}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="mr-2 h-4 w-4" />
                    {exam.scheduledStart
                      ? new Date(exam.scheduledStart).toLocaleDateString()
                      : 'Not scheduled'}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="mr-2 h-4 w-4" />
                    {exam._count.enrollments} enrolled
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="mr-2 h-4 w-4" />
                    {exam.duration} minutes
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Target className="mr-2 h-4 w-4" />
                    {exam.passingScore}% passing
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
