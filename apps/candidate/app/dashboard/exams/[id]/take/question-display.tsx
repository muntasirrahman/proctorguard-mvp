'use client';

type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';

type QuestionDisplayProps = {
  question: {
    id: string;
    questionText: string;
    questionType: QuestionType;
    points: number;
    options: Array<{ id: string; optionText: string }>;
  };
  answer: {
    selectedOption?: string;
    textResponse?: string;
    isFlagged: boolean;
  };
  questionNumber: number;
  totalQuestions: number;
  onAnswerChange: (data: {
    selectedOption?: string;
    textResponse?: string;
  }) => void;
  onFlagChange: (isFlagged: boolean) => void;
};

export function QuestionDisplay({
  question,
  answer,
  questionNumber,
  totalQuestions,
  onAnswerChange,
  onFlagChange,
}: QuestionDisplayProps) {
  return (
    <div className="space-y-6">
      {/* Question Header */}
      <div className="border-b pb-4">
        <p className="text-sm text-gray-600">
          Question {questionNumber} of {totalQuestions} • Worth {question.points}{' '}
          {question.points === 1 ? 'point' : 'points'}
        </p>
      </div>

      {/* Question Text */}
      <div className="prose max-w-none">
        <p className="text-lg">{question.questionText}</p>
      </div>

      {/* Answer Input by Type */}
      <div className="space-y-3">
        {question.questionType === 'multiple_choice' && (
          <div className="space-y-2">
            {question.options.map((option) => (
              <label
                key={option.id}
                className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option.id}
                  checked={answer.selectedOption === option.id}
                  onChange={(e) =>
                    onAnswerChange({ selectedOption: e.target.value })
                  }
                  className="mt-1"
                />
                <span>{option.optionText}</span>
              </label>
            ))}
          </div>
        )}

        {question.questionType === 'true_false' && (
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name={`question-${question.id}`}
                value="true"
                checked={answer.selectedOption === 'true'}
                onChange={(e) =>
                  onAnswerChange({ selectedOption: e.target.value })
                }
              />
              <span>True</span>
            </label>
            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name={`question-${question.id}`}
                value="false"
                checked={answer.selectedOption === 'false'}
                onChange={(e) =>
                  onAnswerChange({ selectedOption: e.target.value })
                }
              />
              <span>False</span>
            </label>
          </div>
        )}

        {question.questionType === 'short_answer' && (
          <div>
            <input
              type="text"
              value={answer.textResponse || ''}
              onChange={(e) => onAnswerChange({ textResponse: e.target.value })}
              placeholder="Enter your answer..."
              maxLength={500}
              className="w-full px-4 py-2 border rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">
              {(answer.textResponse || '').length} / 500 characters
            </p>
          </div>
        )}

        {question.questionType === 'essay' && (
          <div>
            <textarea
              value={answer.textResponse || ''}
              onChange={(e) => onAnswerChange({ textResponse: e.target.value })}
              placeholder="Enter your answer..."
              maxLength={5000}
              rows={8}
              className="w-full px-4 py-2 border rounded-lg resize-y"
            />
            <p className="text-xs text-gray-500 mt-1">
              {(answer.textResponse || '').length} / 5000 characters
            </p>
          </div>
        )}
      </div>

      {/* Flag for Review */}
      <div className="pt-4 border-t">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={answer.isFlagged}
            onChange={(e) => onFlagChange(e.target.checked)}
            className="h-4 w-4"
          />
          <span className="text-sm">Flag for Review</span>
        </label>
      </div>
    </div>
  );
}
