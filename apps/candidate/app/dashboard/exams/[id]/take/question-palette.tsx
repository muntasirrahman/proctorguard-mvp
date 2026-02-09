'use client';

import { useState } from 'react';
import { CheckCircle2, Circle, Flag } from 'lucide-react';
import { Button } from '@proctorguard/ui';

type QuestionStatus = 'answered' | 'unanswered' | 'current';

type Question = {
  id: string;
  hasAnswer: boolean;
  isFlagged: boolean;
};

type QuestionPaletteProps = {
  questions: Question[];
  currentIndex: number;
  onQuestionClick: (index: number) => void;
  onReviewClick: () => void;
};

export function QuestionPalette({
  questions,
  currentIndex,
  onQuestionClick,
  onReviewClick,
}: QuestionPaletteProps) {
  const [filter, setFilter] = useState<'all' | 'unanswered' | 'flagged'>('all');

  const answeredCount = questions.filter((q) => q.hasAnswer).length;
  const unansweredCount = questions.length - answeredCount;
  const flaggedCount = questions.filter((q) => q.isFlagged).length;

  const filteredIndices = questions
    .map((q, i) => ({ question: q, index: i }))
    .filter(({ question }) => {
      if (filter === 'unanswered') return !question.hasAnswer;
      if (filter === 'flagged') return question.isFlagged;
      return true;
    })
    .map(({ index }) => index);

  return (
    <div className="h-full flex flex-col">
      {/* Filter */}
      <div className="p-4 border-b">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="all">All Questions</option>
          <option value="unanswered">Unanswered</option>
          <option value="flagged">Flagged</option>
        </select>
      </div>

      {/* Question Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-5 gap-2">
          {filteredIndices.map((index) => {
            const question = questions[index];
            const isCurrent = index === currentIndex;

            return (
              <button
                key={index}
                onClick={() => onQuestionClick(index)}
                className={`
                  relative p-2 border rounded-lg text-sm font-medium
                  ${isCurrent ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}
                  ${question.hasAnswer ? 'bg-green-50' : ''}
                  hover:bg-gray-100
                `}
              >
                {index + 1}
                {question.hasAnswer && (
                  <CheckCircle2 className="absolute top-0 right-0 h-3 w-3 text-green-600" />
                )}
                {question.isFlagged && (
                  <Flag className="absolute bottom-0 right-0 h-3 w-3 text-orange-600" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Status Summary */}
      <div className="p-4 border-t space-y-1 text-sm">
        <p className="text-green-600">{answeredCount} answered</p>
        <p className="text-gray-600">{unansweredCount} unanswered</p>
        {flaggedCount > 0 && (
          <p className="text-orange-600">{flaggedCount} flagged</p>
        )}
      </div>

      {/* Review Button */}
      <div className="p-4 border-t">
        <Button onClick={onReviewClick} className="w-full">
          Review & Submit
        </Button>
      </div>
    </div>
  );
}
