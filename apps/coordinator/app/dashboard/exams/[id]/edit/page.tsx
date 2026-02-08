import { getExamById, getApprovedQuestionBanks, getDepartments } from '../../../actions/exams';
import { ExamForm } from '../../exam-form';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditExamPage({ params }: PageProps) {
  const { id } = await params;

  const [exam, questionBanks, departments] = await Promise.all([
    getExamById(id),
    getApprovedQuestionBanks(),
    getDepartments(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Exam</h1>
        <p className="text-muted-foreground">{exam.title}</p>
      </div>

      <ExamForm
        questionBanks={questionBanks}
        departments={departments}
        initialData={{
          id: exam.id,
          title: exam.title,
          description: exam.description || undefined,
          departmentId: exam.departmentId || undefined,
          questionBankId: exam.questionBankId,
          duration: exam.duration,
          passingScore: exam.passingScore,
          allowedAttempts: exam.allowedAttempts,
          scheduledStart: exam.scheduledStart || undefined,
          scheduledEnd: exam.scheduledEnd || undefined,
          enableRecording: exam.enableRecording,
        }}
        mode="edit"
      />
    </div>
  );
}
