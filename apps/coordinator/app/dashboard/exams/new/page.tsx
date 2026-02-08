import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@proctorguard/ui';
import { AlertCircle } from 'lucide-react';
import { getApprovedQuestionBanks, getDepartments } from '../../../actions/exams';
import { ExamForm } from '../exam-form';

export default async function NewExamPage() {
  const [questionBanks, departments] = await Promise.all([
    getApprovedQuestionBanks(),
    getDepartments(),
  ]);

  // If no approved question banks, show a message
  if (questionBanks.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Create New Exam</CardTitle>
            <CardDescription>Configure a new exam for your organization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900">No Question Banks Available</h3>
                <p className="mt-1 text-sm text-yellow-800">
                  You need at least one approved question bank to create an exam. Please contact
                  your exam authors or organization administrator to create and approve question
                  banks.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render the form
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create New Exam</h1>
        <p className="text-muted-foreground mt-2">
          Configure a new exam by selecting a question bank and setting exam parameters.
        </p>
      </div>
      <ExamForm
        mode="create"
        questionBanks={questionBanks}
        departments={departments}
      />
    </div>
  );
}
