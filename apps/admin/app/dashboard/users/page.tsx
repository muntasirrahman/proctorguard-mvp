import { Role } from '@proctorguard/database';
import {
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
  Button,
} from '@proctorguard/ui';
import Link from 'next/link';
import { getOrganizationForUser } from '../../actions/dashboard';
import { getUsers } from '../../actions/users';
import { InviteUserDialog } from './invite-user-dialog';

const ROLE_COLORS: Record<Role, 'default' | 'secondary' | 'outline'> = {
  SUPER_ADMIN: 'default',
  ORG_ADMIN: 'default',
  EXAM_AUTHOR: 'secondary',
  EXAM_COORDINATOR: 'secondary',
  ENROLLMENT_MANAGER: 'secondary',
  PROCTOR_REVIEWER: 'secondary',
  QUALITY_ASSURANCE: 'outline',
  REPORT_VIEWER: 'outline',
  CANDIDATE: 'outline',
};

export default async function UsersPage() {
  const org = await getOrganizationForUser();
  const users = await getUsers(org.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-muted-foreground">Manage organization members and roles</p>
        </div>
        <InviteUserDialog orgId={org.id} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization Members</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name || '-'}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <Badge key={role} variant={ROLE_COLORS[role]}>
                          {role.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{new Date(user.joinedAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Link href={`/dashboard/users/${user.id}`}>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
