import { auth } from '@proctorguard/auth';
import { headers } from 'next/headers';

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <div>
      <h1 className="text-3xl font-bold">Staff Portal Dashboard</h1>
      <p className="text-gray-600 mt-2">Welcome back, {session?.user?.name || session?.user?.email}</p>
      <div className="mt-6 p-4 bg-white rounded-lg shadow">
        <p className="text-sm text-gray-500">
          Navigation and features will be added in upcoming tasks.
        </p>
      </div>
    </div>
  );
}
