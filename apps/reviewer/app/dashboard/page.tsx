import { auth } from '@proctorguard/auth';
import { headers } from 'next/headers';

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Welcome, {session?.user.name}</h1>
      <p className="text-muted-foreground">Sessions to review will appear here.</p>
    </div>
  );
}
