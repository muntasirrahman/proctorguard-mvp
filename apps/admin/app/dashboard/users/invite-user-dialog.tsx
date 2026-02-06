'use client';

import { useState } from 'react';
import { Role } from '@proctorguard/database';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  Button,
  Input,
  Label,
  Checkbox,
} from '@proctorguard/ui';
import { inviteUser } from '../../actions/users';

const ALL_ROLES: { value: Role; label: string }[] = [
  { value: 'ORG_ADMIN', label: 'Organization Admin' },
  { value: 'EXAM_AUTHOR', label: 'Exam Author' },
  { value: 'EXAM_COORDINATOR', label: 'Exam Coordinator' },
  { value: 'ENROLLMENT_MANAGER', label: 'Enrollment Manager' },
  { value: 'PROCTOR_REVIEWER', label: 'Proctor Reviewer' },
  { value: 'QUALITY_ASSURANCE', label: 'Quality Assurance' },
  { value: 'REPORT_VIEWER', label: 'Report Viewer' },
  { value: 'CANDIDATE', label: 'Candidate' },
];

export function InviteUserDialog({ orgId }: { orgId: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleRole = (role: Role) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await inviteUser(orgId, email, name || null, selectedRoles);
      setOpen(false);
      setEmail('');
      setName('');
      setSelectedRoles([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Invite User</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name (optional)</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Roles</Label>
            <div className="grid grid-cols-2 gap-2">
              {ALL_ROLES.map((role) => (
                <div key={role.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={role.value}
                    checked={selectedRoles.includes(role.value)}
                    onCheckedChange={() => toggleRole(role.value)}
                  />
                  <Label htmlFor={role.value} className="text-sm font-normal">
                    {role.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || selectedRoles.length === 0}>
              {loading ? 'Inviting...' : 'Invite'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
