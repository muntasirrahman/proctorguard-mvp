# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build, Lint, and Run Commands

```bash
# Development - runs all 5 apps concurrently (ports 3001-3005)
npm run dev

# Build all apps via Turborepo
npm run build

# Lint all packages
npm run lint

# Clean build artifacts
npm run clean

# Run a single app
npm run dev --workspace=@proctorguard/candidate

# Database commands (from root)
npm run db:generate   # Generate Prisma Client
npm run db:migrate    # Run migrations
npm run db:seed       # Seed demo data
npm run db:studio     # Open Prisma Studio
```

## Architecture Overview

ProctorGuard is an enterprise online proctoring platform built as a **Turborepo monorepo** with 5 Next.js apps and 5 shared packages.

### Applications (apps/)

Each app serves a specific user role and runs on its own port:

| App | Port | Role | Purpose |
|-----|------|------|---------|
| candidate | 3001 | CANDIDATE | Exam taking portal |
| admin | 3002 | ORG_ADMIN | Organization management |
| author | 3003 | EXAM_AUTHOR | Question bank creation |
| coordinator | 3004 | EXAM_COORDINATOR | Exam scheduling |
| reviewer | 3005 | PROCTOR_REVIEWER | Session review & proctoring |

### Shared Packages (packages/)

| Package | Import | Purpose |
|---------|--------|---------|
| database | `@proctorguard/database` | Prisma ORM + PostgreSQL schema |
| auth | `@proctorguard/auth` | Better Auth configuration |
| permissions | `@proctorguard/permissions` | 9-role RBAC system with 24 permissions |
| ui | `@proctorguard/ui` | shadcn/ui components (Button, Card, Input, Label) |
| config | `@proctorguard/config` | Shared app configuration |

## Key Files

- **Database schema**: `packages/database/prisma/schema.prisma`
- **Auth config**: `packages/auth/index.ts` (Better Auth with Prisma adapter)
- **Permissions matrix**: `packages/permissions/index.ts`
- **Turborepo config**: `turbo.json`
- **App middleware**: `apps/*/middleware.ts` (route protection)

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS, shadcn/ui
- **Backend**: Prisma 6 with PostgreSQL, Better Auth 1.1
- **Tooling**: Turborepo, TypeScript 5.7 (strict mode)

## RBAC System

9 roles with separation of duties (authors can't see exam takers, coordinators can't create questions):

- SUPER_ADMIN, ORG_ADMIN, EXAM_AUTHOR, EXAM_COORDINATOR
- ENROLLMENT_MANAGER, PROCTOR_REVIEWER, QUALITY_ASSURANCE
- REPORT_VIEWER, CANDIDATE

Permission checking functions in `packages/permissions/index.ts`:
- `hasPermission(userId, orgId, permission)`
- `hasAllPermissions()` / `hasAnyPermission()`
- `requirePermission()` - throws if unauthorized

## Database Models

**User Management**: User, UserRole, Organization, OrganizationMember, Department
**Content**: QuestionBank, Question
**Exams**: Exam, Enrollment, ExamSession, Answer
**Proctoring**: Flag, AuditLog

## Authentication

Better Auth configured with email/password, 7-day sessions, and automatic refresh. Protected routes via middleware - only `/`, `/auth/*`, and `/api/auth/*` are public.

## Environment Variables

Required in `.env`:
- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Random secret for sessions
- `BETTER_AUTH_URL` - App base URL

## Demo Accounts (after db:seed)

All accounts for ACME Corp org:
- admin@acme.com, author@acme.com, coordinator@acme.com
- enrollment@acme.com, reviewer@acme.com, candidate@acme.com
