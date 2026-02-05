'use client';

import { signOut, useSession } from '@proctorguard/auth/client';
import { Button } from './button';

export function UserMenu() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />;
  }

  if (!session) {
    return null;
  }

  async function handleSignOut() {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = '/auth/signin';
        },
      },
    });
  }

  return (
    <div className="flex items-center gap-3">
      <div className="text-right hidden sm:block">
        <p className="text-sm font-medium leading-none">{session.user.name}</p>
        <p className="text-xs text-muted-foreground">{session.user.email}</p>
      </div>
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
        {session.user.name?.charAt(0)?.toUpperCase() || '?'}
      </div>
      <Button variant="ghost" size="sm" onClick={handleSignOut}>
        Sign out
      </Button>
    </div>
  );
}
