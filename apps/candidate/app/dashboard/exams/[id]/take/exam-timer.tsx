'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { Card, CardContent } from '@proctorguard/ui';

type ExamTimerProps = {
  startedAt: Date;
  durationMinutes: number;
  onTimeExpired: () => void;
};

export function ExamTimer({ startedAt, durationMinutes, onTimeExpired }: ExamTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [hasExpired, setHasExpired] = useState(false);

  useEffect(() => {
    // Calculate end time
    const endTime = new Date(startedAt);
    endTime.setMinutes(endTime.getMinutes() + durationMinutes);

    // Initial calculation
    const now = new Date();
    const initialRemaining = Math.max(0, endTime.getTime() - now.getTime());
    setTimeRemaining(initialRemaining);

    // If already expired, trigger callback immediately
    if (initialRemaining <= 0 && !hasExpired) {
      setHasExpired(true);
      onTimeExpired();
      return;
    }

    // Update every second
    const interval = setInterval(() => {
      const now = new Date();
      const remaining = Math.max(0, endTime.getTime() - now.getTime());
      setTimeRemaining(remaining);

      if (remaining <= 0 && !hasExpired) {
        setHasExpired(true);
        clearInterval(interval);
        onTimeExpired();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt, durationMinutes, onTimeExpired, hasExpired]);

  // Convert milliseconds to minutes:seconds
  const totalSeconds = Math.floor(timeRemaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  // Determine color and warning message
  let colorClass = 'text-gray-700';
  let warningMessage = '';

  if (minutes <= 1) {
    colorClass = 'text-red-600';
    if (totalSeconds > 0) {
      warningMessage = '1 minute remaining!!';
    }
  } else if (minutes <= 5) {
    colorClass = 'text-orange-600';
    warningMessage = '5 minutes remaining!';
  } else if (minutes <= 10) {
    colorClass = 'text-yellow-600';
    warningMessage = '10 minutes remaining';
  }

  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <Clock className={`h-6 w-6 ${colorClass}`} />
        <div>
          <div className={`text-3xl font-mono font-bold ${colorClass}`}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          {warningMessage && (
            <p className={`text-sm ${colorClass}`}>{warningMessage}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
