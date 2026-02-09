'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@proctorguard/ui';
import { Trash2, Play, StopCircle } from 'lucide-react';
import { ExamStatus } from '@proctorguard/database';
import { updateExamStatus, deleteExam } from '../../../actions/exams/exams';

type ExamActionsProps = {
  examId: string;
  status: ExamStatus;
};

export function ExamActions({ examId, status }: ExamActionsProps) {
  const router = useRouter();
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
    if (!confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
      return;
    }

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
    <div className="flex gap-2">
      {canSchedule && (
        <Button onClick={() => handleStatusChange(ExamStatus.SCHEDULED)} size="sm">
          <Play className="mr-2 h-4 w-4" />
          Schedule
        </Button>
      )}
      {canActivate && (
        <Button onClick={() => handleStatusChange(ExamStatus.ACTIVE)} size="sm">
          <Play className="mr-2 h-4 w-4" />
          Activate
        </Button>
      )}
      {canComplete && (
        <Button onClick={() => handleStatusChange(ExamStatus.COMPLETED)} size="sm">
          <StopCircle className="mr-2 h-4 w-4" />
          Complete
        </Button>
      )}
      {canDelete && (
        <Button
          onClick={handleDelete}
          disabled={isDeleting}
          variant="outline"
          size="sm"
          className="text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      )}
    </div>
  );
}
