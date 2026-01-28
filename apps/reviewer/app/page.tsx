import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@proctorguard/ui';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100 dark:from-slate-900 dark:to-amber-950 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">ProctorGuard</CardTitle>
          <CardDescription>Session Reviewer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Welcome to the ProctorGuard Session Reviewer Portal. Review exam sessions, flags, and evidence.
          </p>
          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          </div>
          <div className="text-xs text-center text-muted-foreground mt-4">
            <p>Running on port 3005</p>
            <p className="mt-1">Role: Proctor Reviewer</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
