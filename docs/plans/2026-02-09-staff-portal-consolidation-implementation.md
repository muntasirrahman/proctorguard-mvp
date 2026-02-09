# Staff Portal Consolidation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Consolidate 4 staff apps (Admin, Author, Coordinator, Reviewer) into a single unified Staff Portal with dynamic permission-based navigation.

**Architecture:** Create new `apps/staff/` Next.js app with permission-filtered navigation. Copy features from existing apps domain-by-domain (Admin → Author → Coordinator → Reviewer). No changes to `@proctorguard/permissions` or database schema needed.

**Tech Stack:** Next.js 16, React 19, Better Auth, Prisma, TypeScript, Turborepo

**Design Document:** `docs/plans/2026-02-09-staff-portal-consolidation-design.md`

---

## Phase 1: Staff Portal Shell (Week 1)

### Task 1: Create Staff Portal App Structure

**Goal:** Set up base Next.js app with required configuration files.

**Files:**
- Create: `apps/staff/package.json`
- Create: `apps/staff/next.config.ts`
- Create: `apps/staff/tsconfig.json`
- Create: `apps/staff/.eslintrc.json`
- Create: `apps/staff/middleware.ts`
- Create: `apps/staff/app/layout.tsx`
- Create: `apps/staff/app/page.tsx`
- Create: `apps/staff/app/globals.css`

**Step 1: Create package.json**

```bash
mkdir -p apps/staff
cd apps/staff
```

Create `apps/staff/package.json`:

```json
{
  "name": "@proctorguard/staff",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev --port 4001",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@proctorguard/auth": "workspace:*",
    "@proctorguard/database": "workspace:*",
    "@proctorguard/permissions": "workspace:*",
    "@proctorguard/ui": "workspace:*",
    "better-auth": "^1.1.4",
    "lucide-react": "^0.469.0",
    "next": "^15.1.6",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/node": "^22",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "^15.1.6",
    "typescript": "^5"
  }
}
```

**Step 2: Create next.config.ts**

Create `apps/staff/next.config.ts`:

```typescript
import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../../'),
  transpilePackages: ['@proctorguard/auth', '@proctorguard/database', '@proctorguard/permissions', '@proctorguard/ui'],
};

export default nextConfig;
```

**Step 3: Create tsconfig.json**

Copy from existing app:

```bash
cp ../admin/tsconfig.json ./tsconfig.json
```

**Step 4: Create .eslintrc.json**

Create `apps/staff/.eslintrc.json`:

```json
{
  "extends": "next/core-web-vitals"
}
```

**Step 5: Create middleware.ts**

Create `apps/staff/middleware.ts`:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('better-auth.session_token');

  // Allow auth routes
  if (request.nextUrl.pathname.startsWith('/auth') ||
      request.nextUrl.pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Redirect to sign in if no session
  if (!session) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

**Step 6: Create app/layout.tsx**

Create `apps/staff/app/layout.tsx`:

```typescript
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ProctorGuard - Staff Portal',
  description: 'Staff management portal for ProctorGuard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

**Step 7: Create app/page.tsx (redirect to dashboard)**

Create `apps/staff/app/page.tsx`:

```typescript
import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/dashboard');
}
```

**Step 8: Create globals.css**

```bash
cp ../admin/app/globals.css ./app/globals.css
```

**Step 9: Update root package.json**

Modify `package.json` in monorepo root to add staff app script:

```json
{
  "scripts": {
    "dev:staff": "cd apps/staff && npm run dev"
  }
}
```

**Step 10: Install dependencies**

```bash
cd ../..
npm install
```

**Step 11: Commit**

```bash
git add apps/staff package.json
git commit -m "feat(staff): create staff portal app shell

- Add package.json with dependencies
- Configure Next.js with monorepo file tracing
- Set up middleware for auth protection
- Add root layout and redirect to dashboard"
```

---

### Task 2: Create Auth Routes

**Goal:** Set up Better Auth endpoints and sign-in/sign-up pages.

**Files:**
- Create: `apps/staff/app/api/auth/[...all]/route.ts`
- Create: `apps/staff/app/auth/signin/page.tsx`
- Create: `apps/staff/app/auth/signup/page.tsx`
- Create: `apps/staff/app/auth/layout.tsx`

**Step 1: Create auth API handler**

Create `apps/staff/app/api/auth/[...all]/route.ts`:

```typescript
import { auth } from '@proctorguard/auth';
import { toNextJsHandler } from 'better-auth/next-js';

export const { POST, GET } = toNextJsHandler(auth);
```

**Step 2: Create auth layout**

Create `apps/staff/app/auth/layout.tsx`:

```typescript
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
```

**Step 3: Create sign-in page**

Copy and adapt from existing app:

```bash
cp -r ../admin/app/auth/signin apps/staff/app/auth/
```

Update title in `apps/staff/app/auth/signin/page.tsx` if needed:

```typescript
// Change "Admin Dashboard" to "Staff Portal"
```

**Step 4: Create sign-up page**

```bash
cp -r ../admin/app/auth/signup apps/staff/app/auth/
```

**Step 5: Test auth routes**

```bash
npm run dev:staff
```

Visit http://localhost:4001/auth/signin - should see sign-in page.

**Step 6: Commit**

```bash
git add apps/staff/app/api apps/staff/app/auth
git commit -m "feat(staff): add Better Auth routes and sign-in pages

- Add auth API handler
- Add sign-in and sign-up pages
- Add auth layout with centered design"
```

---

### Task 3: Create Base Dashboard Layout

**Goal:** Create dashboard shell with empty navigation that will be populated later.

**Files:**
- Create: `apps/staff/app/dashboard/layout.tsx`
- Create: `apps/staff/app/dashboard/page.tsx`

**Step 1: Create dashboard layout**

Create `apps/staff/app/dashboard/layout.tsx`:

```typescript
import { auth } from '@proctorguard/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/auth/signin');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation will be added in next task */}
      <div className="p-8">
        {children}
      </div>
    </div>
  );
}
```

**Step 2: Create dashboard home page**

Create `apps/staff/app/dashboard/page.tsx`:

```typescript
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
```

**Step 3: Test dashboard**

```bash
npm run dev:staff
```

1. Sign in with demo account (admin@acme.com / password123)
2. Should redirect to `/dashboard`
3. Should see welcome message

**Step 4: Commit**

```bash
git add apps/staff/app/dashboard
git commit -m "feat(staff): add base dashboard layout

- Add dashboard layout with session check
- Add dashboard home page with user welcome
- Prepare structure for dynamic navigation"
```

---

### Task 4: Create Navigation Component with Permission Filtering

**Goal:** Build reusable navigation component that filters sections based on user permissions.

**Files:**
- Create: `packages/ui/components/staff-navigation.tsx`
- Modify: `packages/ui/index.tsx`

**Step 1: Define navigation structure type**

Create `packages/ui/components/staff-navigation.tsx`:

```typescript
'use client';

import { Permission } from '@proctorguard/permissions';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileQuestion,
  Calendar,
  Video,
  Settings,
  Home,
  LucideIcon
} from 'lucide-react';

export type NavItem = {
  label: string;
  href: string;
  permission?: Permission;
};

export type NavSection = {
  label: string;
  icon: LucideIcon;
  items: NavItem[];
};

export const staffNavigation: NavSection[] = [
  {
    label: 'Dashboard',
    icon: Home,
    items: [
      { label: 'Overview', href: '/dashboard' },
    ],
  },
  {
    label: 'Questions',
    icon: FileQuestion,
    items: [
      {
        label: 'Question Banks',
        href: '/dashboard/questions',
        permission: Permission.VIEW_QUESTION_BANK,
      },
      {
        label: 'Create Question Bank',
        href: '/dashboard/questions/new',
        permission: Permission.CREATE_QUESTION_BANK,
      },
      {
        label: 'Review Queue',
        href: '/dashboard/questions/review',
        permission: Permission.APPROVE_QUESTION,
      },
    ],
  },
  {
    label: 'Exams',
    icon: Calendar,
    items: [
      {
        label: 'All Exams',
        href: '/dashboard/exams',
        permission: Permission.VIEW_EXAM_CONFIG,
      },
      {
        label: 'Create Exam',
        href: '/dashboard/exams/new',
        permission: Permission.CREATE_EXAM,
      },
      {
        label: 'Enrollments',
        href: '/dashboard/enrollments',
        permission: Permission.VIEW_ENROLLMENTS,
      },
    ],
  },
  {
    label: 'Sessions',
    icon: Video,
    items: [
      {
        label: 'Review Sessions',
        href: '/dashboard/sessions',
        permission: Permission.REVIEW_SESSION,
      },
      {
        label: 'Flagged Sessions',
        href: '/dashboard/sessions/flagged',
        permission: Permission.RESOLVE_FLAG,
      },
    ],
  },
  {
    label: 'Administration',
    icon: Settings,
    items: [
      {
        label: 'Users',
        href: '/dashboard/admin/users',
        permission: Permission.MANAGE_USERS,
      },
      {
        label: 'Departments',
        href: '/dashboard/admin/departments',
        permission: Permission.MANAGE_DEPARTMENTS,
      },
      {
        label: 'Reports',
        href: '/dashboard/reports',
        permission: Permission.VIEW_REPORTS,
      },
      {
        label: 'Audit Logs',
        href: '/dashboard/admin/audit',
        permission: Permission.VIEW_AUDIT_LOGS,
      },
    ],
  },
];

type StaffNavigationProps = {
  userPermissions: Permission[];
};

function filterNavigationByPermissions(
  navigation: NavSection[],
  permissions: Permission[]
): NavSection[] {
  return navigation
    .map(section => ({
      ...section,
      items: section.items.filter(item =>
        !item.permission || permissions.includes(item.permission)
      ),
    }))
    .filter(section => section.items.length > 0);
}

export function StaffNavigation({ userPermissions }: StaffNavigationProps) {
  const pathname = usePathname();
  const filteredNav = filterNavigationByPermissions(staffNavigation, userPermissions);

  return (
    <nav className="w-64 bg-white border-r border-gray-200 min-h-screen p-4">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-gray-900">ProctorGuard</h1>
        <p className="text-sm text-gray-500">Staff Portal</p>
      </div>

      <div className="space-y-6">
        {filteredNav.map(section => (
          <div key={section.label}>
            <div className="flex items-center gap-2 mb-2 text-gray-700 font-medium">
              <section.icon className="w-4 h-4" />
              <span className="text-sm">{section.label}</span>
            </div>
            <ul className="space-y-1 ml-6">
              {section.items.map(item => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
```

**Step 2: Export navigation component**

Modify `packages/ui/index.tsx`:

```typescript
// ... existing exports ...
export * from './components/staff-navigation';
```

**Step 3: Update dashboard layout to use navigation**

Modify `apps/staff/app/dashboard/layout.tsx`:

```typescript
import { auth } from '@proctorguard/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getUserPermissions } from '@proctorguard/permissions';
import { StaffNavigation } from '@proctorguard/ui';
import { prisma } from '@proctorguard/database';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/auth/signin');

  // Get user's organization (assuming first role for now)
  const userRole = await prisma.userRole.findFirst({
    where: { userId: session.user.id },
    select: { organizationId: true },
  });

  if (!userRole) {
    throw new Error('User has no roles assigned');
  }

  // Get aggregated permissions
  const permissions = await getUserPermissions(session.user.id, userRole.organizationId);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <StaffNavigation userPermissions={permissions} />
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
```

**Step 4: Test navigation with different roles**

```bash
npm run dev:staff
```

1. Sign in as admin@acme.com - should see all sections
2. Sign out, sign in as author@acme.com - should see only Questions section
3. Sign out, sign in as coordinator@acme.com - should see only Exams section

**Step 5: Commit**

```bash
git add packages/ui/components/staff-navigation.tsx packages/ui/index.tsx apps/staff/app/dashboard/layout.tsx
git commit -m "feat(staff): add dynamic permission-based navigation

- Create StaffNavigation component with permission filtering
- Define navigation structure for all staff roles
- Update dashboard layout to fetch user permissions
- Navigation shows only sections user has access to"
```

---

### Task 5: Add User Menu

**Goal:** Add user menu in navigation with sign-out functionality.

**Files:**
- Modify: `packages/ui/components/staff-navigation.tsx`

**Step 1: Update navigation to accept user info**

Modify `packages/ui/components/staff-navigation.tsx` to add user menu at bottom:

```typescript
// Add to imports
import { LogOut, User } from 'lucide-react';
import { createAuthClient } from 'better-auth/react';

// Update props type
type StaffNavigationProps = {
  userPermissions: Permission[];
  user: {
    name?: string | null;
    email: string;
  };
};

// Add at bottom of component (before closing </nav>)
export function StaffNavigation({ userPermissions, user }: StaffNavigationProps) {
  // ... existing code ...

  const { signOut } = createAuthClient();

  return (
    <nav className="w-64 bg-white border-r border-gray-200 min-h-screen p-4 flex flex-col">
      {/* ... existing navigation ... */}

      {/* User Menu at bottom */}
      <div className="mt-auto pt-4 border-t border-gray-200">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.name || 'User'}
            </p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={() => {
            signOut({
              fetchOptions: {
                onSuccess: () => {
                  window.location.href = '/auth/signin';
                },
              },
            });
          }}
          className="w-full mt-2 flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </nav>
  );
}
```

**Step 2: Update dashboard layout to pass user info**

Modify `apps/staff/app/dashboard/layout.tsx`:

```typescript
// ... existing code ...

return (
  <div className="flex min-h-screen bg-gray-50">
    <StaffNavigation
      userPermissions={permissions}
      user={{
        name: session.user.name,
        email: session.user.email,
      }}
    />
    <main className="flex-1 p-8">
      {children}
    </main>
  </div>
);
```

**Step 3: Test sign-out**

```bash
npm run dev:staff
```

1. Sign in
2. Click "Sign Out" button at bottom of navigation
3. Should redirect to sign-in page

**Step 4: Commit**

```bash
git add packages/ui/components/staff-navigation.tsx apps/staff/app/dashboard/layout.tsx
git commit -m "feat(staff): add user menu with sign-out

- Add user avatar and name at bottom of navigation
- Add sign-out button with Better Auth integration
- Pass user info from dashboard layout to navigation"
```

---

## Phase 2: Migrate Admin Features (Week 2)

### Task 6: Copy Admin Dashboard Page

**Goal:** Create placeholder admin dashboard accessible to users with admin permissions.

**Files:**
- Create: `apps/staff/app/dashboard/admin/page.tsx`

**Step 1: Create admin dashboard page**

Create `apps/staff/app/dashboard/admin/page.tsx`:

```typescript
import { auth } from '@proctorguard/auth';
import { headers } from 'next/headers';
import { requirePermission, Permission } from '@proctorguard/permissions';
import { prisma } from '@proctorguard/database';

export default async function AdminDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  const userRole = await prisma.userRole.findFirst({
    where: { userId: session.user.id },
    select: { organizationId: true },
  });

  if (!userRole) throw new Error('No role found');

  await requirePermission(
    { userId: session.user.id, organizationId: userRole.organizationId },
    Permission.MANAGE_USERS
  );

  return (
    <div>
      <h1 className="text-3xl font-bold">Administration</h1>
      <p className="text-gray-600 mt-2">Manage users, departments, and organization settings</p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Users</h2>
          <p className="text-sm text-gray-600">User management features will be migrated here</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Departments</h2>
          <p className="text-sm text-gray-600">Department management features will be migrated here</p>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Test admin access**

```bash
npm run dev:staff
```

1. Sign in as admin@acme.com
2. Navigate to /dashboard/admin/users (via navigation)
3. Should see admin dashboard
4. Sign out, sign in as author@acme.com
5. Try to navigate to /dashboard/admin/users
6. Should not see "Administration" section in nav

**Step 3: Commit**

```bash
git add apps/staff/app/dashboard/admin
git commit -m "feat(staff): add admin dashboard placeholder

- Create admin section with permission check
- Placeholder for user and department management
- Only visible to users with MANAGE_USERS permission"
```

---

### Task 7: Copy Users Management from Admin App

**Goal:** Migrate user management feature from admin app.

**Files:**
- Create: `apps/staff/app/dashboard/admin/users/page.tsx`
- Create: `apps/staff/app/actions/admin/users.ts`

**Step 1: Copy server actions**

```bash
mkdir -p apps/staff/app/actions/admin
cp apps/admin/app/actions/users.ts apps/staff/app/actions/admin/users.ts
```

**Step 2: Copy users page**

```bash
mkdir -p apps/staff/app/dashboard/admin/users
cp apps/admin/app/dashboard/users/page.tsx apps/staff/app/dashboard/admin/users/page.tsx
```

**Step 3: Update import paths if needed**

Check `apps/staff/app/dashboard/admin/users/page.tsx` and update any relative imports to use correct paths.

**Step 4: Test users page**

```bash
npm run dev:staff
```

1. Sign in as admin@acme.com
2. Navigate to Administration > Users
3. Should see users list
4. Test user management functions

**Step 5: Commit**

```bash
git add apps/staff/app/actions/admin/users.ts apps/staff/app/dashboard/admin/users
git commit -m "feat(staff): migrate user management from admin app

- Copy user management server actions
- Copy users list page
- Fully functional user management for admins"
```

---

### Task 8: Copy Departments Management from Admin App

**Goal:** Migrate department management feature.

**Files:**
- Create: `apps/staff/app/dashboard/admin/departments/page.tsx`
- Create: `apps/staff/app/actions/admin/departments.ts`

**Step 1: Copy server actions**

```bash
cp apps/admin/app/actions/departments.ts apps/staff/app/actions/admin/departments.ts
```

**Step 2: Copy departments page**

```bash
mkdir -p apps/staff/app/dashboard/admin/departments
cp apps/admin/app/dashboard/departments/page.tsx apps/staff/app/dashboard/admin/departments/page.tsx
```

**Step 3: Test departments page**

```bash
npm run dev:staff
```

Navigate to Administration > Departments, verify functionality.

**Step 4: Commit**

```bash
git add apps/staff/app/actions/admin/departments.ts apps/staff/app/dashboard/admin/departments
git commit -m "feat(staff): migrate department management from admin app

- Copy department management server actions
- Copy departments page
- Admins can now manage departments in staff portal"
```

---

## Phase 3: Migrate Author Features (Week 3)

### Task 9: Copy Question Banks from Author App

**Goal:** Migrate question bank management features.

**Files:**
- Create: `apps/staff/app/dashboard/questions/page.tsx`
- Create: `apps/staff/app/dashboard/questions/new/page.tsx`
- Create: `apps/staff/app/dashboard/questions/[id]/page.tsx`
- Create: `apps/staff/app/actions/questions/questionBanks.ts`

**Step 1: Copy server actions**

```bash
mkdir -p apps/staff/app/actions/questions
cp apps/author/app/actions/questionBanks.ts apps/staff/app/actions/questions/questionBanks.ts
```

**Step 2: Copy question banks list page**

```bash
mkdir -p apps/staff/app/dashboard/questions
cp apps/author/app/dashboard/question-banks/page.tsx apps/staff/app/dashboard/questions/page.tsx
```

Update imports in page if needed.

**Step 3: Copy create question bank page**

```bash
mkdir -p apps/staff/app/dashboard/questions/new
cp apps/author/app/dashboard/question-banks/new/page.tsx apps/staff/app/dashboard/questions/new/page.tsx
```

**Step 4: Copy question bank detail page**

```bash
mkdir -p apps/staff/app/dashboard/questions/[id]
cp -r apps/author/app/dashboard/question-banks/[id]/* apps/staff/app/dashboard/questions/[id]/
```

**Step 5: Test with author account**

```bash
npm run dev:staff
```

1. Sign in as author@acme.com
2. Should see only "Questions" section
3. Navigate to Questions > Question Banks
4. Test creating and viewing question banks

**Step 6: Commit**

```bash
git add apps/staff/app/actions/questions apps/staff/app/dashboard/questions
git commit -m "feat(staff): migrate question bank management from author app

- Copy question bank server actions
- Copy question banks list, create, and detail pages
- Authors can now manage question banks in staff portal"
```

---

### Task 10: Copy Question Management from Author App

**Goal:** Migrate individual question editing features.

**Files:**
- Create: `apps/staff/app/actions/questions/questions.ts`
- Create: `apps/staff/app/dashboard/questions/[id]/questions/page.tsx`
- Create: `apps/staff/app/dashboard/questions/[id]/questions/new/page.tsx`

**Step 1: Copy question actions**

```bash
cp apps/author/app/actions/questions.ts apps/staff/app/actions/questions/questions.ts
```

**Step 2: Copy question pages**

```bash
# Copy if author app has question editing pages
cp -r apps/author/app/dashboard/question-banks/[id]/questions/* apps/staff/app/dashboard/questions/[id]/questions/
```

**Step 3: Test question editing**

Test creating and editing questions within question banks.

**Step 4: Commit**

```bash
git add apps/staff/app/actions/questions/questions.ts apps/staff/app/dashboard/questions/[id]/questions
git commit -m "feat(staff): migrate question editing from author app

- Copy question server actions
- Copy question editing pages
- Authors can create and edit questions in staff portal"
```

---

## Phase 4: Migrate Coordinator Features (Week 4)

### Task 11: Copy Exam Management from Coordinator App

**Goal:** Migrate exam creation and management features.

**Files:**
- Create: `apps/staff/app/dashboard/exams/page.tsx`
- Create: `apps/staff/app/dashboard/exams/new/page.tsx`
- Create: `apps/staff/app/dashboard/exams/[id]/page.tsx`
- Create: `apps/staff/app/actions/exams/exams.ts`

**Step 1: Copy exam actions**

```bash
mkdir -p apps/staff/app/actions/exams
cp apps/coordinator/app/actions/exams.ts apps/staff/app/actions/exams/exams.ts
```

**Step 2: Copy exams list page**

```bash
mkdir -p apps/staff/app/dashboard/exams
cp apps/coordinator/app/dashboard/exams/page.tsx apps/staff/app/dashboard/exams/page.tsx
```

**Step 3: Copy create exam page**

```bash
mkdir -p apps/staff/app/dashboard/exams/new
cp apps/coordinator/app/dashboard/exams/new/page.tsx apps/staff/app/dashboard/exams/new/page.tsx
```

**Step 4: Copy exam detail page**

```bash
mkdir -p apps/staff/app/dashboard/exams/[id]
cp apps/coordinator/app/dashboard/exams/[id]/page.tsx apps/staff/app/dashboard/exams/[id]/page.tsx
```

**Step 5: Test with coordinator account**

```bash
npm run dev:staff
```

1. Sign in as coordinator@acme.com
2. Should see only "Exams" section
3. Test exam creation and management

**Step 6: Commit**

```bash
git add apps/staff/app/actions/exams apps/staff/app/dashboard/exams
git commit -m "feat(staff): migrate exam management from coordinator app

- Copy exam server actions
- Copy exam list, create, and detail pages
- Coordinators can manage exams in staff portal"
```

---

### Task 12: Copy Enrollment Management from Coordinator App

**Goal:** Migrate enrollment invitation and management features.

**Files:**
- Create: `apps/staff/app/actions/exams/enrollments.ts`
- Modify: `apps/staff/app/dashboard/exams/[id]/page.tsx` (add enrollment section)

**Step 1: Copy enrollment actions**

```bash
cp apps/coordinator/app/actions/enrollments.ts apps/staff/app/actions/exams/enrollments.ts
```

**Step 2: Copy enrollment UI components**

```bash
# If coordinator has separate enrollment components
cp -r apps/coordinator/app/dashboard/exams/[id]/enrollment-* apps/staff/app/dashboard/exams/[id]/
```

**Step 3: Update exam detail page to include enrollments**

The enrollment management UI should already be included if you copied the exam detail page. Verify it works.

**Step 4: Test enrollment features**

```bash
npm run dev:staff
```

Test inviting candidates and managing enrollments.

**Step 5: Commit**

```bash
git add apps/staff/app/actions/exams/enrollments.ts apps/staff/app/dashboard/exams/[id]
git commit -m "feat(staff): migrate enrollment management from coordinator app

- Copy enrollment server actions
- Add enrollment management to exam detail page
- Coordinators can invite and manage candidates"
```

---

## Phase 5: Migrate Reviewer Features (Week 5)

### Task 13: Copy Session Review from Reviewer App

**Goal:** Migrate session review and flag resolution features.

**Files:**
- Create: `apps/staff/app/dashboard/sessions/page.tsx`
- Create: `apps/staff/app/dashboard/sessions/[id]/page.tsx`
- Create: `apps/staff/app/dashboard/sessions/flagged/page.tsx`
- Create: `apps/staff/app/actions/sessions/sessions.ts`
- Create: `apps/staff/app/actions/sessions/flags.ts`

**Step 1: Copy session actions**

```bash
mkdir -p apps/staff/app/actions/sessions
cp apps/reviewer/app/actions/sessions.ts apps/staff/app/actions/sessions/sessions.ts
cp apps/reviewer/app/actions/flags.ts apps/staff/app/actions/sessions/flags.ts
```

**Step 2: Copy sessions list page**

```bash
mkdir -p apps/staff/app/dashboard/sessions
cp apps/reviewer/app/dashboard/sessions/page.tsx apps/staff/app/dashboard/sessions/page.tsx
```

**Step 3: Copy session detail page**

```bash
mkdir -p apps/staff/app/dashboard/sessions/[id]
cp apps/reviewer/app/dashboard/sessions/[id]/page.tsx apps/staff/app/dashboard/sessions/[id]/page.tsx
```

**Step 4: Copy flagged sessions page**

```bash
mkdir -p apps/staff/app/dashboard/sessions/flagged
cp apps/reviewer/app/dashboard/sessions/flagged/page.tsx apps/staff/app/dashboard/sessions/flagged/page.tsx
```

**Step 5: Test with reviewer account**

```bash
npm run dev:staff
```

1. Sign in as reviewer@acme.com
2. Should see only "Sessions" section
3. Test session review and flag resolution

**Step 6: Commit**

```bash
git add apps/staff/app/actions/sessions apps/staff/app/dashboard/sessions
git commit -m "feat(staff): migrate session review from reviewer app

- Copy session and flag server actions
- Copy session list, detail, and flagged pages
- Reviewers can review sessions in staff portal"
```

---

## Phase 6: Testing & Validation (Week 6)

### Task 14: Test Multi-Role User Experience

**Goal:** Verify multi-role users see correct aggregated navigation.

**Step 1: Create test user with multiple roles**

```bash
npm run db:studio
```

In Prisma Studio:
1. Create new user: test-multirole@acme.com
2. Add UserRole records for EXAM_AUTHOR + EXAM_COORDINATOR

**Step 2: Test multi-role navigation**

```bash
npm run dev:staff
```

1. Sign in as test-multirole@acme.com
2. Should see both "Questions" and "Exams" sections
3. Test creating question bank (author feature)
4. Test creating exam (coordinator feature)
5. Verify both work correctly

**Step 3: Test all role combinations**

Test matrix from design document:
- ADMIN only → All sections
- AUTHOR only → Questions only
- COORDINATOR only → Exams only
- REVIEWER only → Sessions only
- AUTHOR + COORDINATOR → Questions + Exams
- COORDINATOR + REVIEWER → Exams + Sessions
- ADMIN + AUTHOR + COORDINATOR + REVIEWER → All sections

**Step 4: Document test results**

Create `docs/testing/2026-02-09-staff-portal-testing-results.md` with test matrix results.

**Step 5: Commit**

```bash
git add docs/testing/2026-02-09-staff-portal-testing-results.md
git commit -m "test(staff): verify multi-role user navigation

- Test all role combinations from design
- Verify permission-based navigation filtering
- Document test results"
```

---

### Task 15: Feature Parity Testing

**Goal:** Ensure all features work identically to original apps.

**Step 1: Create feature checklist**

Create `docs/testing/feature-parity-checklist.md`:

```markdown
# Feature Parity Checklist

## Admin Features
- [ ] User management (list, create, edit, delete)
- [ ] Department management (list, create, edit, delete)
- [ ] Organization settings

## Author Features
- [ ] Question bank list
- [ ] Create question bank
- [ ] Edit question bank
- [ ] Delete question bank
- [ ] Add questions to bank
- [ ] Edit questions
- [ ] Delete questions

## Coordinator Features
- [ ] Exam list
- [ ] Create exam
- [ ] Edit exam
- [ ] Schedule exam
- [ ] Invite candidates
- [ ] View enrollments
- [ ] Approve/reject enrollments

## Reviewer Features
- [ ] Session list
- [ ] View session details
- [ ] Flagged sessions list
- [ ] Resolve flags
- [ ] Review recordings
```

**Step 2: Test each feature**

Go through checklist and verify each feature works.

**Step 3: Fix any discrepancies**

If features don't match original apps, fix them.

**Step 4: Update checklist with results**

Mark items as complete or note any issues.

**Step 5: Commit**

```bash
git add docs/testing/feature-parity-checklist.md
git commit -m "test(staff): complete feature parity testing

- All features verified against original apps
- Document any discrepancies found and fixed"
```

---

## Phase 7: Cutover Preparation (Week 7)

### Task 16: Update Root Package Scripts

**Goal:** Update monorepo scripts to point to staff portal instead of individual apps.

**Files:**
- Modify: `package.json` (root)
- Modify: `turbo.json`
- Modify: `CLAUDE.md`

**Step 1: Update package.json scripts**

Modify root `package.json`:

```json
{
  "scripts": {
    "dev": "turbo run dev",
    "dev:candidate": "cd apps/candidate && npm run dev",
    "dev:staff": "cd apps/staff && npm run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "clean": "turbo run clean"
  }
}
```

Remove old scripts: `dev:admin`, `dev:author`, `dev:coordinator`, `dev:reviewer`

**Step 2: Update turbo.json**

Ensure staff app is included in build pipeline:

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

**Step 3: Update CLAUDE.md**

Update `CLAUDE.md` to reflect new structure:

```markdown
## Commands

```bash
# Development
npm run dev                  # Run all apps in parallel
npm run dev:candidate        # Run candidate app only (port 4000)
npm run dev:staff            # Run staff portal (port 4001)
```

Update architecture section to show:
- apps/staff/ (NEW - consolidated portal)
- apps/candidate/ (unchanged)

Mark old apps as deprecated.

**Step 4: Commit**

```bash
git add package.json turbo.json CLAUDE.md
git commit -m "chore: update monorepo config for staff portal

- Update dev scripts to use staff portal
- Remove old app scripts (admin, author, coordinator, reviewer)
- Update documentation to reflect new structure"
```

---

### Task 17: Add Deprecation Notices to Old Apps

**Goal:** Mark old apps as deprecated before deletion.

**Files:**
- Create: `apps/admin/DEPRECATED.md`
- Create: `apps/author/DEPRECATED.md`
- Create: `apps/coordinator/DEPRECATED.md`
- Create: `apps/reviewer/DEPRECATED.md`

**Step 1: Create deprecation notices**

Create deprecation notice in each old app:

```bash
for app in admin author coordinator reviewer; do
  cat > apps/$app/DEPRECATED.md <<'EOF'
# DEPRECATED

This app has been consolidated into the unified Staff Portal.

**New location:** `apps/staff/`

**Migration date:** 2026-02-09

**Features now accessible at:**
- Staff Portal: http://localhost:4001

All features from this app have been migrated to the Staff Portal with
permission-based navigation. Multi-role users no longer need to switch
between separate applications.

**This app will be deleted in 2 weeks (2026-02-23).**

For more information, see:
- Design doc: `docs/plans/2026-02-09-staff-portal-consolidation-design.md`
- Implementation plan: `docs/plans/2026-02-09-staff-portal-consolidation-implementation.md`
EOF
done
```

**Step 2: Commit deprecation notices**

```bash
git add apps/*/DEPRECATED.md
git commit -m "docs: mark old staff apps as deprecated

- Add deprecation notices to admin, author, coordinator, reviewer apps
- Reference staff portal as replacement
- Set deletion date for 2 weeks from now"
```

---

### Task 18: Create Rollback Plan

**Goal:** Document how to roll back to old apps if needed.

**Files:**
- Create: `docs/plans/staff-portal-rollback-plan.md`

**Step 1: Write rollback procedures**

Create `docs/plans/staff-portal-rollback-plan.md`:

```markdown
# Staff Portal Rollback Plan

## If Issues Found During Parallel Run

### Option 1: Revert Deployment

1. **DNS/Routing:** Point production traffic back to old apps
   - Admin: port 4001
   - Author: port 4002
   - Coordinator: port 4003
   - Reviewer: port 4004

2. **Old apps still deployed:** No data loss, immediate rollback

3. **Fix issues in staff portal:** Continue development offline

4. **Re-test:** When ready, attempt cutover again

### Option 2: Git Revert

If staff portal code is causing issues:

```bash
# Find commit that introduced staff portal
git log --oneline | grep "staff portal"

# Revert the merge or commits
git revert <commit-hash>

# Or reset to before staff portal
git reset --hard <commit-before-staff-portal>
git push --force-with-lease
```

**WARNING:** Only use force push if absolutely necessary and team is coordinated.

### Option 3: Feature Flag

Add environment variable to disable staff portal:

```env
ENABLE_STAFF_PORTAL=false
```

Conditionally render old app links based on flag.

## Post-Rollback Actions

1. **Notify team:** Explain why rollback was necessary
2. **Document issues:** What went wrong?
3. **Create fix plan:** How to address issues
4. **Set new cutover date:** When will we try again?

## Safety Window

- Old apps remain deployed for 2 weeks post-cutover
- Can roll back at any time during this period
- After 2 weeks, old apps will be deleted
```

**Step 2: Commit rollback plan**

```bash
git add docs/plans/staff-portal-rollback-plan.md
git commit -m "docs: add rollback plan for staff portal cutover

- Document three rollback options
- Include git revert procedures
- Define 2-week safety window"
```

---

## Final Steps

### Task 19: Final Testing Before Production

**Goal:** Comprehensive testing checklist before production deployment.

**Step 1: Run full test suite**

```bash
npm run build
npm run lint
```

Verify all apps build successfully.

**Step 2: Test all features end-to-end**

1. Sign in as each role type
2. Perform key workflows:
   - Admin: Create user, assign roles
   - Author: Create question bank, add questions
   - Coordinator: Create exam, invite candidate
   - Reviewer: Review session, resolve flag
3. Test multi-role users
4. Test sign-out and re-sign-in

**Step 3: Performance check**

- Navigation should render instantly (< 100ms)
- Page loads should be comparable to old apps
- No console errors

**Step 4: Security check**

- Permission checks work on all pages
- Users can't access unauthorized sections via direct URL
- Server actions validate permissions

**Step 5: Create final sign-off checklist**

Create `docs/testing/production-readiness-checklist.md`:

```markdown
# Production Readiness Checklist

## Functionality
- [x] All features migrated
- [x] Feature parity verified
- [x] Multi-role navigation works
- [x] Permission checks enforced

## Performance
- [x] Build successful
- [x] No console errors
- [x] Fast page loads
- [x] Fast navigation

## Security
- [x] Auth working
- [x] Permission checks on all pages
- [x] Server actions validate permissions
- [x] No unauthorized access

## Documentation
- [x] Design doc complete
- [x] Implementation plan complete
- [x] Testing results documented
- [x] Rollback plan ready

## Deployment
- [x] Environment variables configured
- [x] Build scripts updated
- [x] Monorepo configuration correct
- [x] Deprecation notices added

## Team Readiness
- [ ] Team trained on new structure
- [ ] Support plan for user questions
- [ ] Monitoring plan for errors

**Ready for production:** YES / NO
**Signed off by:** _____________
**Date:** _____________
```

**Step 6: Commit checklist**

```bash
git add docs/testing/production-readiness-checklist.md
git commit -m "docs: add production readiness checklist

- Comprehensive pre-launch validation
- All functionality, performance, security checks
- Team sign-off section"
```

---

### Task 20: Deploy to Production

**Goal:** Deploy staff portal to production environment.

**Step 1: Merge to main**

```bash
git checkout main
git pull origin main
git merge feature/staff-portal-consolidation
git push origin main
```

**Step 2: Deploy to Vercel (or your platform)**

```bash
# If using Vercel
vercel --prod

# Or deploy through CI/CD pipeline
```

**Step 3: Verify production deployment**

1. Visit production URL
2. Test sign-in with production credentials
3. Verify navigation works
4. Test key features

**Step 4: Monitor for issues**

- Check error logs
- Monitor performance metrics
- Watch for user feedback

**Step 5: Keep old apps running**

Keep old app deployments active for 2-week safety window.

**Step 6: Final commit**

```bash
git add .
git commit -m "deploy: staff portal to production

- Merged feature branch to main
- Deployed to production environment
- Old apps remain available for rollback"
```

---

## Success Criteria

✅ **Functional Requirements:**
- All features from 4 staff apps work in unified portal
- Permission-based navigation shows correct sections
- Multi-role users see aggregated navigation
- Single-role users see only their domain

✅ **Performance:**
- No regression vs old apps
- Navigation renders instantly
- Permission checks don't slow page loads

✅ **User Experience:**
- Multi-role users don't switch apps
- Navigation is intuitive
- Features are easy to find

✅ **Maintenance:**
- 2 apps instead of 5 (3 fewer deployments)
- Less code duplication
- Easier to add new features
- Consistent UI/UX

---

## Post-Implementation

After 2-week safety window:

1. **Delete old apps:**
```bash
rm -rf apps/admin apps/author apps/coordinator apps/reviewer
git commit -m "chore: remove deprecated staff apps"
```

2. **Clean up documentation:**
- Archive old app docs
- Update all references to point to staff portal

3. **Celebrate:**
- Consolidation complete! 🎉
- Improved UX for multi-role users
- Simpler architecture going forward

---

## End of Plan

This plan contains **20 tasks** broken down into **bite-sized steps**. Each task takes 30-60 minutes. Total estimated time: **7 weeks** (following design document timeline).

**Key principles followed:**
- ✅ DRY - Reuse existing patterns
- ✅ YAGNI - Only build what's needed
- ✅ TDD - Test after each feature migration
- ✅ Frequent commits - After every task

**Next:** Use @superpowers:executing-plans to implement task-by-task or @superpowers:subagent-driven-development to dispatch subagents for each task.
