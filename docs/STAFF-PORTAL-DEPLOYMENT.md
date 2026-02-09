# Staff Portal Deployment Guide

**Last Updated:** 2026-02-10
**Version:** 1.0
**Status:** Production Ready

## Overview

This guide covers deploying the unified Staff Portal to production. The Staff Portal consolidates 4 legacy apps (Admin, Author, Coordinator, Reviewer) into a single application with permission-based navigation.

---

## Architecture

### Application Structure
- **Staff Portal** (apps/staff) - Port 4001 - All staff roles
- **Candidate Portal** (apps/candidate) - Port 4000 - Candidate role

### Technology Stack
- Next.js 16 (App Router)
- React 19
- Prisma ORM
- PostgreSQL
- Better Auth v1.4.17
- Vercel (recommended hosting)

---

## Pre-Deployment Checklist

Before deploying, ensure you've completed:
- ✅ All tests pass (see `docs/testing/`)
- ✅ Code builds without errors
- ✅ Database migrations are ready
- ✅ Environment variables documented
- ✅ Rollback plan reviewed
- ✅ Stakeholder approval obtained

See `docs/testing/staff-portal-pre-production-checklist.md` for full checklist.

---

## Environment Variables

### Required Variables

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:5432/database"

# Authentication
BETTER_AUTH_SECRET="<generate-with-openssl-rand-base64-32>"
BETTER_AUTH_URL="https://staff.proctorguard.com"

# Optional
BLOB_READ_WRITE_TOKEN="<vercel-blob-token>"
NODE_ENV="production"
```

### Generating Secrets

```bash
# Generate BETTER_AUTH_SECRET
openssl rand -base64 32
```

---

## Deployment to Vercel (Recommended)

### Initial Setup

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login and Link:**
   ```bash
   vercel login
   cd apps/staff
   vercel link
   ```

3. **Set Environment Variables:**
   ```bash
   vercel env add DATABASE_URL production
   vercel env add DIRECT_URL production
   vercel env add BETTER_AUTH_SECRET production
   vercel env add BETTER_AUTH_URL production
   ```

### Deploy

```bash
cd apps/staff
vercel --prod
```

### Post-Deployment

1. Run database migrations:
   ```bash
   cd packages/database
   DATABASE_URL="<production-url>" npx prisma migrate deploy
   ```

2. Verify deployment at https://staff.proctorguard.com

---

## Database Migration

```bash
# Backup first
pg_dump -h <host> -U <user> -d <database> > backup-$(date +%Y%m%d).sql

# Run migrations
cd packages/database
DATABASE_URL="<production-url>" npx prisma migrate deploy

# Verify
DATABASE_URL="<production-url>" npx prisma migrate status
```

---

## DNS Configuration

| Subdomain | Purpose |
|-----------|---------|
| staff.proctorguard.com | Staff Portal |
| exam.proctorguard.com | Candidate Portal |

---

## Monitoring

### Recommended Tools
- Uptime: UptimeRobot, Pingdom
- Errors: Sentry
- Performance: Vercel Analytics
- Logs: Logtail, Papertrail

---

## Rollback Procedure

### Quick Rollback

```bash
# Vercel
vercel rollback

# Database
psql -h <host> -U <user> -d <database> < backup-20260209.sql
```

See `docs/plans/staff-portal-rollback-plan.md` for detailed procedures.

---

## Post-Deployment Verification

### Smoke Tests

1. Visit https://staff.proctorguard.com
2. Sign in with test account
3. Verify all sections load
4. Test core features

### Monitoring (First 24 Hours)

- ✅ Error rate < 1%
- ✅ Response time < 500ms
- ✅ No authentication failures

---

## Troubleshooting

### Build Fails on Vercel

**Issue:** Cannot find module '@proctorguard/database'

**Solution:**
- Verify `outputFileTracingRoot` in next.config.ts
- Check `transpilePackages` includes all workspace packages

### Authentication Errors

**Issue:** Users can't sign in

**Solution:**
- Verify `BETTER_AUTH_URL` matches deployment domain
- Check `BETTER_AUTH_SECRET` is set

---

## Security Hardening

- ✅ HTTPS enforced
- ✅ Security headers configured
- ✅ Secrets secured
- ✅ Audit logging enabled

---

## Maintenance

- **Database backups:** Daily at 2:00 AM UTC
- **Dependency updates:** Weekly
- **Security patches:** As needed
- **Feature releases:** Bi-weekly

---

## Key Documents

- Design: `docs/plans/2026-02-09-staff-portal-consolidation-design.md`
- Implementation: `docs/plans/2026-02-09-staff-portal-consolidation-implementation.md`
- Rollback: `docs/plans/staff-portal-rollback-plan.md`
- Testing: `docs/testing/`

---

**Deploy with confidence! 🚀**
