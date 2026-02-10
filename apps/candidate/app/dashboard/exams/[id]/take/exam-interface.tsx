'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { Button } from '@proctorguard/ui';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ExamTimer } from './exam-timer';
import { QuestionDisplay } from './question-display';
import { QuestionPalette } from './question-palette';
import { saveAnswer, submitExam } from '@/app/actions/sessions';

type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';

type Question = {
  id: string;
  questionText: string;
  questionType: QuestionType;
  points: number;
  options: Array<{ id: string; optionText: string }>;
};

type Answer = {
  selectedOption?: string;
  textResponse?: string;
  isFlagged: boolean;
};

type ExamInterfaceProps = {
  session: {
    id: string;
    startedAt: Date;
    lastViewedQuestionIndex: number;
  };
  exam: {
    title: string;
    duration: number;
  };
  questions: Question[];
  existingAnswers: Array<{
    questionId: string;
    answer: Answer;
  }>;
};

export function ExamInterface({
  session,
  exam,
  questions,
  existingAnswers,
}: ExamInterfaceProps) {
  const router = useRouter();

  // Initialize state - start from last viewed question
  const [currentIndex, setCurrentIndex] = useState(session.lastViewedQuestionIndex);
  const [answers, setAnswers] = useState<Map<string, Answer>>(
    new Map(existingAnswers.map((a) => [a.questionId, a.answer]))
  );
  const [showReview, setShowReview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    score: number;
    passed: boolean;
    totalScore: number;
    maxScore: number;
  } | null>(null);

  const currentQuestion = questions[currentIndex];

  // Debounced auto-save (2 second delay)
  const debouncedSave = useDebouncedCallback(
    async (questionId: string, answerData: Answer, index: number) => {
      setIsSaving(true);
      try {
        await saveAnswer(session.id, questionId, {
          selectedOption: answerData.selectedOption,
          textResponse: answerData.textResponse,
          isFlagged: answerData.isFlagged,
          questionIndex: index,
        });
      } catch (error) {
        console.error('Failed to save answer:', error);
      } finally {
        setIsSaving(false);
      }
    },
    2000 // 2 second delay
  );

  // Handle answer change (for selected option or text response)
  const handleAnswerChange = useCallback(
    (data: { selectedOption?: string; textResponse?: string }) => {
      const questionId = currentQuestion.id;
      const currentAnswer = answers.get(questionId) || { isFlagged: false };
      const newAnswer = { ...currentAnswer, ...data };

      setAnswers(new Map(answers.set(questionId, newAnswer)));
      debouncedSave(questionId, newAnswer, currentIndex);
    },
    [currentQuestion, answers, currentIndex, debouncedSave]
  );

  // Handle flag change
  const handleFlagChange = useCallback(
    (isFlagged: boolean) => {
      const questionId = currentQuestion.id;
      const currentAnswer = answers.get(questionId) || {};
      const newAnswer = { ...currentAnswer, isFlagged };

      setAnswers(new Map(answers.set(questionId, newAnswer)));
      debouncedSave(questionId, newAnswer, currentIndex);
    },
    [currentQuestion, answers, currentIndex, debouncedSave]
  );

  // Navigation handlers
  const goToPrevious = () => setCurrentIndex(Math.max(0, currentIndex - 1));
  const goToNext = () => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1));
  const goToQuestion = (index: number) => setCurrentIndex(index);

  // Submit handler
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const result = await submitExam(session.id);

      if (result.success && result.score !== undefined) {
        setSubmissionResult({
          score: result.score,
          passed: result.passed,
          totalScore: result.totalScore,
          maxScore: result.maxScore,
        });

        // Show score for 2 seconds before redirecting
        setTimeout(() => {
          router.push('/dashboard/exams');
        }, 2000);
      } else {
        router.push('/dashboard/exams');
      }
    } catch (error) {
      console.error('Failed to submit exam:', error);
      setIsSubmitting(false);
      alert('Failed to submit exam. Please try again.');
    }
  };

  // Review screen placeholder (will be replaced in next task)
  if (showReview) {
    // Show submission result if available
    if (submissionResult) {
      return (
        <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              {submissionResult.passed ? (
                <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <div className="w-16 h-16 mx-auto bg-orange-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-orange-600"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              )}
            </div>
            <h2 className="text-2xl font-bold mb-2">Exam Submitted!</h2>
            <p className="text-gray-600 mb-6">
              {submissionResult.passed ? 'Congratulations, you passed!' : 'You did not pass this time.'}
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {submissionResult.score}%
              </div>
              <div className="text-sm text-gray-500">
                {submissionResult.totalScore} / {submissionResult.maxScore} points
              </div>
            </div>
            <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
          </div>
        </div>
      );
    }

    // Show loading state while submitting
    if (isSubmitting) {
      return (
        <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Scoring your exam...</h2>
            <p className="text-gray-600">Please wait while we calculate your results.</p>
          </div>
        </div>
      );
    }

    // Normal review screen
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Review & Submit</h2>
          <p className="text-gray-600 mb-6">
            Review screen will be implemented in the next task.
          </p>
          <div className="flex gap-4">
            <Button onClick={() => setShowReview(false)} variant="outline">
              Back to Exam
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              Submit Exam
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Main exam interface
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-4 px-4">
        {/* Header with Timer */}
        <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold">{exam.title}</h1>
          <div className="flex items-center gap-4">
            {isSaving && (
              <span className="text-sm text-gray-500 flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                Saving...
              </span>
            )}
            <ExamTimer
              startedAt={session.startedAt}
              durationMinutes={exam.duration}
              onTimeExpired={handleSubmit}
            />
          </div>
        </div>

        {/* Main Layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Question Display */}
          <div className="flex-1 space-y-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <QuestionDisplay
                question={currentQuestion}
                answer={answers.get(currentQuestion.id) || { isFlagged: false }}
                questionNumber={currentIndex + 1}
                totalQuestions={questions.length}
                onAnswerChange={handleAnswerChange}
                onFlagChange={handleFlagChange}
              />
            </div>

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <Button
                onClick={goToPrevious}
                disabled={currentIndex === 0}
                variant="outline"
                className="w-full sm:w-auto"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <Button
                onClick={() => router.push('/dashboard/exams')}
                variant="outline"
                className="w-full sm:w-auto order-last sm:order-none"
              >
                Exit (Save Progress)
              </Button>
              <Button
                onClick={goToNext}
                disabled={currentIndex === questions.length - 1}
                className="w-full sm:w-auto"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Right: Question Palette */}
          <div className="w-full lg:w-80 order-first lg:order-last">
            <div className="lg:sticky lg:top-4">
              <QuestionPalette
                questions={questions.map((q) => ({
                  id: q.id,
                  hasAnswer:
                    !!answers.get(q.id)?.selectedOption ||
                    !!answers.get(q.id)?.textResponse,
                  isFlagged: !!answers.get(q.id)?.isFlagged,
                }))}
                currentIndex={currentIndex}
                onQuestionClick={goToQuestion}
                onReviewClick={() => setShowReview(true)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
