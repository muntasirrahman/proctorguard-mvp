# ProctorGuard Architecture

**Last Updated:** 2026-02-10

## Overview

ProctorGuard is a Turborepo monorepo with 2 Next.js applications and 5 shared packages.

---

## Application Structure

### Current Apps (Production)

```
apps/
├── candidate/              # Port 4000 - CANDIDATE role
│   └── Exam taking portal for test-takers
│
└── staff/                  # Port 4001 - All staff roles
    └── Unified portal for: ORG_ADMIN, EXAM_AUTHOR,
        EXAM_COORDINATOR, PROCTOR_REVIEWER
```

### Deprecated Apps (Legacy)

The following apps have been consolidated into the Staff Portal (2026-02-09):
- `apps/admin/` → `apps/staff/app/dashboard/admin/`
- `apps/author/` → `apps/staff/app/dashboard/questions/`
- `apps/coordinator/` → `apps/staff/app/dashboard/exams/`
- `apps/reviewer/` → `apps/staff/app/dashboard/sessions/`

**See:** `docs/plans/2026-02-09-staff-portal-consolidation-design.md`

---

## Shared Packages

```
packages/
├── database/           # @proctorguard/database
│   ├── Prisma Client
│   ├── Schema definitions
│   └── Migrations
│
├── auth/               # @proctorguard/auth
│   ├── Better Auth configuration
│   ├── Session management
│   └── Auth handlers
│
├── permissions/        # @proctorguard/permissions
│   ├── RBAC system
│   ├── Permission matrix
│   └── Role helpers
│
├── ui/                 # @proctorguard/ui
│   ├── shadcn/ui components
│   ├── Shared UI primitives
│   └── Design system
│
└── config/             # @proctorguard/config
    └── Shared TypeScript types
```

---

## Design Principles

### 1. Separation of Duties

Each role has distinct capabilities enforced at multiple levels:

**Authors** (EXAM_AUTHOR)
- ✅ Create and manage question banks
- ❌ Cannot see exam schedules or candidate enrollments
- ❌ Cannot review proctoring sessions

**Coordinators** (EXAM_COORDINATOR)
- ✅ Schedule exams and manage enrollments
- ❌ Cannot create questions or question banks
- ❌ Cannot review proctoring sessions

**Reviewers** (PROCTOR_REVIEWER)
- ✅ Review flagged exam sessions
- ❌ Cannot create content or schedule exams
- ❌ Cannot manage enrollments

**Admins** (ORG_ADMIN)
- ✅ Manage users, roles, and organization settings
- ❌ Cannot create exam content (unless also EXAM_AUTHOR)

**Enforcement Layers:**
1. **UI Layer** - Permission-based navigation (Staff Portal)
2. **API Layer** - Server Actions validate permissions
3. **Data Layer** - Database permissions via `@proctorguard/permissions`

---

### 2. Multi-Role User System

Users can have multiple roles in one organization:

```typescript
// Example: A teacher who creates questions AND schedules exams
UserRole {
  userId: "user-123"
  organizationId: "org-456"
  role: EXAM_AUTHOR
}
UserRole {
  userId: "user-123"
  organizationId: "org-456"
  role: EXAM_COORDINATOR
}
```

**Staff Portal dynamically shows sections based on aggregated permissions:**
- Author + Coordinator → Questions + Exams sections
- Coordinator + Reviewer → Exams + Sessions sections
- Admin + Author + Coordinator + Reviewer → All sections

---

### 3. Authentication Flow

**Better Auth v1.4.17** handles authentication across all apps.

**Required Files (per app):**

1. `/app/api/auth/[...all]/route.ts`
   ```typescript
   import { auth } from '@proctorguard/auth';
   import { toNextJsHandler } from 'better-auth/next-js';

   export const { POST, GET } = toNextJsHandler(auth);
   ```

2. `/middleware.ts`
   ```typescript
   // Checks 'better-auth.session_token' cookie
   // Redirects unauthenticated users to /auth/signin
   ```

3. `/next.config.ts`
   ```typescript
   {
     outputFileTracingRoot: path.join(__dirname, '../../'),
     transpilePackages: ['@proctorguard/*'],
   }
   ```

**Session Management:**
```typescript
// Server Components
import { auth } from '@proctorguard/auth';
import { headers } from 'next/headers';

const session = await auth.api.getSession({ headers: await headers() });
if (!session) redirect('/auth/signin');
```

```typescript
// Client Components
import { useSession } from '@proctorguard/auth/client';

const { data: session } = useSession();
```

---

### 4. Permission System (RBAC)

**Location:** `packages/permissions/index.ts`

**Key Functions:**
- `getUserRoles(userId, orgId)` - Get user's roles in organization
- `getUserPermissions(userId, orgId)` - Get aggregated permissions
- `hasPermission(context, permission)` - Check single permission
- `hasAllPermissions(context, permissions)` - Check multiple permissions
- `requirePermission(context, permission)` - Throw if denied

**Example:**
```typescript
import { requirePermission, Permission } from '@proctorguard/permissions';

export async function createQuestion(data: QuestionData) {
  const session = await auth.api.getSession({ headers: await headers() });

  await requirePermission(
    { userId: session.user.id, organizationId: data.organizationId },
    Permission.CREATE_QUESTION
  );

  // Proceed with creation
}
```

**Permission Matrix:**
```typescript
ROLE_PERMISSIONS = {
  EXAM_AUTHOR: [
    Permission.VIEW_QUESTION_BANK,
    Permission.CREATE_QUESTION_BANK,
    Permission.CREATE_QUESTION,
    // ...
  ],
  EXAM_COORDINATOR: [
    Permission.CREATE_EXAM,
    Permission.SCHEDULE_EXAM,
    Permission.INVITE_CANDIDATE,
    // ...
  ],
  // ...
}
```

---

### 5. Database Access

**Prisma Client** is centralized in `@proctorguard/database`:

```typescript
import { prisma, Role, QuestionStatus } from '@proctorguard/database';

const questionBanks = await prisma.questionBank.findMany({
  where: { authorId: session.user.id },
  include: { questions: true }
});
```

**Schema Updates:**
1. Edit `packages/database/prisma/schema.prisma`
2. Run `npm run db:migrate`
3. Prisma Client auto-regenerates

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| UI Library | React 19 |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | Better Auth v1.4.17 |
| Styling | Tailwind CSS |
| Components | shadcn/ui |
| Monorepo | Turborepo |
| Deployment | Vercel (recommended) |

---

## File Organization

### Staff Portal Structure

```
apps/staff/
├── app/
│   ├── (auth)/
│   │   ├── signin/
│   │   └── signup/
│   ├── dashboard/
│   │   ├── layout.tsx           # Permission-based navigation
│   │   ├── page.tsx             # Dashboard home
│   │   ├── questions/           # Author features
│   │   │   ├── page.tsx
│   │   │   ├── new/
│   │   │   └── [id]/
│   │   ├── exams/               # Coordinator features
│   │   │   ├── page.tsx
│   │   │   ├── new/
│   │   │   └── [id]/
│   │   ├── sessions/            # Reviewer features
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   └── admin/               # Admin features
│   │       ├── users/
│   │       ├── departments/
│   │       └── settings/
│   └── actions/
│       ├── questions/           # Question bank actions
│       ├── exams/               # Exam management actions
│       ├── sessions/            # Session review actions
│       └── admin/               # Admin actions
├── middleware.ts
└── next.config.ts
```

---

## Deployment Architecture

### Recommended Setup

```
Production:
├── staff.proctorguard.com       → Staff Portal (apps/staff)
└── exam.proctorguard.com        → Candidate Portal (apps/candidate)

Staging:
├── staff-staging.proctorguard.com
└── exam-staging.proctorguard.com
```

### Shared Resources

Both apps share:
- PostgreSQL database
- Better Auth secret (enables SSO)
- Session table (shared authentication)
- Prisma schema

**Result:** Single sign-on across both portals

---

## Related Documentation

- `docs/DATABASE.md` - Database schema and relationships
- `docs/DEVELOPMENT.md` - Development workflow and patterns
- `docs/SECURITY.md` - Security guidelines and checklist
- `docs/STAFF-PORTAL-DEPLOYMENT.md` - Deployment procedures
- `docs/plans/` - Design documents and implementation plans
