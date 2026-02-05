'use client';

import { useState } from 'react';
import { signIn } from '@proctorguard/auth/client';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';

interface SignInFormProps {
  appName: string;
  redirectTo?: string;
  signUpUrl?: string;
}

export function SignInForm({ appName, redirectTo = '/dashboard', signUpUrl }: SignInFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: signInError } = await signIn.email(
      { email, password, callbackURL: redirectTo },
      {
        onSuccess: () => {
          window.location.href = redirectTo;
        },
        onError: (ctx) => {
          setError(ctx.error.message);
          setLoading(false);
        },
      }
    );

    if (signInError) {
      setError(signInError.message || 'Sign in failed');
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
        <CardDescription>{appName}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
          {signUpUrl && (
            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <a href={signUpUrl} className="text-primary underline-offset-4 hover:underline">
                Sign up
              </a>
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
