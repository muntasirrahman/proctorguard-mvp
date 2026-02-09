'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@proctorguard/ui';
import { AlertCircle, CheckCircle2, Flag, ArrowLeft } from 'lucide-react';

type ReviewScreenProps = {
  exam: {
    title: string;
    duration: number;
  };
  questions: Array<{
    id: string;
    questionText: string;
    questionType: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
    points: number;
    options?: Array<{ id: string; optionText: string }>;
  }>;
  answers: Map<
    string,
    {
      selectedOption?: string;
      textResponse?: string;
      isFlagged?: boolean;
    }
  >;
  onBack: () => void;
  onSubmit: () => void;
};

export function ReviewScreen({
  exam,
  questions,
  answers,
  onBack,
  onSubmit,
}: ReviewScreenProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Calculate statistics
  const answeredCount = questions.filter((q) => {
    const answer = answers.get(q.id);
    return answer?.selectedOption || answer?.textResponse;
  }).length;
  const unansweredCount = questions.length - answeredCount;
  const flaggedCount = questions.filter((q) => answers.get(q.id)?.isFlagged)
    .length;

  // Get answer preview text
  const getAnswerPreview = (question: {
    id: string;
    questionType: string;
    options?: Array<{ id: string; optionText: string }>;
  }) => {
    const answer = answers.get(question.id);
    if (!answer) return 'Not answered';

    if (answer.selectedOption) {
      // For MC/TF: show selected option text
      if (question.questionType === 'true_false') {
        return answer.selectedOption === 'true' ? 'True' : 'False';
      }
      const option = question.options?.find(
        (o) => o.id === answer.selectedOption
      );
      return option ? option.optionText : answer.selectedOption;
    }

    if (answer.textResponse) {
      // For text responses: show truncated
      return answer.textResponse.length > 100
        ? answer.textResponse.substring(0, 100) + '...'
        : answer.textResponse;
    }

    return 'Not answered';
  };

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <Card>
        <CardHeader>
          <CardTitle>Review Your Exam</CardTitle>
          <p className="text-sm text-gray-600">{exam.title}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Statistics */}
          <div className="flex gap-4">
            <Badge variant="default" className="bg-blue-100 text-blue-800">
              {questions.length} Total Questions
            </Badge>
            <Badge variant="default" className="bg-green-100 text-green-800">
              {answeredCount} Answered
            </Badge>
            {unansweredCount > 0 && (
              <Badge variant="destructive">
                {unansweredCount} Unanswered
              </Badge>
            )}
            {flaggedCount > 0 && (
              <Badge variant="default" className="bg-orange-100 text-orange-800">
                {flaggedCount} Flagged
              </Badge>
            )}
          </div>

          {/* Warning for unanswered */}
          {unansweredCount > 0 && (
            <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-900">
                  You have {unansweredCount} unanswered question
                  {unansweredCount > 1 ? 's' : ''}
                </p>
                <p className="text-sm text-yellow-800">
                  Review the questions below before submitting.
                </p>
              </div>
            </div>
          )}

          {/* Question List */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {questions.map((question, index) => {
              const answer = answers.get(question.id);
              const isAnswered = !!(
                answer?.selectedOption || answer?.textResponse
              );
              const isFlagged = !!answer?.isFlagged;

              return (
                <Card
                  key={question.id}
                  className="border-l-4"
                  style={{
                    borderLeftColor: !isAnswered
                      ? '#ef4444'
                      : isFlagged
                        ? '#f97316'
                        : '#10b981',
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold">
                            Question {index + 1}
                          </span>
                          {isAnswered ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                          {isFlagged && (
                            <Flag className="h-4 w-4 text-orange-600" />
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mb-2">
                          {question.questionText.length > 150
                            ? question.questionText.substring(0, 150) + '...'
                            : question.questionText}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Your answer:</strong>{' '}
                          {getAnswerPreview(question)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          onBack();
                          // Note: parent component should handle jumping to this question
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t">
            <Button onClick={onBack} variant="outline" size="lg">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Exam
            </Button>
            <Button onClick={() => setShowConfirmation(true)} size="lg">
              Submit Exam
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Exam?</DialogTitle>
            <DialogDescription>
              Are you sure you want to submit your exam? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          {unansweredCount > 0 && (
            <div className="py-4">
              <p className="text-sm text-yellow-800 font-semibold">
                You have {unansweredCount} unanswered question
                {unansweredCount > 1 ? 's' : ''}.
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Unanswered questions will receive zero points.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => setShowConfirmation(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button onClick={onSubmit}>Confirm Submission</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
