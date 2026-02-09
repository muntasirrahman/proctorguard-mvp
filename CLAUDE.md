# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository

**Path**: `/Users/muntasir/workspace/proctor-exam/proctor-exam-mvp`
**Type**: Turborepo monorepo
**Stack**: Next.js 16 + React 19 + Prisma + PostgreSQL + Better Auth

## Commands

```bash
# Development
npm run dev                  # Run both apps in parallel (candidate + staff)
npm run dev:candidate        # Run candidate app only (port 4000)
npm run dev:staff            # Run staff portal (port 4001)

# Legacy apps (deprecated - use staff portal instead)
npm run dev:admin            # Run admin app only (port 4001) - DEPRECATED
npm run dev:author           # Run author app only (port 4002) - DEPRECATED
npm run dev:coordinator      # Run coordinator app only (port 4003) - DEPRECATED
npm run dev:reviewer         # Run reviewer app only (port 4004) - DEPRECATED

# Build & Lint
npm run build                # Build all apps with Turborepo
npm run lint                 # Lint all apps
npm run clean                # Clean build artifacts

# Database (run from monorepo root)
npm run db:generate          # Generate Prisma Client after schema changes
npm run db:migrate           # Create and run migrations
npm run db:seed              # Seed demo data (7 test users)
npm run db:studio            # Open Prisma Studio GUI

# Individual app commands (from apps/[app-name]/)
npm run dev                  # Start dev server
npm run build                # Build for production
npm run lint                 # ESLint
```

## Architecture

### Monorepo Structure

```
proctor-exam-mvp/
├── apps/                    # 2 Next.js applications
│   ├── candidate/          # Port 4000 - CANDIDATE role
│   ├── staff/              # Port 4001 - All staff roles (NEW)
│   │                       # Unified portal for: ORG_ADMIN, EXAM_AUTHOR,
│   │                       # EXAM_COORDINATOR, PROCTOR_REVIEWER
│   │
│   ├── admin/              # DEPRECATED - migrated to staff portal
│   ├── author/             # DEPRECATED - migrated to staff portal
│   ├── coordinator/        # DEPRECATED - migrated to staff portal
│   └── reviewer/           # DEPRECATED - migrated to staff portal
│
└── packages/               # Shared code
    ├── database/          # @proctorguard/database - Prisma client
    ├── auth/              # @proctorguard/auth - Better Auth config
    ├── permissions/       # @proctorguard/permissions - RBAC system
    ├── ui/                # @proctorguard/ui - shadcn/ui components
    └── config/            # @proctorguard/config - Shared types
```

**Architecture Change (2026-02-09):** Consolidated 4 staff apps into unified Staff Portal with dynamic permission-based navigation. Multi-role users now access all their features in one place. See `docs/plans/2026-02-09-staff-portal-consolidation-design.md`.

### Critical Design Patterns

#### 1. Separation of Duties (Enforced by Architecture)

Each app serves ONE role with strict permission boundaries:

- **Authors** create questions but CANNOT see who takes exams or enrollments
- **Coordinators** schedule exams but CANNOT create questions
- **Enrollment Managers** invite candidates but CANNOT configure exams
- **Reviewers** adjudicate flags but CANNOT create content

This is enforced at three levels:
1. **Separate apps** - each app only surfaces features for its role
2. **Database permissions** - `packages/permissions/index.ts` RBAC matrix
3. **Server-side checks** - all Server Actions must validate permissions

#### 2. Authentication Flow (Better Auth)

**Each app has three required files**:

1. `/app/api/auth/[...all]/route.ts` - Auth API handler
   ```typescript
   import { auth } from '@proctorguard/auth';
   import { toNextJsHandler } from 'better-auth/next-js';

   export const { POST, GET } = toNextJsHandler(auth);
   ```

2. `/middleware.ts` - Route protection
   ```typescript
   // Checks 'better-auth.session_token' cookie
   // Redirects unauthenticated users to /auth/signin
   ```

3. `/next.config.ts` - Monorepo file tracing
   ```typescript
   {
     outputFileTracingRoot: path.join(__dirname, '../../'),
     transpilePackages: ['@proctorguard/*'],
   }
   ```

**Getting session in Server Components**:
```typescript
import { auth } from '@proctorguard/auth';
import { headers } from 'next/headers';

const session = await auth.api.getSession({ headers: await headers() });
if (!session) redirect('/auth/signin');
```

#### 3. Permission Checks (RBAC)

**Always validate permissions server-side in Server Actions**:

```typescript
'use server';

import { auth } from '@proctorguard/auth';
import { requirePermission, Permission } from '@proctorguard/permissions';
import { headers } from 'next/headers';

export async function createQuestion(data: QuestionData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  await requirePermission(
    { userId: session.user.id, organizationId: data.organizationId },
    Permission.CREATE_QUESTION
  );

  // Now safe to proceed
}
```

**Permission system is in** `packages/permissions/index.ts`:
- `ROLE_PERMISSIONS` - matrix of which roles have which permissions
- `hasPermission()` - check single permission
- `hasAllPermissions()` - check multiple permissions
- `requirePermission()` - throw if permission denied
- Resource helpers: `canAccessQuestionBank()`, `canAccessExam()`, `canAccessSession()`

#### 4. Database Access Pattern

**Prisma client is ONLY available through** `@proctorguard/database`:

```typescript
import { prisma, Role, QuestionStatus } from '@proctorguard/database';

const questionBanks = await prisma.questionBank.findMany({
  where: { authorId: session.user.id },
  include: { questions: true }
});
```

**After schema changes**:
1. Edit `packages/database/prisma/schema.prisma`
2. Run `npm run db:migrate` (creates migration + generates client)
3. Prisma Client is automatically available in all packages

#### 5. Multi-Role User System

**Key database models**:
- `User` - authentication record (Better Auth manages this)
- `UserRole` - junction table for user-organization-role assignments
- Users can have MULTIPLE roles in ONE organization
- Users can belong to MULTIPLE organizations

**Getting user's roles**:
```typescript
import { getUserRoles, getUserPermissions } from '@proctorguard/permissions';

const roles = await getUserRoles(userId, organizationId);
const permissions = await getUserPermissions(userId, organizationId);
```

## Database Schema (Key Points)

**9 Roles** (in `Role` enum):
- `SUPER_ADMIN` - full platform access
- `ORG_ADMIN` - organization management
- `EXAM_AUTHOR` - content creation only
- `EXAM_COORDINATOR` - exam scheduling only
- `ENROLLMENT_MANAGER` - candidate invitations only
- `PROCTOR_REVIEWER` - session review only
- `QUALITY_ASSURANCE` - audit and approval
- `REPORT_VIEWER` - read-only analytics
- `CANDIDATE` - exam taker

**Core Models**:
- `Organization` → `Department` → `UserRole` → `User`
- `QuestionBank` → `Question`
- `Exam` → `Enrollment` → `ExamSession` → `Answer` + `Flag`
- `AuditLog` - tracks all sensitive operations

**Enums to know**:
- `QuestionStatus`: DRAFT, IN_REVIEW, APPROVED, REJECTED, ARCHIVED
- `ExamStatus`: DRAFT, SCHEDULED, ACTIVE, COMPLETED, CANCELLED, ARCHIVED
- `SessionStatus`: NOT_STARTED, IN_PROGRESS, COMPLETED, FLAGGED, UNDER_REVIEW, CLEARED, VIOLATION_CONFIRMED
- `FlagType`: NO_FACE_DETECTED, MULTIPLE_FACES, LOOKING_AWAY, PHONE_DETECTED, etc.

## Development Workflow

### Adding a New Feature

1. **Update schema** (if needed):
   ```bash
   # Edit packages/database/prisma/schema.prisma
   npm run db:migrate
   ```

2. **Add permissions** (if needed):
   ```typescript
   // In packages/permissions/index.ts
   export enum Permission {
     NEW_PERMISSION = 'new_permission',
   }

   // Add to relevant roles in ROLE_PERMISSIONS
   ```

3. **Create Server Actions** with permission checks:
   ```typescript
   // Always import from packages
   import { auth } from '@proctorguard/auth';
   import { requirePermission } from '@proctorguard/permissions';
   import { prisma } from '@proctorguard/database';
   ```

4. **Use UI components** from shared package:
   ```typescript
   import { Button, Card, Input } from '@proctorguard/ui';
   ```

### Monorepo Package Imports

**All shared packages are scoped as** `@proctorguard/*`:

```typescript
import { prisma, Role } from '@proctorguard/database';
import { auth } from '@proctorguard/auth';
import { requirePermission, Permission } from '@proctorguard/permissions';
import { Button, Card } from '@proctorguard/ui';
```

**Never import directly from** `../packages/...` - use package names.

### Demo Accounts (After `npm run db:seed`)

| Email | Password | Role | App |
|-------|----------|------|-----|
| admin@acme.com | password123 | SUPER_ADMIN | Any |
| orgadmin@acme.com | password123 | ORG_ADMIN | Admin (4001) |
| author@acme.com | password123 | EXAM_AUTHOR | Author (4002) |
| coordinator@acme.com | password123 | EXAM_COORDINATOR | Coordinator (4003) |
| enrollment@acme.com | password123 | ENROLLMENT_MANAGER | Admin (4001) |
| reviewer@acme.com | password123 | PROCTOR_REVIEWER | Reviewer (4004) |
| candidate@acme.com | password123 | CANDIDATE | Candidate (4000) |

Organization: "ACME Corporation" (ID will vary)

## Security Checklist

When writing server-side code:

- ✅ Check session with `auth.api.getSession()`
- ✅ Validate permissions with `requirePermission()` or `hasPermission()`
- ✅ Never trust client-side data - validate in Server Actions
- ✅ Use Prisma (parameterized queries) - never raw SQL
- ✅ Log sensitive operations to `AuditLog` table
- ✅ Enforce resource ownership (e.g., authors can only edit their own question banks)

## Deployment Notes

**Environment Variables Required**:
```env
DATABASE_URL="postgresql://..."      # Pooled connection
DIRECT_URL="postgresql://..."        # Direct connection (for migrations)
BETTER_AUTH_SECRET="random-secret"   # Generate with: openssl rand -base64 32
BETTER_AUTH_URL="https://..."        # Production URL
BLOB_READ_WRITE_TOKEN="..."          # Vercel Blob (optional)
```

**Vercel Deployment**:
- Each app deploys independently
- Set `outputFileTracingRoot` ensures shared packages are included
- Run migrations on Vercel Postgres: `npm run db:migrate`

## Known Issues & Fixes

See `docs/FIXES_APPLIED.md` for Context7-documented fixes:
1. ✅ Monorepo file tracing configured
2. ✅ Better Auth API routes created
3. ✅ Route protection middleware added
4. ✅ Database permissions granted

## Additional Documentation

- `README.md` - Quick reference and setup
- `docs/GETTING_STARTED.md` - Step-by-step setup guide
- `docs/FIXES_APPLIED.md` - Recent fixes from Context7 review
- `docs/DEPLOYMENT.md` - Deployment guide
- `proctorguard_prd.json` - Product requirements (in parent directory)
- `packages/database/prisma/schema.prisma` - Complete data model
- `packages/permissions/index.ts` - Full permission matrix
