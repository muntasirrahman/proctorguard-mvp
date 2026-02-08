'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@proctorguard/ui';

interface EnrollmentListProps {
  examId: string;
  enrollments: any[];
}

export function EnrollmentList({ examId, enrollments }: EnrollmentListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Enrollments</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {enrollments.length} candidate(s) enrolled
        </p>
        {/* TODO: Implement enrollment list - Task 8 */}
      </CardContent>
    </Card>
  );
}
