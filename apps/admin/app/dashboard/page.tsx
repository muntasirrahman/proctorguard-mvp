import { auth } from '@proctorguard/auth';
import { headers } from 'next/headers';
import { Card, CardContent, CardHeader, CardTitle } from '@proctorguard/ui';
import { Users, Building2, Shield } from 'lucide-react';
import { getOrganizationForUser, getDashboardStats, getRecentActivity } from '../actions/dashboard';

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const org = await getOrganizationForUser();
  const stats = await getDashboardStats(org.id);
  const activity = await getRecentActivity(org.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {session?.user.name}</h1>
        <p className="text-muted-foreground">Managing {org.name}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.userCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.departmentCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Roles Assigned</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.roleCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity</p>
          ) : (
            <div className="space-y-4">
              {activity.map((log) => (
                <div key={log.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">{log.user?.name || 'System'}</span>
                    <span className="text-muted-foreground"> {log.action} </span>
                    <span>{log.resource}</span>
                  </div>
                  <span className="text-muted-foreground">
                    {new Date(log.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
