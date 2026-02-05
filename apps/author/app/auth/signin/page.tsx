import { SignInForm } from '@proctorguard/ui';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-slate-900 dark:to-emerald-950 p-4">
      <SignInForm appName="Question Author" redirectTo="/dashboard" />
    </div>
  );
}
