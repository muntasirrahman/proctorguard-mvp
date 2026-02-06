import { redirect } from 'next/navigation';
import { auth } from '@proctorguard/auth';
import { headers } from 'next/headers';
import { prisma } from '@proctorguard/database';
import { hasPermission, Permission } from '@proctorguard/permissions';
import { QuestionForm } from '@/app/components/question-form';
import { getQuestion } from '@/app/actions/questions';

interface PageProps {
  params: Promise<{ id: string; qid: string }>;
}

export default async function EditQuestionPage({ params }: PageProps) {
  const { id: bankId, qid: questionId } = await params;

  // Check authentication
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect('/auth/signin');
  }

  // Get organization membership
  const membership = await prisma.organizationMember.findFirst({
    where: { userId: session.user.id },
    include: { organization: true }
  });

  if (!membership) {
    redirect('/auth/signin');
  }

  // Verify user can edit questions
  const canEdit = await hasPermission(
    { userId: session.user.id, organizationId: membership.organizationId },
    Permission.EDIT_QUESTION
  );

  if (!canEdit) {
    throw new Error('You do not have permission to edit questions');
  }

  // Get the question and verify ownership
  const question = await getQuestion(questionId);

  if (!question) {
    throw new Error('Question not found');
  }

  // Get the bank details for the header
  const bank = await prisma.questionBank.findUnique({
    where: { id: bankId }
  });

  if (!bank) {
    throw new Error('Question bank not found');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Edit Question
        </h1>
        <p className="text-muted-foreground mt-2">
          Update question in <span className="font-semibold">{bank.title}</span>
        </p>
      </div>

      <QuestionForm bankId={bankId} question={question} />
    </div>
  );
}
