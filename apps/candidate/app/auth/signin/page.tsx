import { SignInForm } from '@proctorguard/ui';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <SignInForm
        appName="Candidate Portal"
        redirectTo="/dashboard"
        signUpUrl="/auth/signup"
      />
    </div>
  );
}
