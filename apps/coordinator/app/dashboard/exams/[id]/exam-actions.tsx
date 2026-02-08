'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { MoreVertical, Trash2, Play, StopCircle } from 'lucide-react';
import { ExamStatus } from '@proctorguard/database';
import { updateExamStatus, deleteExam } from '../../actions/exams';

type ExamActionsProps = {
  examId: string;
  status: ExamStatus;
};

export function ExamActions({ examId, status }: ExamActionsProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleStatusChange = async (newStatus: ExamStatus) => {
    try {
      await updateExamStatus(examId, newStatus);
      router.refresh();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteExam(examId);
      // Redirect handled by server action
    } catch (error) {
      console.error('Failed to delete exam:', error);
      setIsDeleting(false);
    }
  };

  const canSchedule = status === ExamStatus.DRAFT;
  const canActivate = status === ExamStatus.SCHEDULED;
  const canComplete = status === ExamStatus.ACTIVE;
  const canDelete = status === ExamStatus.DRAFT;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canSchedule && (
            <DropdownMenuItem onClick={() => handleStatusChange(ExamStatus.SCHEDULED)}>
              <Play className="mr-2 h-4 w-4" />
              Schedule Exam
            </DropdownMenuItem>
          )}
          {canActivate && (
            <DropdownMenuItem onClick={() => handleStatusChange(ExamStatus.ACTIVE)}>
              <Play className="mr-2 h-4 w-4" />
              Activate Exam
            </DropdownMenuItem>
          )}
          {canComplete && (
            <DropdownMenuItem onClick={() => handleStatusChange(ExamStatus.COMPLETED)}>
              <StopCircle className="mr-2 h-4 w-4" />
              Complete Exam
            </DropdownMenuItem>
          )}
          {canDelete && (
            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Exam
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exam?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the exam.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
