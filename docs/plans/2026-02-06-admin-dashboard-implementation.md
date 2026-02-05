# Admin Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the admin dashboard with org overview, user management, and department CRUD.

**Architecture:** Server Components for data fetching, Server Actions for mutations, shared UI components from `@proctorguard/ui`. Permission checks on all actions.

**Tech Stack:** Next.js 16, React 19, Prisma, Better Auth, shadcn/ui (Radix), Tailwind CSS

**Note:** No test infrastructure exists in this project. Steps focus on implementation with manual verification.

---

## Task 1: Add Missing UI Components

We need Dialog, Table, Checkbox, Badge, and Select components for the admin features.

**Files:**
- Create: `packages/ui/components/dialog.tsx`
- Create: `packages/ui/components/table.tsx`
- Create: `packages/ui/components/checkbox.tsx`
- Create: `packages/ui/components/badge.tsx`
- Create: `packages/ui/components/select.tsx`
- Modify: `packages/ui/index.tsx`

**Step 1: Create Dialog component**

Create `packages/ui/components/dialog.tsx`:

```tsx
'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)} {...props} />
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight', className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
```

**Step 2: Create Table component**

Create `packages/ui/components/table.tsx`:

```tsx
import * as React from 'react';
import { cn } from '../lib/utils';

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table ref={ref} className={cn('w-full caption-bottom text-sm', className)} {...props} />
    </div>
  )
);
Table.displayName = 'Table';

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />
));
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />
));
TableBody.displayName = 'TableBody';

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn('border-t bg-muted/50 font-medium [&>tr]:last:border-b-0', className)}
    {...props}
  />
));
TableFooter.displayName = 'TableFooter';

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn('border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted', className)}
      {...props}
    />
  )
);
TableRow.displayName = 'TableRow';

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      'h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0',
      className
    )}
    {...props}
  />
));
TableHead.displayName = 'TableHead';

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td ref={ref} className={cn('p-4 align-middle [&:has([role=checkbox])]:pr-0', className)} {...props} />
));
TableCell.displayName = 'TableCell';

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption ref={ref} className={cn('mt-4 text-sm text-muted-foreground', className)} {...props} />
));
TableCaption.displayName = 'TableCaption';

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
```

**Step 3: Create Checkbox component**

Create `packages/ui/components/checkbox.tsx`:

```tsx
'use client';

import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { cn } from '../lib/utils';

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      'peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className={cn('flex items-center justify-center text-current')}>
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
```

**Step 4: Create Badge component**

Create `packages/ui/components/badge.tsx`:

```tsx
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
```

**Step 5: Update UI package exports**

Modify `packages/ui/index.tsx` to add new exports after line 6:

```tsx
export * from './components/dialog';
export * from './components/table';
export * from './components/checkbox';
export * from './components/badge';
```

**Step 6: Verify build**

Run: `npm run build --filter=@proctorguard/ui`
Expected: Build succeeds

**Step 7: Commit**

```bash
git add packages/ui/
git commit -m "feat(ui): add Dialog, Table, Checkbox, Badge components"
```

---

## Task 2: Create Server Actions for Dashboard Stats

**Files:**
- Create: `apps/admin/app/actions/dashboard.ts`

**Step 1: Create dashboard actions**

Create `apps/admin/app/actions/dashboard.ts`:

```typescript
'use server';

import { auth } from '@proctorguard/auth';
import { prisma } from '@proctorguard/database';
import { headers } from 'next/headers';

export async function getOrganizationForUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  const membership = await prisma.organizationMember.findFirst({
    where: { userId: session.user.id },
    include: { organization: true },
  });

  if (!membership) throw new Error('No organization found');
  return membership.organization;
}

export async function getDashboardStats(orgId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  const [userCount, departmentCount, roleCount] = await Promise.all([
    prisma.organizationMember.count({ where: { organizationId: orgId } }),
    prisma.department.count({ where: { organizationId: orgId } }),
    prisma.userRole.count({ where: { organizationId: orgId } }),
  ]);

  return { userCount, departmentCount, roleCount };
}

export async function getRecentActivity(orgId: string, limit: number = 10) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  const logs = await prisma.auditLog.findMany({
    where: {
      resource: { in: ['user', 'user_role', 'department', 'organization_member'] },
    },
    orderBy: { timestamp: 'desc' },
    take: limit,
    include: { user: { select: { name: true, email: true } } },
  });

  return logs;
}
```

**Step 2: Commit**

```bash
git add apps/admin/app/actions/
git commit -m "feat(admin): add dashboard stats server actions"
```

---

## Task 3: Build Dashboard Overview Page

**Files:**
- Modify: `apps/admin/app/dashboard/page.tsx`

**Step 1: Implement overview page**

Replace `apps/admin/app/dashboard/page.tsx`:

```tsx
import { auth } from '@proctorguard/auth';
import { headers } from 'next/headers';
import { Card, CardContent, CardHeader, CardTitle } from '@proctorguard/ui';
import { Users, Building2, Shield } from 'lucide-react';
import { getOrganizationForUser, getDashboardStats, getRecentActivity } from '../actions/dashboard';

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const org = await getOrganizationForUser();
  const stats = await getDashboardStats(org.id);
  const activity = await getRecentActivity(org.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {session?.user.name}</h1>
        <p className="text-muted-foreground">Managing {org.name}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.userCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.departmentCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Roles Assigned</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.roleCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity</p>
          ) : (
            <div className="space-y-4">
              {activity.map((log) => (
                <div key={log.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">{log.user?.name || 'System'}</span>
                    <span className="text-muted-foreground"> {log.action} </span>
                    <span>{log.resource}</span>
                  </div>
                  <span className="text-muted-foreground">
                    {new Date(log.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 2: Verify page loads**

Run: `npm run dev:admin`
Navigate to: http://localhost:3002/dashboard
Expected: Stats cards and activity section render (may show zeros initially)

**Step 3: Commit**

```bash
git add apps/admin/app/dashboard/page.tsx
git commit -m "feat(admin): implement dashboard overview with stats and activity"
```

---

## Task 4: Create Server Actions for Users

**Files:**
- Create: `apps/admin/app/actions/users.ts`

**Step 1: Create user actions**

Create `apps/admin/app/actions/users.ts`:

```typescript
'use server';

import { auth } from '@proctorguard/auth';
import { prisma, Role } from '@proctorguard/database';
import { requirePermission, Permission } from '@proctorguard/permissions';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function getUsers(orgId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  await requirePermission(
    { userId: session.user.id, organizationId: orgId },
    Permission.MANAGE_USERS
  );

  const members = await prisma.organizationMember.findMany({
    where: { organizationId: orgId },
    include: {
      user: {
        select: { id: true, name: true, email: true, createdAt: true },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });

  // Get roles for each user
  const userIds = members.map((m) => m.user.id);
  const roles = await prisma.userRole.findMany({
    where: { userId: { in: userIds }, organizationId: orgId },
  });

  const rolesByUser = roles.reduce(
    (acc, role) => {
      if (!acc[role.userId]) acc[role.userId] = [];
      acc[role.userId].push(role.role);
      return acc;
    },
    {} as Record<string, Role[]>
  );

  return members.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    email: m.user.email,
    joinedAt: m.joinedAt,
    roles: rolesByUser[m.user.id] || [],
  }));
}

export async function inviteUser(
  orgId: string,
  email: string,
  name: string | null,
  roles: Role[]
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  await requirePermission(
    { userId: session.user.id, organizationId: orgId },
    Permission.MANAGE_USERS
  );
  await requirePermission(
    { userId: session.user.id, organizationId: orgId },
    Permission.MANAGE_ROLES
  );

  if (roles.length === 0) {
    throw new Error('At least one role is required');
  }

  // Create or find user
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: { email, name },
    });
  }

  // Check if already a member
  const existingMember = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId: orgId } },
  });

  if (existingMember) {
    throw new Error('User is already a member of this organization');
  }

  // Add as member and assign roles
  await prisma.$transaction([
    prisma.organizationMember.create({
      data: { userId: user.id, organizationId: orgId },
    }),
    ...roles.map((role) =>
      prisma.userRole.create({
        data: { userId: user.id, organizationId: orgId, role, assignedBy: session.user.id },
      })
    ),
    prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'invited',
        resource: 'user',
        resourceId: user.id,
        details: { email, roles },
      },
    }),
  ]);

  revalidatePath('/dashboard/users');
  return { success: true };
}

export async function updateUserRoles(orgId: string, userId: string, roles: Role[]) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  await requirePermission(
    { userId: session.user.id, organizationId: orgId },
    Permission.MANAGE_ROLES
  );

  if (roles.length === 0) {
    throw new Error('At least one role is required');
  }

  // Delete existing roles and create new ones
  await prisma.$transaction([
    prisma.userRole.deleteMany({ where: { userId, organizationId: orgId } }),
    ...roles.map((role) =>
      prisma.userRole.create({
        data: { userId, organizationId: orgId, role, assignedBy: session.user.id },
      })
    ),
    prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'updated_roles',
        resource: 'user_role',
        resourceId: userId,
        details: { roles },
      },
    }),
  ]);

  revalidatePath('/dashboard/users');
  revalidatePath(`/dashboard/users/${userId}`);
  return { success: true };
}

export async function removeUser(orgId: string, userId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  await requirePermission(
    { userId: session.user.id, organizationId: orgId },
    Permission.MANAGE_USERS
  );

  // Prevent removing yourself
  if (userId === session.user.id) {
    throw new Error('You cannot remove yourself from the organization');
  }

  await prisma.$transaction([
    prisma.userRole.deleteMany({ where: { userId, organizationId: orgId } }),
    prisma.organizationMember.delete({
      where: { userId_organizationId: { userId, organizationId: orgId } },
    }),
    prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'removed',
        resource: 'organization_member',
        resourceId: userId,
      },
    }),
  ]);

  revalidatePath('/dashboard/users');
  return { success: true };
}

export async function getUser(orgId: string, userId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  await requirePermission(
    { userId: session.user.id, organizationId: orgId },
    Permission.MANAGE_USERS
  );

  const member = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId: orgId } },
    include: { user: { select: { id: true, name: true, email: true, createdAt: true } } },
  });

  if (!member) throw new Error('User not found');

  const roles = await prisma.userRole.findMany({
    where: { userId, organizationId: orgId },
  });

  return {
    id: member.user.id,
    name: member.user.name,
    email: member.user.email,
    createdAt: member.user.createdAt,
    joinedAt: member.joinedAt,
    roles: roles.map((r) => r.role),
  };
}
```

**Step 2: Commit**

```bash
git add apps/admin/app/actions/users.ts
git commit -m "feat(admin): add user management server actions"
```

---

## Task 5: Build Users List Page

**Files:**
- Create: `apps/admin/app/dashboard/users/page.tsx`
- Create: `apps/admin/app/dashboard/users/invite-user-dialog.tsx`

**Step 1: Create invite user dialog component**

Create `apps/admin/app/dashboard/users/invite-user-dialog.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { Role } from '@proctorguard/database';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  Button,
  Input,
  Label,
  Checkbox,
} from '@proctorguard/ui';
import { inviteUser } from '../../actions/users';

const ALL_ROLES: { value: Role; label: string }[] = [
  { value: 'ORG_ADMIN', label: 'Organization Admin' },
  { value: 'EXAM_AUTHOR', label: 'Exam Author' },
  { value: 'EXAM_COORDINATOR', label: 'Exam Coordinator' },
  { value: 'ENROLLMENT_MANAGER', label: 'Enrollment Manager' },
  { value: 'PROCTOR_REVIEWER', label: 'Proctor Reviewer' },
  { value: 'QUALITY_ASSURANCE', label: 'Quality Assurance' },
  { value: 'REPORT_VIEWER', label: 'Report Viewer' },
  { value: 'CANDIDATE', label: 'Candidate' },
];

export function InviteUserDialog({ orgId }: { orgId: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleRole = (role: Role) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await inviteUser(orgId, email, name || null, selectedRoles);
      setOpen(false);
      setEmail('');
      setName('');
      setSelectedRoles([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Invite User</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name (optional)</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Roles</Label>
            <div className="grid grid-cols-2 gap-2">
              {ALL_ROLES.map((role) => (
                <div key={role.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={role.value}
                    checked={selectedRoles.includes(role.value)}
                    onCheckedChange={() => toggleRole(role.value)}
                  />
                  <Label htmlFor={role.value} className="text-sm font-normal">
                    {role.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || selectedRoles.length === 0}>
              {loading ? 'Inviting...' : 'Invite'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 2: Create users list page**

Create `apps/admin/app/dashboard/users/page.tsx`:

```tsx
import { Role } from '@proctorguard/database';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Button,
} from '@proctorguard/ui';
import Link from 'next/link';
import { getOrganizationForUser } from '../../actions/dashboard';
import { getUsers } from '../../actions/users';
import { InviteUserDialog } from './invite-user-dialog';

const ROLE_COLORS: Record<Role, 'default' | 'secondary' | 'outline'> = {
  SUPER_ADMIN: 'default',
  ORG_ADMIN: 'default',
  EXAM_AUTHOR: 'secondary',
  EXAM_COORDINATOR: 'secondary',
  ENROLLMENT_MANAGER: 'secondary',
  PROCTOR_REVIEWER: 'secondary',
  QUALITY_ASSURANCE: 'outline',
  REPORT_VIEWER: 'outline',
  CANDIDATE: 'outline',
};

export default async function UsersPage() {
  const org = await getOrganizationForUser();
  const users = await getUsers(org.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-muted-foreground">Manage organization members and roles</p>
        </div>
        <InviteUserDialog orgId={org.id} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization Members</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name || '-'}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <Badge key={role} variant={ROLE_COLORS[role]}>
                          {role.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{new Date(user.joinedAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Link href={`/dashboard/users/${user.id}`}>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 3: Verify page loads**

Run: `npm run dev:admin`
Navigate to: http://localhost:3002/dashboard/users
Expected: Users table displays with invite button

**Step 4: Commit**

```bash
git add apps/admin/app/dashboard/users/
git commit -m "feat(admin): add users list page with invite dialog"
```

---

## Task 6: Build User Detail Page

**Files:**
- Create: `apps/admin/app/dashboard/users/[id]/page.tsx`
- Create: `apps/admin/app/dashboard/users/[id]/role-editor.tsx`

**Step 1: Create role editor component**

Create `apps/admin/app/dashboard/users/[id]/role-editor.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { Role } from '@proctorguard/database';
import { Button, Checkbox, Label } from '@proctorguard/ui';
import { updateUserRoles, removeUser } from '../../../actions/users';
import { useRouter } from 'next/navigation';

const ALL_ROLES: { value: Role; label: string }[] = [
  { value: 'ORG_ADMIN', label: 'Organization Admin' },
  { value: 'EXAM_AUTHOR', label: 'Exam Author' },
  { value: 'EXAM_COORDINATOR', label: 'Exam Coordinator' },
  { value: 'ENROLLMENT_MANAGER', label: 'Enrollment Manager' },
  { value: 'PROCTOR_REVIEWER', label: 'Proctor Reviewer' },
  { value: 'QUALITY_ASSURANCE', label: 'Quality Assurance' },
  { value: 'REPORT_VIEWER', label: 'Report Viewer' },
  { value: 'CANDIDATE', label: 'Candidate' },
];

interface RoleEditorProps {
  orgId: string;
  userId: string;
  currentRoles: Role[];
}

export function RoleEditor({ orgId, userId, currentRoles }: RoleEditorProps) {
  const router = useRouter();
  const [selectedRoles, setSelectedRoles] = useState<Role[]>(currentRoles);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  const toggleRole = (role: Role) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSave = async () => {
    setError('');
    setSaving(true);
    try {
      await updateUserRoles(orgId, userId, selectedRoles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update roles');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm('Are you sure you want to remove this user from the organization?')) return;
    setError('');
    setRemoving(true);
    try {
      await removeUser(orgId, userId);
      router.push('/dashboard/users');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove user');
      setRemoving(false);
    }
  };

  const hasChanges =
    selectedRoles.length !== currentRoles.length ||
    !selectedRoles.every((r) => currentRoles.includes(r));

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label className="text-base">Assigned Roles</Label>
        <div className="grid grid-cols-2 gap-4">
          {ALL_ROLES.map((role) => (
            <div key={role.value} className="flex items-center space-x-2">
              <Checkbox
                id={role.value}
                checked={selectedRoles.includes(role.value)}
                onCheckedChange={() => toggleRole(role.value)}
              />
              <Label htmlFor={role.value} className="font-normal">
                {role.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center justify-between">
        <Button
          variant="destructive"
          onClick={handleRemove}
          disabled={removing}
        >
          {removing ? 'Removing...' : 'Remove from Organization'}
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving || selectedRoles.length === 0 || !hasChanges}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
```

**Step 2: Create user detail page**

Create `apps/admin/app/dashboard/users/[id]/page.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle, Button } from '@proctorguard/ui';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getOrganizationForUser } from '../../../actions/dashboard';
import { getUser } from '../../../actions/users';
import { RoleEditor } from './role-editor';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function UserDetailPage({ params }: PageProps) {
  const { id } = await params;
  const org = await getOrganizationForUser();
  const user = await getUser(org.id, id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/users">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{user.name || user.email}</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{user.name || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Joined Organization</p>
              <p className="font-medium">{new Date(user.joinedAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Account Created</p>
              <p className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Role Management</CardTitle>
          </CardHeader>
          <CardContent>
            <RoleEditor orgId={org.id} userId={user.id} currentRoles={user.roles} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

**Step 3: Verify page loads**

Navigate to: http://localhost:3002/dashboard/users/[any-user-id]
Expected: User details with role checkboxes

**Step 4: Commit**

```bash
git add apps/admin/app/dashboard/users/
git commit -m "feat(admin): add user detail page with role management"
```

---

## Task 7: Create Server Actions for Departments

**Files:**
- Create: `apps/admin/app/actions/departments.ts`

**Step 1: Create department actions**

Create `apps/admin/app/actions/departments.ts`:

```typescript
'use server';

import { auth } from '@proctorguard/auth';
import { prisma } from '@proctorguard/database';
import { requirePermission, Permission } from '@proctorguard/permissions';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function getDepartments(orgId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  await requirePermission(
    { userId: session.user.id, organizationId: orgId },
    Permission.MANAGE_DEPARTMENTS
  );

  const departments = await prisma.department.findMany({
    where: { organizationId: orgId },
    orderBy: { name: 'asc' },
  });

  // Get member counts
  const memberCounts = await prisma.userRole.groupBy({
    by: ['departmentId'],
    where: { organizationId: orgId, departmentId: { not: null } },
    _count: { userId: true },
  });

  const countMap = memberCounts.reduce(
    (acc, item) => {
      if (item.departmentId) acc[item.departmentId] = item._count.userId;
      return acc;
    },
    {} as Record<string, number>
  );

  return departments.map((dept) => ({
    ...dept,
    memberCount: countMap[dept.id] || 0,
  }));
}

export async function createDepartment(orgId: string, name: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  await requirePermission(
    { userId: session.user.id, organizationId: orgId },
    Permission.MANAGE_DEPARTMENTS
  );

  if (!name.trim()) {
    throw new Error('Department name is required');
  }

  const department = await prisma.department.create({
    data: { name: name.trim(), organizationId: orgId },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'created',
      resource: 'department',
      resourceId: department.id,
      details: { name },
    },
  });

  revalidatePath('/dashboard/departments');
  return department;
}

export async function updateDepartment(orgId: string, deptId: string, name: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  await requirePermission(
    { userId: session.user.id, organizationId: orgId },
    Permission.MANAGE_DEPARTMENTS
  );

  if (!name.trim()) {
    throw new Error('Department name is required');
  }

  const department = await prisma.department.update({
    where: { id: deptId, organizationId: orgId },
    data: { name: name.trim() },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'updated',
      resource: 'department',
      resourceId: department.id,
      details: { name },
    },
  });

  revalidatePath('/dashboard/departments');
  return department;
}

export async function deleteDepartment(orgId: string, deptId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  await requirePermission(
    { userId: session.user.id, organizationId: orgId },
    Permission.MANAGE_DEPARTMENTS
  );

  // Check for members
  const memberCount = await prisma.userRole.count({
    where: { departmentId: deptId },
  });

  if (memberCount > 0) {
    throw new Error(`Cannot delete department with ${memberCount} assigned members`);
  }

  await prisma.department.delete({
    where: { id: deptId, organizationId: orgId },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'deleted',
      resource: 'department',
      resourceId: deptId,
    },
  });

  revalidatePath('/dashboard/departments');
  return { success: true };
}
```

**Step 2: Commit**

```bash
git add apps/admin/app/actions/departments.ts
git commit -m "feat(admin): add department management server actions"
```

---

## Task 8: Build Departments Page

**Files:**
- Create: `apps/admin/app/dashboard/departments/page.tsx`
- Create: `apps/admin/app/dashboard/departments/department-dialog.tsx`

**Step 1: Create department dialog component**

Create `apps/admin/app/dashboard/departments/department-dialog.tsx`:

```tsx
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  Button,
  Input,
  Label,
} from '@proctorguard/ui';
import { createDepartment, updateDepartment, deleteDepartment } from '../../actions/departments';

interface CreateDepartmentDialogProps {
  orgId: string;
}

export function CreateDepartmentDialog({ orgId }: CreateDepartmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await createDepartment(orgId, name);
      setOpen(false);
      setName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create department');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Department</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Department</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Department Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface EditDepartmentDialogProps {
  orgId: string;
  department: { id: string; name: string; memberCount: number };
}

export function EditDepartmentDialog({ orgId, department }: EditDepartmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(department.name);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await updateDepartment(orgId, department.id, name);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update department');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${department.name}"?`)) return;
    setError('');
    setDeleting(true);

    try {
      await deleteDepartment(orgId, department.id);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete department');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Edit</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Department</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Department Name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting || department.memberCount > 0}
              title={department.memberCount > 0 ? 'Cannot delete department with members' : undefined}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !name.trim()}>
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 2: Create departments page**

Create `apps/admin/app/dashboard/departments/page.tsx`:

```tsx
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@proctorguard/ui';
import { getOrganizationForUser } from '../../actions/dashboard';
import { getDepartments } from '../../actions/departments';
import { CreateDepartmentDialog, EditDepartmentDialog } from './department-dialog';

export default async function DepartmentsPage() {
  const org = await getOrganizationForUser();
  const departments = await getDepartments(org.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Departments</h1>
          <p className="text-muted-foreground">Organize users into departments</p>
        </div>
        <CreateDepartmentDialog orgId={org.id} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Departments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((dept) => (
                <TableRow key={dept.id}>
                  <TableCell className="font-medium">{dept.name}</TableCell>
                  <TableCell>{dept.memberCount}</TableCell>
                  <TableCell>{new Date(dept.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <EditDepartmentDialog orgId={org.id} department={dept} />
                  </TableCell>
                </TableRow>
              ))}
              {departments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No departments found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 3: Verify page loads**

Navigate to: http://localhost:3002/dashboard/departments
Expected: Department table with create/edit dialogs

**Step 4: Commit**

```bash
git add apps/admin/app/dashboard/departments/
git commit -m "feat(admin): add departments page with CRUD dialogs"
```

---

## Task 9: Update Navigation with Icons

**Files:**
- Modify: `apps/admin/app/dashboard/layout.tsx`

**Step 1: Add icons to nav items**

The DashboardShell supports icons but they're not being passed. Update `apps/admin/app/dashboard/layout.tsx`:

```tsx
import { auth } from '@proctorguard/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@proctorguard/ui';

const navItems = [
  { label: 'Overview', href: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Users', href: '/dashboard/users', icon: 'Users' },
  { label: 'Departments', href: '/dashboard/departments', icon: 'Building2' },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/auth/signin');

  return (
    <DashboardShell appName="Admin" navItems={navItems}>
      {children}
    </DashboardShell>
  );
}
```

**Step 2: Commit**

```bash
git add apps/admin/app/dashboard/layout.tsx
git commit -m "feat(admin): update nav with icons and rename to Overview"
```

---

## Task 10: Final Verification & Cleanup

**Step 1: Run full build**

Run: `npm run build`
Expected: All apps build successfully

**Step 2: Manual testing checklist**

Run: `npm run dev:admin`

Test each feature:
- [ ] Dashboard overview shows stats
- [ ] Users list displays members
- [ ] Invite user creates new user with roles
- [ ] User detail page loads
- [ ] Role checkboxes update correctly
- [ ] Remove user works
- [ ] Departments list displays
- [ ] Create department works
- [ ] Edit department renames
- [ ] Delete department works (for empty departments)

**Step 3: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix(admin): address any issues from testing"
```

---

## Summary

8 main implementation tasks:
1. Add UI components (Dialog, Table, Checkbox, Badge)
2. Dashboard stats server actions
3. Dashboard overview page
4. User management server actions
5. Users list page + invite dialog
6. User detail page + role editor
7. Department server actions
8. Departments page + CRUD dialogs

Total estimated time: 2-3 hours of focused implementation.
