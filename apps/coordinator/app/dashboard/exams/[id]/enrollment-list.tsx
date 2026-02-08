'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EnrollmentStatus } from '@proctorguard/database';
import {
  inviteCandidate,
  bulkInviteCandidates,
  approveEnrollment,
  rejectEnrollment,
  removeEnrollment,
} from '../../../actions/enrollments';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Textarea,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@proctorguard/ui';
import { UserPlus, Users, Check, X, Trash2, MoreVertical } from 'lucide-react';

interface EnrollmentListProps {
  examId: string;
  enrollments: Array<{
    id: string;
    status: EnrollmentStatus;
    invitedAt: Date;
    candidate: {
      name: string | null;
      email: string;
    };
  }>;
}

export function EnrollmentList({ examId, enrollments }: EnrollmentListProps) {
  const router = useRouter();

  // Dialog states
  const [singleInviteOpen, setSingleInviteOpen] = useState(false);
  const [bulkInviteOpen, setBulkInviteOpen] = useState(false);

  // Form states
  const [singleEmail, setSingleEmail] = useState('');
  const [bulkEmails, setBulkEmails] = useState('');

  // Loading and feedback states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Helper function to get status badge variant
  const getStatusBadge = (status: EnrollmentStatus) => {
    switch (status) {
      case EnrollmentStatus.PENDING:
        return <Badge className="bg-yellow-500">{status}</Badge>;
      case EnrollmentStatus.APPROVED:
        return <Badge className="bg-green-500">{status}</Badge>;
      case EnrollmentStatus.REJECTED:
        return <Badge className="bg-red-500">{status}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Single invite handler
  const handleSingleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await inviteCandidate(examId, singleEmail.trim());
      setSuccess(`Successfully invited ${singleEmail}`);
      setSingleEmail('');
      setSingleInviteOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite candidate');
    } finally {
      setLoading(false);
    }
  };

  // Bulk invite handler
  const handleBulkInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      // Split by newlines and filter empty lines
      const emails = bulkEmails
        .split('\n')
        .map((email) => email.trim())
        .filter((email) => email.length > 0);

      if (emails.length === 0) {
        setError('Please enter at least one email address');
        setLoading(false);
        return;
      }

      const result = await bulkInviteCandidates(examId, emails);

      // Show success/error breakdown
      const successCount = result.success.length;
      const errorCount = result.errors.length;

      if (successCount > 0 && errorCount === 0) {
        setSuccess(`Successfully invited ${successCount} candidate(s)`);
        setBulkEmails('');
        setBulkInviteOpen(false);
      } else if (successCount > 0 && errorCount > 0) {
        setSuccess(
          `Invited ${successCount} candidate(s). Failed: ${errorCount}. Errors: ${result.errors
            .map((e) => `${e.email} (${e.error})`)
            .join(', ')}`
        );
      } else {
        setError(`All invitations failed. ${result.errors.map((e) => `${e.email}: ${e.error}`).join(', ')}`);
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to bulk invite candidates');
    } finally {
      setLoading(false);
    }
  };

  // Approve enrollment handler
  const handleApprove = async (enrollmentId: string) => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await approveEnrollment(enrollmentId);
      setSuccess('Enrollment approved successfully');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve enrollment');
    } finally {
      setLoading(false);
    }
  };

  // Reject enrollment handler
  const handleReject = async (enrollmentId: string) => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await rejectEnrollment(enrollmentId);
      setSuccess('Enrollment rejected successfully');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject enrollment');
    } finally {
      setLoading(false);
    }
  };

  // Remove enrollment handler
  const handleRemove = async (enrollmentId: string) => {
    if (!confirm('Are you sure you want to remove this enrollment? This action cannot be undone.')) {
      return;
    }

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await removeEnrollment(enrollmentId);
      setSuccess('Enrollment removed successfully');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove enrollment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Enrollments</CardTitle>
          <div className="flex gap-2">
            <Dialog open={singleInviteOpen} onOpenChange={setSingleInviteOpen}>
              <DialogTrigger asChild>
                <Button size="sm" disabled={loading}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Candidate
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleSingleInvite}>
                  <DialogHeader>
                    <DialogTitle>Invite Candidate</DialogTitle>
                    <DialogDescription>
                      Enter the candidate's email address to send an invitation.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="candidate@example.com"
                      value={singleEmail}
                      onChange={(e) => setSingleEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="mt-2"
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setSingleInviteOpen(false)}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Inviting...' : 'Send Invitation'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={bulkInviteOpen} onOpenChange={setBulkInviteOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" disabled={loading}>
                  <Users className="mr-2 h-4 w-4" />
                  Bulk Invite
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleBulkInvite}>
                  <DialogHeader>
                    <DialogTitle>Bulk Invite Candidates</DialogTitle>
                    <DialogDescription>
                      Enter email addresses, one per line, to send multiple invitations.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Label htmlFor="emails">Email Addresses</Label>
                    <Textarea
                      id="emails"
                      placeholder="candidate1@example.com&#10;candidate2@example.com&#10;candidate3@example.com"
                      value={bulkEmails}
                      onChange={(e) => setBulkEmails(e.target.value)}
                      required
                      disabled={loading}
                      className="mt-2 min-h-[150px] font-mono text-sm"
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setBulkInviteOpen(false)}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Inviting...' : 'Send Invitations'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Feedback messages */}
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-800">
            {success}
          </div>
        )}

        {enrollments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No enrollments yet. Invite candidates to get started.
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Invited Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell className="font-medium">
                      {enrollment.candidate.name || 'N/A'}
                    </TableCell>
                    <TableCell>{enrollment.candidate.email}</TableCell>
                    <TableCell>{getStatusBadge(enrollment.status)}</TableCell>
                    <TableCell>
                      {new Date(enrollment.invitedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" disabled={loading}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {enrollment.status === EnrollmentStatus.PENDING && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleApprove(enrollment.id)}
                                disabled={loading}
                              >
                                <Check className="mr-2 h-4 w-4" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleReject(enrollment.id)}
                                disabled={loading}
                              >
                                <X className="mr-2 h-4 w-4" />
                                Reject
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleRemove(enrollment.id)}
                            disabled={loading}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="mt-4 text-sm text-muted-foreground">
          Total: {enrollments.length} candidate(s)
        </div>
      </CardContent>
    </Card>
  );
}
