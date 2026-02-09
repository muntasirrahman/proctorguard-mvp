'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@proctorguard/ui';
import { acceptEnrollment, declineEnrollment } from '../../actions/enrollments';
import { useRouter } from 'next/navigation';

type PendingInvitation = {
  id: string;
  invitedAt: Date;
  expiresAt: Date | null;
  isExpired: boolean;
  exam: {
    id: string;
    title: string;
    description: string | null;
    duration: number;
    scheduledStart: Date | null;
    scheduledEnd: Date | null;
    requireIdentityVerification: boolean;
    requireLockdownBrowser: boolean;
    enableRecording: boolean;
    enableAIMonitoring: boolean;
    organization: {
      name: string;
    };
  };
};

type Props = {
  invitations: PendingInvitation[];
};

export function PendingInvitations({ invitations }: Props) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState<string | null>(null);

  const handleAccept = async (enrollmentId: string) => {
    try {
      setLoadingId(enrollmentId);
      await acceptEnrollment(enrollmentId);
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to accept invitation');
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeclineClick = (enrollmentId: string) => {
    setSelectedInvitation(enrollmentId);
    setDeclineDialogOpen(true);
  };

  const handleDeclineConfirm = async () => {
    if (!selectedInvitation) return;

    try {
      setLoadingId(selectedInvitation);
      await declineEnrollment(selectedInvitation);
      setDeclineDialogOpen(false);
      setSelectedInvitation(null);
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to decline invitation');
    } finally {
      setLoadingId(null);
    }
  };

  if (invitations.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No pending invitations</p>
        <p className="text-sm text-muted-foreground mt-2">
          Check back later for new exam invitations
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {invitations.map((invitation) => {
          const isLoading = loadingId === invitation.id;
          const isExpired = invitation.isExpired;

          return (
            <Card key={invitation.id} className={isExpired ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{invitation.exam.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {invitation.exam.organization.name}
                    </CardDescription>
                  </div>
                  {isExpired && (
                    <Badge variant="destructive" className="ml-2">
                      Expired
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {invitation.exam.description && (
                  <p className="text-sm text-muted-foreground">
                    {invitation.exam.description}
                  </p>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-medium">{invitation.exam.duration} minutes</span>
                  </div>

                  {invitation.exam.scheduledStart && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Starts:</span>
                      <span className="font-medium">
                        {new Date(invitation.exam.scheduledStart).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}

                  {invitation.exam.scheduledEnd && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ends:</span>
                      <span className="font-medium">
                        {new Date(invitation.exam.scheduledEnd).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Invited:</span>
                    <span className="font-medium">
                      {new Date(invitation.invitedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  {invitation.expiresAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Expires:</span>
                      <span className={`font-medium ${isExpired ? 'text-destructive' : ''}`}>
                        {new Date(invitation.expiresAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Requirements:</p>
                  <div className="flex flex-wrap gap-1">
                    {invitation.exam.requireIdentityVerification && (
                      <Badge variant="outline" className="text-xs">
                        ID Verification
                      </Badge>
                    )}
                    {invitation.exam.requireLockdownBrowser && (
                      <Badge variant="outline" className="text-xs">
                        Lockdown Browser
                      </Badge>
                    )}
                    {invitation.exam.enableRecording && (
                      <Badge variant="outline" className="text-xs">
                        Recording Enabled
                      </Badge>
                    )}
                    {invitation.exam.enableAIMonitoring && (
                      <Badge variant="outline" className="text-xs">
                        AI Monitoring
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => handleAccept(invitation.id)}
                    disabled={isLoading || isExpired}
                    className="flex-1"
                  >
                    {isLoading ? 'Processing...' : 'Accept'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDeclineClick(invitation.id)}
                    disabled={isLoading || isExpired}
                    className="flex-1"
                  >
                    Decline
                  </Button>
                </div>

                {isExpired && (
                  <p className="text-xs text-destructive text-center pt-2">
                    This invitation has expired and can no longer be accepted
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={declineDialogOpen} onOpenChange={setDeclineDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Invitation</DialogTitle>
            <DialogDescription>
              Are you sure you want to decline this exam invitation? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeclineDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDeclineConfirm} disabled={!!loadingId}>
              {loadingId ? 'Processing...' : 'Decline'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
