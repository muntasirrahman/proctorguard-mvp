import { getExams } from '../../actions/exams/exams';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@proctorguard/ui';
import { Plus, Calendar, Users } from 'lucide-react';
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
        <div>
          <h1 className="text-2xl font-bold">Exams</h1>
          <p className="text-muted-foreground">Create and manage exams</p>
        </div>
        <Link href="/dashboard/exams/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Exam
          </Button>
        </Link>
      </div>

      {exams.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No exams yet</p>
            <Link href="/dashboard/exams/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Exam
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {exams.map((exam) => (
            <Link key={exam.id} href={`/dashboard/exams/${exam.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{exam.title}</CardTitle>
                    <Badge variant={getStatusVariant(exam.status)}>
                      {exam.status}
                    </Badge>
                  </div>
                  {exam.department && (
                    <p className="text-sm text-muted-foreground">{exam.department.name}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <Calendar className="mr-2 h-4 w-4" />
                      {exam.scheduledStart ? (
                        new Date(exam.scheduledStart).toLocaleDateString()
                      ) : (
                        'Not scheduled'
                      )}
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Users className="mr-2 h-4 w-4" />
                      {exam._count.enrollments} enrolled
                    </div>
                    <div className="text-muted-foreground">
                      Duration: {exam.duration} minutes
                    </div>
                    <div className="text-muted-foreground">
                      Pass: {exam.passingScore}%
                    </div>
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
