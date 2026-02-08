import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getExamById, getApprovedQuestionBanks, getDepartments } from '../../../actions/exams';
import { ExamForm } from '../../exam-form';
import { ExamStatus } from '@proctorguard/database';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
} from '@proctorguard/ui';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditExamPage({ params }: PageProps) {
  const { id } = await params;

  // Load data in parallel with error handling
  let exam, questionBanks, departments;
  try {
    [exam, questionBanks, departments] = await Promise.all([
      getExamById(id),
      getApprovedQuestionBanks(),
      getDepartments(),
    ]);
  } catch (error) {
    // If exam not found or permission denied, redirect to exams list
    redirect('/dashboard/exams');
  }

  // Check if exam is in an editable status
  if (exam.status !== ExamStatus.DRAFT && exam.status !== ExamStatus.SCHEDULED) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Cannot Edit Exam</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This exam cannot be edited because it is {exam.status}. Only DRAFT and SCHEDULED
              exams can be modified.
            </p>
            <Button asChild className="mt-4">
              <Link href={`/dashboard/exams/${id}`}>Back to Exam</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Edit Exam</h1>
        <p className="text-muted-foreground mt-2">
          Update exam configuration and schedule
        </p>
      </div>

      <ExamForm
        mode="edit"
        initialData={exam}
        questionBanks={questionBanks}
        departments={departments}
      />
    </div>
  );
}
