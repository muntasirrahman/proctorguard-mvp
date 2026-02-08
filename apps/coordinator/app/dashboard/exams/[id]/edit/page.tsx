import { redirect } from 'next/navigation';
import { getExamById, getApprovedQuestionBanks, getDepartments } from '../../../actions/exams';
import { ExamForm } from '../../exam-form';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditExamPage({ params }: PageProps) {
  const { id } = await params;

  // Load data in parallel
  const [exam, questionBanks, departments] = await Promise.all([
    getExamById(id),
    getApprovedQuestionBanks(),
    getDepartments(),
  ]);

  // Handle not found (getExamById throws error if not found, but this is defensive)
  if (!exam) {
    redirect('/dashboard/exams');
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
