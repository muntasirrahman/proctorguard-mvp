import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@proctorguard/ui';
import { auth } from '@proctorguard/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect('/dashboard');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">ProctorGuard</CardTitle>
          <CardDescription>Candidate Portal</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Welcome to the ProctorGuard Candidate Portal. Sign in to view and take your scheduled exams.
          </p>
          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/auth/signin">Sign In</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/auth/signup">Create Account</Link>
            </Button>
          </div>
          <div className="text-xs text-center text-muted-foreground mt-4">
            <p>Running on port 3001</p>
            <p className="mt-1">Role: Candidate</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
