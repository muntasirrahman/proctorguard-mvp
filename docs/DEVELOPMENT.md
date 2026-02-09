# Development Guide

**Last Updated:** 2026-02-10

## Quick Start

```bash
# Install dependencies
npm install

# Start dev servers
npm run dev                  # Both apps (candidate + staff)
npm run dev:candidate        # Candidate only (port 4000)
npm run dev:staff            # Staff only (port 4001)

# Database
npm run db:migrate           # Run migrations
npm run db:seed              # Seed demo data
npm run db:studio            # Open Prisma Studio
```

---

## Development Workflow

### 1. Adding a New Feature

#### Step 1: Update Database Schema (if needed)

```bash
# Edit packages/database/prisma/schema.prisma
nano packages/database/prisma/schema.prisma

# Create migration
npm run db:migrate

# Migration will auto-generate Prisma Client
```

#### Step 2: Add Permissions (if needed)

Edit `packages/permissions/index.ts`:

```typescript
export enum Permission {
  // Existing permissions...
  NEW_FEATURE_VIEW = 'new_feature_view',
  NEW_FEATURE_CREATE = 'new_feature_create',
  NEW_FEATURE_EDIT = 'new_feature_edit',
}

// Add to relevant roles
ROLE_PERMISSIONS = {
  EXAM_AUTHOR: [
    // Existing permissions...
    Permission.NEW_FEATURE_CREATE,
  ],
  // ...
}
```

#### Step 3: Create Server Actions

Create actions file (e.g., `apps/staff/app/actions/new-feature/actions.ts`):

```typescript
'use server';

import { auth } from '@proctorguard/auth';
import { requirePermission, Permission } from '@proctorguard/permissions';
import { prisma } from '@proctorguard/database';
import { headers } from 'next/headers';

export async function createNewFeature(data: NewFeatureData) {
  // 1. Get session
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  // 2. Check permission
  await requirePermission(
    { userId: session.user.id, organizationId: data.organizationId },
    Permission.NEW_FEATURE_CREATE
  );

  // 3. Validate input
  if (!data.title || data.title.length < 3) {
    throw new Error('Title must be at least 3 characters');
  }

  // 4. Create resource
  const newFeature = await prisma.newFeature.create({
    data: {
      title: data.title,
      organizationId: data.organizationId,
      createdBy: session.user.id,
    },
  });

  // 5. Log audit trail
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      organizationId: data.organizationId,
      action: 'CREATE',
      resource: 'NEW_FEATURE',
      resourceId: newFeature.id,
    },
  });

  return newFeature;
}
```

#### Step 4: Create UI Components

Create page (e.g., `apps/staff/app/dashboard/new-feature/page.tsx`):

```typescript
import { auth } from '@proctorguard/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { NewFeatureForm } from './new-feature-form';

export default async function NewFeaturePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/auth/signin');

  return (
    <div>
      <h1>New Feature</h1>
      <NewFeatureForm />
    </div>
  );
}
```

Create form component (e.g., `new-feature-form.tsx`):

```typescript
'use client';

import { useState } from 'react';
import { Button, Input, Card } from '@proctorguard/ui';
import { createNewFeature } from '../actions/new-feature/actions';

export function NewFeatureForm() {
  const [title, setTitle] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createNewFeature({ title, organizationId: 'org-123' });
      alert('Success!');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter title"
        />
        <Button type="submit">Create</Button>
      </form>
    </Card>
  );
}
```

---

### 2. Package Import Guidelines

**Always use scoped package names:**

```typescript
// ✅ Correct
import { prisma, Role } from '@proctorguard/database';
import { auth } from '@proctorguard/auth';
import { requirePermission, Permission } from '@proctorguard/permissions';
import { Button, Card, Input } from '@proctorguard/ui';

// ❌ Wrong
import { prisma } from '../../../packages/database';
import { auth } from '../../packages/auth';
```

---

### 3. Adding New Navigation Items

Edit staff portal dashboard layout (`apps/staff/app/dashboard/layout.tsx`):

```typescript
const navigation = [
  {
    label: "New Feature",
    icon: IconName,
    items: [
      {
        label: "View All",
        href: "/dashboard/new-feature",
        permission: Permission.NEW_FEATURE_VIEW
      },
      {
        label: "Create",
        href: "/dashboard/new-feature/new",
        permission: Permission.NEW_FEATURE_CREATE
      },
    ]
  },
  // ... existing items
];
```

Navigation automatically filters based on user permissions.

---

### 4. Testing Changes

#### Manual Testing

```bash
# Start dev server
npm run dev:staff

# Sign in with test user
# author@acme.com / password123 (for EXAM_AUTHOR features)
# coordinator@acme.com / password123 (for EXAM_COORDINATOR features)
```

#### Database Testing

```bash
# Open Prisma Studio
npm run db:studio

# Manually test queries
# View data, create records, test relationships
```

---

## Common Development Tasks

### Resetting Database

```bash
# Reset and re-seed (DESTROYS ALL DATA)
cd packages/database
npx prisma migrate reset --force

# Then re-run migrations and seed
npm run db:migrate
npm run db:seed
```

### Generating Prisma Client

```bash
# After schema changes
npm run db:generate
```

### Viewing Database

```bash
# Prisma Studio GUI
npm run db:studio

# PostgreSQL CLI
psql postgresql://proctorguard_user:ProctorGuard2024!Secure@localhost:5432/proctorguard_dev
```

### Building for Production

```bash
# Build all apps
npm run build

# Build specific app
cd apps/staff
npm run build
```

### Linting

```bash
# Lint all apps
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

---

## Code Style Guidelines

### Server Actions

- ✅ Always use `'use server'` directive
- ✅ Always check session
- ✅ Always validate permissions
- ✅ Always validate input
- ✅ Log sensitive operations to AuditLog
- ✅ Use try-catch for error handling
- ✅ Return serializable data only

### Server Components

- ✅ Check session at page level
- ✅ Redirect unauthenticated users
- ✅ Fetch data server-side
- ✅ Pass data to client components as props

### Client Components

- ✅ Use `'use client'` directive
- ✅ Handle loading states
- ✅ Handle error states
- ✅ Show user feedback (toasts, alerts)
- ✅ Never call Prisma directly
- ✅ Call server actions for mutations

### Database Queries

- ✅ Use Prisma (never raw SQL)
- ✅ Use transactions for multi-step operations
- ✅ Include relations sparingly (avoid N+1)
- ✅ Use pagination for lists
- ✅ Filter by user context (organizationId, userId)

---

## Troubleshooting

### "Module not found" errors

```bash
# Regenerate Prisma Client
npm run db:generate

# Reinstall dependencies
rm -rf node_modules
npm install
```

### Monorepo package not found

```bash
# Verify package.json has workspace protocol
"dependencies": {
  "@proctorguard/database": "workspace:*"
}

# Rebuild monorepo
npm run build
```

### Database connection errors

```bash
# Check PostgreSQL is running
psql -U proctorguard_user -d proctorguard_dev

# Verify DATABASE_URL in .env
cat packages/database/.env
```

### TypeScript errors after schema change

```bash
# Regenerate Prisma Client
npm run db:generate

# Restart TypeScript server in IDE
# VS Code: Cmd+Shift+P -> "TypeScript: Restart TS Server"
```

---

## Demo Accounts

After running `npm run db:seed`:

### Single-Role Users

| Email | Password | Role | Use Case |
|-------|----------|------|----------|
| author@acme.com | password123 | EXAM_AUTHOR | Create questions |
| coordinator@acme.com | password123 | EXAM_COORDINATOR | Schedule exams |
| reviewer@acme.com | password123 | PROCTOR_REVIEWER | Review sessions |
| orgadmin@acme.com | password123 | ORG_ADMIN | Manage organization |
| candidate@acme.com | password123 | CANDIDATE | Take exams |

### Multi-Role Users

| Email | Password | Roles | Visible Sections |
|-------|----------|-------|------------------|
| author-coordinator@acme.com | password123 | AUTHOR + COORDINATOR | Questions + Exams |
| coordinator-reviewer@acme.com | password123 | COORDINATOR + REVIEWER | Exams + Sessions |
| admin-author@acme.com | password123 | ADMIN + AUTHOR | Admin + Questions |
| multirole@acme.com | password123 | All staff roles | All sections |

Organization: "ACME Corporation"

---

## Environment Variables

### Development

Create `packages/database/.env`:

```env
DATABASE_URL="postgresql://proctorguard_user:ProctorGuard2024!Secure@localhost:5432/proctorguard_dev?pgbouncer=true"
DIRECT_URL="postgresql://proctorguard_user:ProctorGuard2024!Secure@localhost:5432/proctorguard_dev"
```

Create `apps/staff/.env.local`:

```env
BETTER_AUTH_SECRET="your-secret-key-here"
BETTER_AUTH_URL="http://localhost:4001"
```

### Production

See `docs/STAFF-PORTAL-DEPLOYMENT.md`

---

## Related Documentation

- `docs/ARCHITECTURE.md` - Architecture overview
- `docs/DATABASE.md` - Database schema reference
- `docs/SECURITY.md` - Security guidelines
- `docs/STAFF-PORTAL-DEPLOYMENT.md` - Deployment guide
