'use client';

import { useState, useCallback } from 'react';
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
  onSubmit: () => void;
  onExit: () => void;
};

export function ExamInterface({
  session,
  exam,
  questions,
  existingAnswers,
  onSubmit,
  onExit,
}: ExamInterfaceProps) {
  // Initialize state - start from last viewed question
  const [currentIndex, setCurrentIndex] = useState(session.lastViewedQuestionIndex);
  const [answers, setAnswers] = useState<Map<string, Answer>>(
    new Map(existingAnswers.map((a) => [a.questionId, a.answer]))
  );
  const [showReview, setShowReview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
    try {
      await submitExam(session.id);
      onSubmit();
    } catch (error) {
      console.error('Failed to submit exam:', error);
      alert('Failed to submit exam. Please try again.');
    }
  };

  // Review screen placeholder (will be replaced in next task)
  if (showReview) {
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
            <Button onClick={handleSubmit}>Submit Exam</Button>
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
                onClick={onExit}
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
