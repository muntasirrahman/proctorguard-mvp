import { auth } from '@proctorguard/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@proctorguard/database';
import { requirePermission, Permission } from '@proctorguard/permissions';
import { getQuestionBanks } from '../../actions/questions/questionBanks';
import { QuestionBankList } from '../../components/questions/question-bank-list';

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/auth/signin');

  // Get user's organization
  const userRole = await prisma.userRole.findFirst({
    where: { userId: session.user.id },
    select: { organizationId: true },
  });

  if (!userRole) {
    return <div className="p-8 text-center">No organization found</div>;
  }

  // Validate user has permission to view questions
  await requirePermission(
    { userId: session.user.id, organizationId: userRole.organizationId },
    Permission.VIEW_QUESTION
  );

  const banks = await getQuestionBanks(userRole.organizationId);

  return <QuestionBankList banks={banks} organizationId={userRole.organizationId} />;
}
