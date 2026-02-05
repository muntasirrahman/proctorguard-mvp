import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@proctorguard/ui';
import { auth } from '@proctorguard/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect('/dashboard');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-indigo-950 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">ProctorGuard</CardTitle>
          <CardDescription>Admin Dashboard</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Welcome to the ProctorGuard Admin Dashboard. Manage your organization, departments, and users.
          </p>
          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          </div>
          <div className="text-xs text-center text-muted-foreground mt-4">
            <p>Running on port 3002</p>
            <p className="mt-1">Role: Organization Admin</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
