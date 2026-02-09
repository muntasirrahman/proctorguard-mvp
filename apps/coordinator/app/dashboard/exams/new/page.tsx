import { getApprovedQuestionBanks, getDepartments } from '../../../actions/exams';
import { ExamForm } from '../exam-form';

export default async function NewExamPage() {
  const [questionBanks, departments] = await Promise.all([
    getApprovedQuestionBanks(),
    getDepartments(),
  ]);

  if (questionBanks.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Create Exam</h1>
          <p className="text-muted-foreground">Set up a new exam</p>
        </div>

        <div className="bg-muted/50 border border-border rounded-lg p-8 text-center">
          <p className="text-muted-foreground mb-2">No approved question banks available</p>
          <p className="text-sm text-muted-foreground">
            You need at least one approved question bank to create an exam.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create Exam</h1>
        <p className="text-muted-foreground">Set up a new exam</p>
      </div>

      <ExamForm questionBanks={questionBanks} departments={departments} mode="create" />
    </div>
  );
}
