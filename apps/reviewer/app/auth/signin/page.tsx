import { SignInForm } from '@proctorguard/ui';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100 dark:from-slate-900 dark:to-amber-950 p-4">
      <SignInForm appName="Session Reviewer" redirectTo="/dashboard" />
    </div>
  );
}
