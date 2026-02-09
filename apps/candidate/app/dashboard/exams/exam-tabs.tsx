'use client';

import { useState } from 'react';
import { Button, Badge } from '@proctorguard/ui';

type Props = {
  pendingCount: number;
  enrolledCount: number;
  pendingInvitations: React.ReactNode;
  enrolledExams: React.ReactNode;
};

export function ExamTabs({
  pendingCount,
  enrolledCount,
  pendingInvitations,
  enrolledExams,
}: Props) {
  const [activeTab, setActiveTab] = useState<'pending' | 'enrolled'>('pending');

  return (
    <div className="space-y-4">
      <div className="border-b">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-3 px-1 border-b-2 transition-colors ${
              activeTab === 'pending'
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="flex items-center gap-2">
              Pending Invitations
              {pendingCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {pendingCount}
                </Badge>
              )}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('enrolled')}
            className={`pb-3 px-1 border-b-2 transition-colors ${
              activeTab === 'enrolled'
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="flex items-center gap-2">
              Enrolled Exams
              {enrolledCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {enrolledCount}
                </Badge>
              )}
            </span>
          </button>
        </div>
      </div>

      <div className="pt-4">
        {activeTab === 'pending' ? pendingInvitations : enrolledExams}
      </div>
    </div>
  );
}
