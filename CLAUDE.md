# CLAUDE.md

Quick reference for working with the ProctorGuard MVP codebase.

## Project Info

**Type:** Turborepo monorepo
**Stack:** Next.js 16 + React 19 + Prisma + PostgreSQL + Better Auth
**Apps:** 2 (Candidate Portal + Staff Portal)

---

## Essential Commands

```bash
# Development
npm run dev                  # Start both apps (candidate + staff)
npm run dev:candidate        # Candidate only (port 4000)
npm run dev:staff            # Staff only (port 4001)

# Database
npm run db:migrate           # Run migrations
npm run db:seed              # Seed demo data (11 test users)
npm run db:studio            # Open Prisma Studio GUI

# Build
npm run build                # Build all apps
npm run lint                 # Lint all apps
```

---

## Database Access

### Local PostgreSQL

```
Host: localhost
Port: 5432
Database: proctorguard_dev
User: proctorguard_user
Password: ProctorGuard2024!Secure
```

**Connection String:**
```
postgresql://proctorguard_user:ProctorGuard2024!Secure@localhost:5432/proctorguard_dev
```

### Environment Variables

Create `packages/database/.env`:

```env
DATABASE_URL="postgresql://proctorguard_user:ProctorGuard2024!Secure@localhost:5432/proctorguard_dev?pgbouncer=true"
DIRECT_URL="postgresql://proctorguard_user:ProctorGuard2024!Secure@localhost:5432/proctorguard_dev"
```

---

## App Structure

```
apps/
├── candidate/          # Port 4000 - CANDIDATE role
└── staff/              # Port 4001 - All staff roles
    └── dashboard/
        ├── questions/      # EXAM_AUTHOR features
        ├── exams/          # EXAM_COORDINATOR features
        ├── sessions/       # PROCTOR_REVIEWER features
        └── admin/          # ORG_ADMIN features

packages/
├── database/           # @proctorguard/database - Prisma
├── auth/               # @proctorguard/auth - Better Auth
├── permissions/        # @proctorguard/permissions - RBAC
├── ui/                 # @proctorguard/ui - Components
└── config/             # @proctorguard/config - Types
```

---

## Code Patterns

### Authentication (Server Component)

```typescript
import { auth } from '@proctorguard/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function ProtectedPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/auth/signin');

  return <div>Protected content</div>;
}
```

### Permission Check (Server Action)

```typescript
'use server';

import { auth } from '@proctorguard/auth';
import { requirePermission, Permission } from '@proctorguard/permissions';
import { prisma } from '@proctorguard/database';
import { headers } from 'next/headers';

export async function createQuestion(data: QuestionData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  await requirePermission(
    { userId: session.user.id, organizationId: data.organizationId },
    Permission.CREATE_QUESTION
  );

  return await prisma.question.create({ data });
}
```

### Database Query

```typescript
import { prisma, QuestionStatus } from '@proctorguard/database';

const questionBanks = await prisma.questionBank.findMany({
  where: {
    authorId: session.user.id,
    organizationId: session.organization.id,
  },
  include: { questions: true }
});
```

---

## Package Imports

Always use scoped names:

```typescript
import { prisma, Role } from '@proctorguard/database';
import { auth } from '@proctorguard/auth';
import { requirePermission, Permission } from '@proctorguard/permissions';
import { Button, Card } from '@proctorguard/ui';
```

❌ Never: `import { prisma } from '../../../packages/database'`

---

## Demo Accounts

All passwords: `password123`

### Single-Role Users
- author@acme.com (EXAM_AUTHOR)
- coordinator@acme.com (EXAM_COORDINATOR)
- reviewer@acme.com (PROCTOR_REVIEWER)
- orgadmin@acme.com (ORG_ADMIN)
- candidate@acme.com (CANDIDATE)

### Multi-Role Users
- author-coordinator@acme.com (AUTHOR + COORDINATOR)
- coordinator-reviewer@acme.com (COORDINATOR + REVIEWER)
- admin-author@acme.com (ADMIN + AUTHOR)
- multirole@acme.com (All staff roles)

---

## Security Checklist

When writing server-side code:

- ✅ Check session with `auth.api.getSession()`
- ✅ Validate permissions with `requirePermission()`
- ✅ Never trust client-side data
- ✅ Use Prisma (never raw SQL)
- ✅ Filter by organizationId
- ✅ Log sensitive operations to AuditLog

---

## Key Roles & Permissions

| Role | Can Do |
|------|--------|
| EXAM_AUTHOR | Create questions & question banks |
| EXAM_COORDINATOR | Schedule exams, manage enrollments |
| PROCTOR_REVIEWER | Review flagged sessions |
| ORG_ADMIN | Manage users, roles, organization |
| CANDIDATE | Take exams |

**Permission system:** `packages/permissions/index.ts`

---

## Architecture Notes

**Staff Portal (2026-02-09):** Consolidated 4 legacy apps (admin, author, coordinator, reviewer) into unified portal with permission-based navigation. Multi-role users see all their sections in one place.

**Multi-role support:** Users can have multiple roles. Navigation shows aggregated permissions:
- Author + Coordinator → Questions + Exams sections
- Coordinator + Reviewer → Exams + Sessions sections

---

## Documentation

### Detailed Guides
- `docs/ARCHITECTURE.md` - System architecture & design patterns
- `docs/DATABASE.md` - Schema reference & queries
- `docs/DEVELOPMENT.md` - Development workflow & examples
- `docs/SECURITY.md` - Security guidelines & best practices

### Deployment
- `docs/STAFF-PORTAL-DEPLOYMENT.md` - Production deployment guide
- `docs/GETTING_STARTED.md` - Initial setup steps

### Planning & Design
- `docs/plans/` - Design documents & implementation plans
- `docs/testing/` - Test plans & results

---

## Quick Troubleshooting

**"Module not found" errors:**
```bash
npm run db:generate && npm install
```

**Database connection errors:**
```bash
psql -U proctorguard_user -d proctorguard_dev
# Verify DATABASE_URL in packages/database/.env
```

**TypeScript errors after schema change:**
```bash
npm run db:generate
# Restart TypeScript server in IDE
```

---

## Important Files

- `packages/database/prisma/schema.prisma` - Database schema
- `packages/permissions/index.ts` - RBAC permission matrix
- `packages/auth/index.ts` - Better Auth configuration
- `apps/staff/app/dashboard/layout.tsx` - Staff portal navigation

---

For complete details, see `docs/` directory.
