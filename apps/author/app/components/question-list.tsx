'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge
} from '@proctorguard/ui';
import { QuestionStatus, Difficulty } from '@proctorguard/database';
import { deleteQuestion } from '../actions/questions';

interface Question {
  id: string;
  type: string;
  text: string;
  difficulty: Difficulty;
  points: number;
  status: QuestionStatus;
}

interface Bank {
  id: string;
  title: string;
  description: string | null;
  status: string;
  questionCount: number;
}

interface QuestionListProps {
  bank: Bank;
  questions: Question[];
}

export function QuestionList({ bank, questions }: QuestionListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (questionId: string) => {
    // TODO: Replace browser confirm/alert with inline error handling (Dialog + toast) for consistency
    if (!confirm('Are you sure you want to delete this question?')) return;

    setDeletingId(questionId);
    try {
      await deleteQuestion(questionId);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete question');
    } finally {
      setDeletingId(null);
    }
  };

  const getTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      multiple_choice: 'Multiple Choice',
      true_false: 'True/False',
      essay: 'Essay'
    };
    return <Badge variant="outline">{labels[type] || type}</Badge>;
  };

  const getDifficultyBadge = (difficulty: Difficulty) => {
    const colors: Record<Difficulty, string> = {
      [Difficulty.EASY]: 'bg-green-100 text-green-800',
      [Difficulty.MEDIUM]: 'bg-yellow-100 text-yellow-800',
      [Difficulty.HARD]: 'bg-red-100 text-red-800'
    };
    return (
      <Badge className={colors[difficulty]}>
        {difficulty}
      </Badge>
    );
  };

  const getStatusBadge = (status: QuestionStatus) => {
    const colors: Record<QuestionStatus, string> = {
      [QuestionStatus.DRAFT]: 'bg-gray-100 text-gray-800',
      [QuestionStatus.IN_REVIEW]: 'bg-yellow-100 text-yellow-800',
      [QuestionStatus.APPROVED]: 'bg-green-100 text-green-800',
      [QuestionStatus.REJECTED]: 'bg-red-100 text-red-800',
      [QuestionStatus.ARCHIVED]: 'bg-gray-100 text-gray-600'
    };
    return (
      <Badge className={colors[status]}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">&larr; Back</Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold">{bank.title}</h1>
          {bank.description && (
            <p className="text-muted-foreground mt-2">{bank.description}</p>
          )}
        </div>
        <Link href={`/dashboard/banks/${bank.id}/questions/new`}>
          <Button>Create Question</Button>
        </Link>
      </div>

      <Card className="p-4">
        {questions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg font-medium mb-2">No questions yet</p>
            <p className="text-sm">Create your first question to get started</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Question</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.map(question => (
                <TableRow key={question.id}>
                  <TableCell>{getTypeBadge(question.type)}</TableCell>
                  <TableCell className="max-w-md truncate">
                    {question.text}
                  </TableCell>
                  <TableCell>{getDifficultyBadge(question.difficulty)}</TableCell>
                  <TableCell>{question.points}</TableCell>
                  <TableCell>{getStatusBadge(question.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Link href={`/dashboard/banks/${bank.id}/questions/${question.id}`}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(question.id)}
                        disabled={deletingId === question.id}
                      >
                        {deletingId === question.id ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
