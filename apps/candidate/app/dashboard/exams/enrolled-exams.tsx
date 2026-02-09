'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { startExam, resumeSession } from '../../actions/sessions';

type EnrolledExam = {
  id: string;
  approvedAt: Date | null;
  attemptsUsed: number;
  exam: {
    id: string;
    title: string;
    description: string | null;
    duration: number;
    scheduledStart: Date | null;
    scheduledEnd: Date | null;
    status: string;
    allowedAttempts: number;
    organization: {
      name: string;
    };
  };
  sessions: Array<{
    id: string;
    status: string;
    startedAt: Date | null;
    completedAt: Date | null;
    score: number | null;
    passed: boolean | null;
  }>;
};

type Props = {
  exams: EnrolledExam[];
};

type ExamState = 'IN_PROGRESS' | 'AVAILABLE' | 'UPCOMING' | 'COMPLETED';

function determineExamState(enrollment: EnrolledExam): ExamState {
  const { exam, sessions, attemptsUsed } = enrollment;
  const now = new Date();

  // Check for IN_PROGRESS session
  const latestSession = sessions[0];
  if (latestSession?.status === 'IN_PROGRESS') {
    // Check if expired
    if (exam.scheduledEnd && latestSession.startedAt) {
      const windowEnd = new Date(exam.scheduledEnd);
      const durationEnd = new Date(
        new Date(latestSession.startedAt).getTime() + exam.duration * 60 * 1000
      );
      const expiresAt = windowEnd < durationEnd ? windowEnd : durationEnd;

      if (now < expiresAt) {
        return 'IN_PROGRESS';
      }
    } else if (exam.scheduledEnd) {
      const windowEnd = new Date(exam.scheduledEnd);
      if (now < windowEnd) {
        return 'IN_PROGRESS';
      }
    } else {
      // No expiration if no schedule
      return 'IN_PROGRESS';
    }
  }

  // Check if within exam window and attempts available
  if (exam.scheduledStart && exam.scheduledEnd) {
    const start = new Date(exam.scheduledStart);
    const end = new Date(exam.scheduledEnd);

    if (now >= start && now <= end && attemptsUsed < exam.allowedAttempts) {
      return 'AVAILABLE';
    }

    if (now < start) {
      return 'UPCOMING';
    }
  }

  return 'COMPLETED';
}

function groupExamsByState(exams: EnrolledExam[]) {
  const groups = {
    inProgress: [] as EnrolledExam[],
    available: [] as EnrolledExam[],
    upcoming: [] as EnrolledExam[],
    completed: [] as EnrolledExam[],
  };

  exams.forEach((exam) => {
    const state = determineExamState(exam);
    switch (state) {
      case 'IN_PROGRESS':
        groups.inProgress.push(exam);
        break;
      case 'AVAILABLE':
        groups.available.push(exam);
        break;
      case 'UPCOMING':
        groups.upcoming.push(exam);
        break;
      case 'COMPLETED':
        groups.completed.push(exam);
        break;
    }
  });

  // Sort each group
  groups.inProgress.sort((a, b) => {
    const aSession = a.sessions[0];
    const bSession = b.sessions[0];
    if (!aSession?.startedAt || !bSession?.startedAt) return 0;
    return new Date(bSession.startedAt).getTime() - new Date(aSession.startedAt).getTime();
  });

  groups.available.sort((a, b) => {
    if (!a.exam.scheduledEnd || !b.exam.scheduledEnd) return 0;
    return new Date(a.exam.scheduledEnd).getTime() - new Date(b.exam.scheduledEnd).getTime();
  });

  groups.upcoming.sort((a, b) => {
    if (!a.exam.scheduledStart || !b.exam.scheduledStart) return 0;
    return new Date(a.exam.scheduledStart).getTime() - new Date(b.exam.scheduledStart).getTime();
  });

  groups.completed.sort((a, b) => {
    const aSession = a.sessions[0];
    const bSession = b.sessions[0];
    if (!aSession?.completedAt || !bSession?.completedAt) return 0;
    return new Date(bSession.completedAt).getTime() - new Date(aSession.completedAt).getTime();
  });

  return groups;
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  if (count === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">
        {title} ({count})
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        {children}
      </div>
    </div>
  );
}

export function EnrolledExams({ exams }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  // Group exams by state
  const { inProgress, available, upcoming, completed } = groupExamsByState(exams);

  const handleStart = async (enrollmentId: string) => {
    setLoading(enrollmentId);
    try {
      const result = await startExam(enrollmentId);
      if (result.success) {
        router.push(`/dashboard/exams/${enrollmentId}/take?session=${result.sessionId}`);
      } else {
        alert(result.error); // We'll use toast in next step
      }
    } catch (error) {
      console.error('Failed to start exam:', error);
      alert('Failed to start exam. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const handleResume = async (enrollmentId: string) => {
    setLoading(enrollmentId);
    try {
      const result = await resumeSession(enrollmentId);
      if (result.success) {
        router.push(`/dashboard/exams/${enrollmentId}/take?session=${result.sessionId}`);
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Failed to resume session:', error);
      alert('Failed to resume session. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* In Progress Section */}
      <Section title="Active Session" count={inProgress.length}>
        {inProgress.map((enrollment) => (
          <div key={enrollment.id} className="p-4 border-l-4 border-green-500 bg-white rounded-lg shadow">
            <p>Placeholder for IN_PROGRESS card - Task 6</p>
          </div>
        ))}
      </Section>

      {/* Available Section */}
      <Section title="Available Now" count={available.length}>
        {available.map((enrollment) => (
          <div key={enrollment.id} className="p-4 border-l-4 border-blue-500 bg-white rounded-lg shadow">
            <p>Placeholder for AVAILABLE card - Task 6</p>
          </div>
        ))}
      </Section>

      {/* Upcoming Section */}
      <Section title="Upcoming" count={upcoming.length}>
        {upcoming.map((enrollment) => (
          <div key={enrollment.id} className="p-4 border-l-4 border-gray-300 bg-white rounded-lg shadow">
            <p>Placeholder for UPCOMING card - Task 6</p>
          </div>
        ))}
      </Section>

      {/* Completed Section */}
      <Section title="Past Exams" count={completed.length}>
        {completed.map((enrollment) => (
          <div key={enrollment.id} className="p-4 bg-white rounded-lg shadow">
            <p>Placeholder for COMPLETED card - Task 6</p>
          </div>
        ))}
      </Section>

      {/* Empty State */}
      {inProgress.length === 0 &&
        available.length === 0 &&
        upcoming.length === 0 &&
        completed.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No enrolled exams yet.</p>
            <p className="text-sm text-gray-400 mt-2">
              Check the "Pending Invitations" tab to accept exam invitations.
            </p>
          </div>
        )}
    </div>
  );
}
