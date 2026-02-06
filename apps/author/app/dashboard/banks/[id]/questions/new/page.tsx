import { redirect } from 'next/navigation';
import { auth } from '@proctorguard/auth';
import { headers } from 'next/headers';
import { prisma } from '@proctorguard/database';
import { hasPermission, Permission } from '@proctorguard/permissions';
import { QuestionForm } from '@/app/components/question-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@proctorguard/ui';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function NewQuestionPage({ params }: PageProps) {
  const { id: bankId } = await params;

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

  // Verify user can create questions
  const canCreate = await hasPermission(
    { userId: session.user.id, organizationId: membership.organizationId },
    Permission.CREATE_QUESTION
  );

  if (!canCreate) {
    throw new Error('You do not have permission to create questions');
  }

  // Get the question bank to verify ownership and display info
  const bank = await prisma.questionBank.findUnique({
    where: { id: bankId }
  });

  if (!bank) {
    throw new Error('Question bank not found');
  }

  if (bank.authorId !== session.user.id) {
    throw new Error('Access denied: You can only add questions to your own banks');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Create New Question
        </h1>
        <p className="text-muted-foreground mt-2">
          Add a new question to <span className="font-semibold">{bank.title}</span>
        </p>
      </div>

      <QuestionForm bankId={bankId} />
    </div>
  );
}
