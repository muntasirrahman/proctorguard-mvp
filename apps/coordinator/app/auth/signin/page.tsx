import { SignInForm } from '@proctorguard/ui';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-violet-100 dark:from-slate-900 dark:to-violet-950 p-4">
      <SignInForm appName="Exam Coordinator" redirectTo="/dashboard" />
    </div>
  );
}
