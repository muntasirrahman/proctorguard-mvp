'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QuestionStatus, Difficulty } from '@proctorguard/database';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  RadioGroup,
  RadioGroupItem
} from '@proctorguard/ui';
import { Loader2 } from 'lucide-react';
import { createQuestion, updateQuestion } from '../../actions/questions/questions';

interface QuestionFormProps {
  bankId: string;
  question?: {
    id: string;
    type: string;
    text: string;
    options: any;
    correctAnswer: any;
    explanation: string | null;
    difficulty: Difficulty;
    points: number;
    timeLimit: number | null;
    status: QuestionStatus;
    tags: string[];
  };
}

export function QuestionForm({ bankId, question }: QuestionFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [type, setType] = useState<'multiple_choice' | 'true_false' | 'essay'>(
    (question?.type as any) || 'multiple_choice'
  );
  const [text, setText] = useState(question?.text || '');
  const [difficulty, setDifficulty] = useState<Difficulty>(question?.difficulty || Difficulty.MEDIUM);
  const [points, setPoints] = useState(question?.points || 1);
  const [timeLimit, setTimeLimit] = useState(question?.timeLimit?.toString() || '');
  const [explanation, setExplanation] = useState(question?.explanation || '');
  const [status, setStatus] = useState<QuestionStatus>(question?.status || QuestionStatus.DRAFT);
  const [tags, setTags] = useState(question?.tags?.join(', ') || '');

  // MCQ options (5 options: A-E)
  const [optionA, setOptionA] = useState(
    question?.type === 'multiple_choice' ? (question.options as any)?.A || '' : ''
  );
  const [optionB, setOptionB] = useState(
    question?.type === 'multiple_choice' ? (question.options as any)?.B || '' : ''
  );
  const [optionC, setOptionC] = useState(
    question?.type === 'multiple_choice' ? (question.options as any)?.C || '' : ''
  );
  const [optionD, setOptionD] = useState(
    question?.type === 'multiple_choice' ? (question.options as any)?.D || '' : ''
  );
  const [optionE, setOptionE] = useState(
    question?.type === 'multiple_choice' ? (question.options as any)?.E || '' : ''
  );
  const [mcqCorrectAnswer, setMcqCorrectAnswer] = useState<string>(
    question?.type === 'multiple_choice' ? (question.correctAnswer as string) || 'A' : 'A'
  );

  // True/False correct answer
  const [tfCorrectAnswer, setTfCorrectAnswer] = useState<'true' | 'false'>(
    question?.type === 'true_false'
      ? (question.correctAnswer as boolean)
        ? 'true'
        : 'false'
      : 'true'
  );

  const validateForm = () => {
    if (!text.trim()) {
      setError('Question text is required');
      return false;
    }

    if (points < 1) {
      setError('Points must be at least 1');
      return false;
    }

    if (type === 'multiple_choice') {
      if (!optionA.trim() || !optionB.trim() || !optionC.trim() || !optionD.trim() || !optionE.trim()) {
        setError('All 5 options (A-E) are required for multiple choice questions');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (saveAndClose: boolean = false) => {
    setError(null);
    setSuccessMessage(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const data = {
        type,
        text,
        difficulty,
        points,
        timeLimit: timeLimit ? parseInt(timeLimit) : null,
        explanation: explanation || null,
        status,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        ...(type === 'multiple_choice' && {
          options: { A: optionA, B: optionB, C: optionC, D: optionD, E: optionE },
          correctAnswer: mcqCorrectAnswer
        }),
        ...(type === 'true_false' && {
          correctAnswer: tfCorrectAnswer === 'true'
        })
      };

      if (question) {
        await updateQuestion(question.id, data);
        setSuccessMessage('Question updated successfully');
      } else {
        await createQuestion(bankId, data);
        setSuccessMessage('Question created successfully');
      }

      router.refresh();

      if (saveAndClose) {
        router.push(`/dashboard/questions/${bankId}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save question');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="rounded-md bg-green-50 border border-green-200 p-4">
          <p className="text-sm text-green-800">{successMessage}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Question Type</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={type} onValueChange={(value: any) => setType(value)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="multiple_choice" id="type-mcq" />
              <Label htmlFor="type-mcq">Multiple Choice (5 options)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true_false" id="type-tf" />
              <Label htmlFor="type-tf">True/False</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="essay" id="type-essay" />
              <Label htmlFor="type-essay">Essay</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Question Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="text">Question Text</Label>
            <Textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter the question text"
              className="min-h-[120px]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select value={difficulty} onValueChange={(value: Difficulty) => setDifficulty(value)}>
                <SelectTrigger id="difficulty">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Difficulty.EASY}>Easy</SelectItem>
                  <SelectItem value={Difficulty.MEDIUM}>Medium</SelectItem>
                  <SelectItem value={Difficulty.HARD}>Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="points">Points</Label>
              <Input
                id="points"
                type="number"
                value={points}
                onChange={(e) => setPoints(parseInt(e.target.value) || 1)}
                min={1}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="timeLimit">Time Limit (seconds)</Label>
              <Input
                id="timeLimit"
                type="number"
                value={timeLimit}
                onChange={(e) => setTimeLimit(e.target.value)}
                placeholder="Optional"
                min={0}
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value: QuestionStatus) => setStatus(value)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={QuestionStatus.DRAFT}>Draft</SelectItem>
                  <SelectItem value={QuestionStatus.IN_REVIEW}>In Review</SelectItem>
                  <SelectItem value={QuestionStatus.APPROVED}>Approved</SelectItem>
                  <SelectItem value={QuestionStatus.REJECTED}>Rejected</SelectItem>
                  <SelectItem value={QuestionStatus.ARCHIVED}>Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="explanation">Explanation (optional)</Label>
            <Textarea
              id="explanation"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Provide an explanation for the correct answer"
              className="min-h-[100px]"
            />
          </div>

          <div>
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., algebra, geometry, calculus"
            />
          </div>
        </CardContent>
      </Card>

      {type === 'multiple_choice' && (
        <Card>
          <CardHeader>
            <CardTitle>Answer Options (A-E)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="optionA">Option A</Label>
              <Input
                id="optionA"
                value={optionA}
                onChange={(e) => setOptionA(e.target.value)}
                placeholder="Enter option A"
                required
              />
            </div>

            <div>
              <Label htmlFor="optionB">Option B</Label>
              <Input
                id="optionB"
                value={optionB}
                onChange={(e) => setOptionB(e.target.value)}
                placeholder="Enter option B"
                required
              />
            </div>

            <div>
              <Label htmlFor="optionC">Option C</Label>
              <Input
                id="optionC"
                value={optionC}
                onChange={(e) => setOptionC(e.target.value)}
                placeholder="Enter option C"
                required
              />
            </div>

            <div>
              <Label htmlFor="optionD">Option D</Label>
              <Input
                id="optionD"
                value={optionD}
                onChange={(e) => setOptionD(e.target.value)}
                placeholder="Enter option D"
                required
              />
            </div>

            <div>
              <Label htmlFor="optionE">Option E</Label>
              <Input
                id="optionE"
                value={optionE}
                onChange={(e) => setOptionE(e.target.value)}
                placeholder="Enter option E"
                required
              />
            </div>

            <div>
              <Label>Correct Answer</Label>
              <RadioGroup value={mcqCorrectAnswer} onValueChange={setMcqCorrectAnswer}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="A" id="correct-a" />
                  <Label htmlFor="correct-a">A</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="B" id="correct-b" />
                  <Label htmlFor="correct-b">B</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="C" id="correct-c" />
                  <Label htmlFor="correct-c">C</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="D" id="correct-d" />
                  <Label htmlFor="correct-d">D</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="E" id="correct-e" />
                  <Label htmlFor="correct-e">E</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>
      )}

      {type === 'true_false' && (
        <Card>
          <CardHeader>
            <CardTitle>Correct Answer</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={tfCorrectAnswer} onValueChange={(value: any) => setTfCorrectAnswer(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id="correct-true" />
                <Label htmlFor="correct-true">True</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="correct-false" />
                <Label htmlFor="correct-false">False</Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-4">
        <Button
          onClick={() => handleSubmit(false)}
          disabled={isLoading}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save
        </Button>
        <Button
          onClick={() => handleSubmit(true)}
          disabled={isLoading}
          variant="outline"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save & Close
        </Button>
        <Button
          onClick={() => router.push(`/dashboard/questions/${bankId}`)}
          disabled={isLoading}
          variant="outline"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
