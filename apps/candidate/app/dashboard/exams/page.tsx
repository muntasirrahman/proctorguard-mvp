import { getPendingInvitations, getEnrolledExams } from '../../actions/enrollments';
import { PendingInvitations } from './pending-invitations';
import { EnrolledExams } from './enrolled-exams';
import { ExamTabs } from './exam-tabs';

export default async function ExamsPage() {
  const [pending, enrolled] = await Promise.all([
    getPendingInvitations(),
    getEnrolledExams(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Exams</h1>
        <p className="text-muted-foreground mt-1">
          View pending invitations and enrolled exams
        </p>
      </div>

      <ExamTabs
        pendingCount={pending.length}
        enrolledCount={enrolled.length}
        pendingInvitations={<PendingInvitations invitations={pending} />}
        enrolledExams={<EnrolledExams exams={enrolled} />}
      />
    </div>
  );
}
