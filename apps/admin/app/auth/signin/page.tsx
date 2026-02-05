import { SignInForm } from '@proctorguard/ui';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-indigo-950 p-4">
      <SignInForm appName="Admin Dashboard" redirectTo="/dashboard" />
    </div>
  );
}
