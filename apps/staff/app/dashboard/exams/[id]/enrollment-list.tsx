'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Input,
  Label,
  Textarea,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@proctorguard/ui';
import { Plus, UserPlus, Check, X, Trash2 } from 'lucide-react';
import { EnrollmentStatus } from '@proctorguard/database';
import {
  inviteCandidate,
  bulkInviteCandidates,
  approveEnrollment,
  rejectEnrollment,
  removeEnrollment,
} from '../../../actions/exams/enrollments';

type Enrollment = {
  id: string;
  status: EnrollmentStatus;
  invitedAt: Date;
  candidate: {
    id: string;
    name: string | null;
    email: string;
  };
};

type EnrollmentListProps = {
  examId: string;
  enrollments: Enrollment[];
};

function getStatusVariant(
  status: EnrollmentStatus
): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (status) {
    case EnrollmentStatus.PENDING:
      return 'outline';
    case EnrollmentStatus.APPROVED:
      return 'default';
    case EnrollmentStatus.REJECTED:
      return 'destructive';
    default:
      return 'secondary';
  }
}

export function EnrollmentList({ examId, enrollments }: EnrollmentListProps) {
  const router = useRouter();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [email, setEmail] = useState('');
  const [bulkEmails, setBulkEmails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await inviteCandidate(examId, email);
      setEmail('');
      setShowInviteDialog(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite candidate');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const emails = bulkEmails
        .split('\n')
        .map((e) => e.trim())
        .filter(Boolean);

      const result = await bulkInviteCandidates(examId, emails);

      if (result.errors.length > 0) {
        setError(
          `Invited ${result.success.length}, failed ${result.errors.length}: ${result.errors
            .map((e) => `${e.email} (${e.error})`)
            .join(', ')}`
        );
      } else {
        setBulkEmails('');
        setShowBulkDialog(false);
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to bulk invite');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (enrollmentId: string) => {
    try {
      await approveEnrollment(enrollmentId);
      router.refresh();
    } catch (err) {
      console.error('Failed to approve enrollment:', err);
    }
  };

  const handleReject = async (enrollmentId: string) => {
    try {
      await rejectEnrollment(enrollmentId);
      router.refresh();
    } catch (err) {
      console.error('Failed to reject enrollment:', err);
    }
  };

  const handleRemove = async (enrollmentId: string) => {
    try {
      await removeEnrollment(enrollmentId);
      router.refresh();
    } catch (err) {
      console.error('Failed to remove enrollment:', err);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Enrollments</CardTitle>
            <CardDescription>{enrollments.length} candidates enrolled</CardDescription>
          </div>
          <div className="flex gap-2">
            <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Candidate</DialogTitle>
                  <DialogDescription>
                    Enter the candidate&apos;s email address to send an invitation.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleInvite} className="space-y-4">
                  {error && (
                    <div className="bg-destructive/15 text-destructive px-3 py-2 rounded-md text-sm">
                      {error}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="candidate@example.com"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowInviteDialog(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Inviting...' : 'Send Invitation'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Bulk Invite
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bulk Invite Candidates</DialogTitle>
                  <DialogDescription>
                    Enter multiple email addresses, one per line.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleBulkInvite} className="space-y-4">
                  {error && (
                    <div className="bg-destructive/15 text-destructive px-3 py-2 rounded-md text-sm">
                      {error}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="bulkEmails">Email Addresses</Label>
                    <Textarea
                      id="bulkEmails"
                      value={bulkEmails}
                      onChange={(e) => setBulkEmails(e.target.value)}
                      placeholder="candidate1@example.com&#10;candidate2@example.com&#10;candidate3@example.com"
                      rows={8}
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowBulkDialog(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Inviting...' : 'Send Invitations'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {enrollments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No candidates enrolled yet. Click &quot;Invite&quot; to add candidates.
          </p>
        ) : (
          <div className="space-y-2">
            {enrollments.map((enrollment) => (
              <div
                key={enrollment.id}
                className="flex items-center justify-between border rounded-lg p-3"
              >
                <div className="flex-1">
                  <p className="font-medium">{enrollment.candidate.name || 'No name'}</p>
                  <p className="text-sm text-muted-foreground">{enrollment.candidate.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Invited {new Date(enrollment.invitedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusVariant(enrollment.status)}>{enrollment.status}</Badge>
                  {enrollment.status === EnrollmentStatus.PENDING && (
                    <>
                      <Button onClick={() => handleApprove(enrollment.id)} size="sm">
                        <Check className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                      <Button onClick={() => handleReject(enrollment.id)} size="sm" variant="outline">
                        <X className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </>
                  )}
                  <Button
                    onClick={() => handleRemove(enrollment.id)}
                    size="sm"
                    variant="outline"
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
