# Security Guidelines

**Last Updated:** 2026-02-10

## Security Checklist

When writing server-side code, always follow these security practices:

### Authentication
- ✅ Check session with `auth.api.getSession()`
- ✅ Redirect unauthenticated users to `/auth/signin`
- ✅ Never trust client-provided user IDs
- ✅ Always get user ID from session token

### Authorization
- ✅ Validate permissions with `requirePermission()` or `hasPermission()`
- ✅ Check permissions in ALL server actions
- ✅ Check permissions in ALL API routes
- ✅ Verify resource ownership before mutations

### Input Validation
- ✅ Never trust client-side data
- ✅ Validate ALL inputs in server actions
- ✅ Sanitize user input before database operations
- ✅ Use TypeScript types for compile-time safety
- ✅ Use Zod or similar for runtime validation

### Database Security
- ✅ Use Prisma (parameterized queries)
- ✅ NEVER use raw SQL with user input
- ✅ Use transactions for multi-step operations
- ✅ Enforce resource ownership in queries
- ✅ Filter by organizationId to prevent cross-org access

### Audit Logging
- ✅ Log sensitive operations to `AuditLog` table
- ✅ Include userId, action, resource, resourceId
- ✅ Log authentication attempts (success and failure)
- ✅ Log permission violations

### Data Protection
- ✅ Never expose sensitive data in URLs
- ✅ Never log passwords or auth tokens
- ✅ Use environment variables for secrets
- ✅ Never commit `.env` files to git

---

## Authentication Patterns

### Server Component Authentication

```typescript
import { auth } from '@proctorguard/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function ProtectedPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/auth/signin');

  return <div>Welcome, {session.user.name}</div>;
}
```

### Server Action Authentication

```typescript
'use server';

import { auth } from '@proctorguard/auth';
import { headers } from 'next/headers';

export async function sensitiveAction() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  const userId = session.user.id;
  // ...
}
```

---

## Authorization Patterns

### Permission Checks

```typescript
'use server';

import { requirePermission, Permission } from '@proctorguard/permissions';

export async function createQuestion(data: QuestionData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  await requirePermission(
    { userId: session.user.id, organizationId: data.organizationId },
    Permission.CREATE_QUESTION
  );

  await prisma.question.create({ data });
}
```

### Resource Ownership Verification

```typescript
export async function updateQuestionBank(id: string, data: UpdateData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  const questionBank = await prisma.questionBank.findUnique({ where: { id } });
  if (!questionBank) throw new Error('Not found');

  // Verify ownership
  if (questionBank.authorId !== session.user.id) {
    throw new Error('You can only edit your own question banks');
  }

  await requirePermission(
    { userId: session.user.id, organizationId: questionBank.organizationId },
    Permission.EDIT_QUESTION_BANK
  );

  await prisma.questionBank.update({ where: { id }, data });
}
```

---

## Input Validation Patterns

### Basic Validation

```typescript
export async function createExam(data: ExamData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  if (!data.title || data.title.trim().length === 0) {
    throw new Error('Title is required');
  }

  if (!data.duration || data.duration < 1 || data.duration > 480) {
    throw new Error('Duration must be between 1 and 480 minutes');
  }

  await requirePermission(
    { userId: session.user.id, organizationId: data.organizationId },
    Permission.CREATE_EXAM
  );

  return await prisma.exam.create({ data });
}
```

---

## Database Security Patterns

### Filtering by Organization

```typescript
// ✅ Always filter by organizationId
const exams = await prisma.exam.findMany({
  where: {
    organizationId: session.organization.id,
    status: ExamStatus.ACTIVE,
  },
});

// ❌ Never fetch without organizationId filter
```

### Using Transactions

```typescript
await prisma.$transaction(async (tx) => {
  await tx.enrollment.create({ data });
  await tx.auditLog.create({ data });
});
```

---

## Audit Logging

Always log sensitive operations:

```typescript
await prisma.auditLog.create({
  data: {
    userId: session.user.id,
    organizationId: 'org-id',
    action: 'UPDATE_ROLE',
    resource: 'USER_ROLE',
    resourceId: userId,
    metadata: { newRole },
  },
});
```

---

## Common Vulnerabilities

### SQL Injection

```typescript
// ❌ NEVER do this
await prisma.$queryRaw`SELECT * FROM User WHERE email = ${userInput}`;

// ✅ Use Prisma queries
await prisma.user.findMany({ where: { email: userInput } });
```

### XSS Prevention

```typescript
// ✅ React automatically escapes
<div>{userInput}</div>

// ✅ Use DOMPurify for HTML content
import DOMPurify from 'isomorphic-dompurify';
<div>{DOMPurify.sanitize(userInput)}</div>
```

### Insecure Direct Object References

```typescript
// ❌ Don't trust client IDs without verification
export async function deleteQuestion(id: string) {
  await prisma.question.delete({ where: { id } });
}

// ✅ Verify ownership and permissions
export async function deleteQuestion(id: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  const question = await prisma.question.findUnique({
    where: { id },
    include: { questionBank: true },
  });

  if (question.questionBank.authorId !== session.user.id) {
    throw new Error('Not authorized');
  }

  await prisma.question.delete({ where: { id } });
}
```

---

## Environment Variables

### Never Commit Secrets

```bash
# Add to .gitignore
.env
.env.local
.env.production
```

### Required Variables

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
BETTER_AUTH_SECRET="use-openssl-rand-base64-32"
BETTER_AUTH_URL="http://localhost:4001"
```

---

## Production Checklist

- ☐ All secrets rotated
- ☐ HTTPS enforced
- ☐ Security headers configured
- ☐ Rate limiting enabled
- ☐ Error logging configured
- ☐ Audit logging enabled
- ☐ Database backups configured
- ☐ Monitoring configured

---

## Related Documentation

- `docs/ARCHITECTURE.md` - Permission system
- `docs/DATABASE.md` - Database schema
- `docs/DEVELOPMENT.md` - Development workflow
