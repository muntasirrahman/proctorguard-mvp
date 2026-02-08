'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExamStatus } from '@proctorguard/database';
import { updateExamStatus, deleteExam } from '../../../actions/exams';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@proctorguard/ui';
import { MoreVertical, Calendar, Play, CheckCircle, Trash2 } from 'lucide-react';

interface ExamActionsProps {
  examId: string;
  currentStatus: ExamStatus;
}

export function ExamActions({ examId, currentStatus }: ExamActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSchedule = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await updateExamStatus(examId, ExamStatus.SCHEDULED);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule exam');
      console.error('Failed to schedule exam:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await updateExamStatus(examId, ExamStatus.ACTIVE);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate exam');
      console.error('Failed to activate exam:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await updateExamStatus(examId, ExamStatus.COMPLETED);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete exam');
      console.error('Failed to complete exam:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await deleteExam(examId);
      // deleteExam redirects to /dashboard/exams, so we don't need router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete exam');
      console.error('Failed to delete exam:', err);
      setIsLoading(false);
      setShowDeleteDialog(false);
    }
  };

  // Don't show menu if no actions are available
  if (
    currentStatus !== ExamStatus.DRAFT &&
    currentStatus !== ExamStatus.SCHEDULED &&
    currentStatus !== ExamStatus.ACTIVE
  ) {
    return null;
  }

  return (
    <>
      {error && (
        <div className="fixed top-4 right-4 z-50 max-w-md rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={isLoading}>
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {currentStatus === ExamStatus.DRAFT && (
            <>
              <DropdownMenuItem onClick={handleSchedule} disabled={isLoading}>
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Exam
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                disabled={isLoading}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Exam
              </DropdownMenuItem>
            </>
          )}

          {currentStatus === ExamStatus.SCHEDULED && (
            <>
              <DropdownMenuItem onClick={handleActivate} disabled={isLoading}>
                <Play className="mr-2 h-4 w-4" />
                Activate Exam
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                disabled={isLoading}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Exam
              </DropdownMenuItem>
            </>
          )}

          {currentStatus === ExamStatus.ACTIVE && (
            <DropdownMenuItem onClick={handleComplete} disabled={isLoading}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Complete Exam
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the exam and all
              associated data, including enrollments and session records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isLoading ? 'Deleting...' : 'Delete Exam'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
