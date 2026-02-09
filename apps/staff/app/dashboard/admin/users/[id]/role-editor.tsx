'use client';

import { useState } from 'react';
import { Role } from '@proctorguard/database';
import { Button, Checkbox, Label } from '@proctorguard/ui';
import { updateUserRoles, removeUser } from '../../../../actions/admin/users';
import { useRouter } from 'next/navigation';

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

interface RoleEditorProps {
  orgId: string;
  userId: string;
  currentRoles: Role[];
}

export function RoleEditor({ orgId, userId, currentRoles }: RoleEditorProps) {
  const router = useRouter();
  const [selectedRoles, setSelectedRoles] = useState<Role[]>(currentRoles);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  const toggleRole = (role: Role) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSave = async () => {
    setError('');
    setSaving(true);
    try {
      await updateUserRoles(orgId, userId, selectedRoles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update roles');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm('Are you sure you want to remove this user from the organization?')) return;
    setError('');
    setRemoving(true);
    try {
      await removeUser(orgId, userId);
      router.push('/dashboard/users');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove user');
      setRemoving(false);
    }
  };

  const hasChanges =
    selectedRoles.length !== currentRoles.length ||
    !selectedRoles.every((r) => currentRoles.includes(r));

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label className="text-base">Assigned Roles</Label>
        <div className="grid grid-cols-2 gap-4">
          {ALL_ROLES.map((role) => (
            <div key={role.value} className="flex items-center space-x-2">
              <Checkbox
                id={role.value}
                checked={selectedRoles.includes(role.value)}
                onCheckedChange={() => toggleRole(role.value)}
              />
              <Label htmlFor={role.value} className="font-normal">
                {role.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center justify-between">
        <Button
          variant="destructive"
          onClick={handleRemove}
          disabled={removing}
        >
          {removing ? 'Removing...' : 'Remove from Organization'}
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving || selectedRoles.length === 0 || !hasChanges}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
