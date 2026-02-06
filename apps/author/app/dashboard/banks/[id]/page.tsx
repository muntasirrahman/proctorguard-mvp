import { auth } from '@proctorguard/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@proctorguard/database';
import { getQuestionBank } from '../../../actions/question-banks';
import { getQuestions } from '../../../actions/questions';
import { QuestionList } from '../../../components/question-list';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function QuestionBankPage({ params }: PageProps) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/auth/signin');

  // Get user's organization
  const membership = await prisma.organizationMember.findFirst({
    where: { userId: session.user.id },
    include: { organization: true }
  });

  if (!membership) {
    return <div className="p-8 text-center">No organization found</div>;
  }

  const { id } = await params;
  const bank = await getQuestionBank(id, membership.organizationId);
  const questions = await getQuestions(id);

  return <QuestionList bank={bank} questions={questions} />;
}
