# Staff Portal Pre-Production Checklist

**Date:** 2026-02-10
**Test Phase:** Task 19 - Final Validation Before Production Deployment
**Purpose:** Comprehensive checklist to ensure Staff Portal is production-ready

## Overview

This checklist must be completed and signed off before deploying the Staff Portal to production. Each section must be verified and checked off.

---

## 1. Code Quality ✓

### Build & Compilation
- ☐ `npm run build` completes without errors
- ☐ No TypeScript errors
- ☐ No ESLint errors or warnings
- ☐ All imports resolve correctly
- ☐ No unused dependencies
- ☐ Bundle size is acceptable (< 1MB for main bundle)

### Code Review
- ☐ All code has been reviewed
- ☐ No hardcoded secrets or credentials
- ☐ No console.log statements in production code
- ☐ Error handling implemented for all critical paths
- ☐ Loading states implemented
- ☐ Empty states implemented

**Verification Commands:**
```bash
cd apps/staff
npm run build
npm run lint
```

**Notes:** _[Document any issues or exceptions]_

---

## 2. Functionality Testing ✓

### Authentication
- ☐ Sign in works with all test users
- ☐ Sign out clears session correctly
- ☐ Session persists across page refreshes
- ☐ Session expires after timeout
- ☐ Redirect to sign-in for unauthenticated users
- ☐ Redirect to dashboard after sign-in
- ☐ Remember me functionality (if implemented)

### Navigation
- ☐ All navigation links work
- ☐ Permission-based filtering works correctly
- ☐ Breadcrumbs display correctly
- ☐ Back button behavior is correct
- ☐ Active route highlighting works
- ☐ Mobile navigation works (if applicable)

### Admin Features
- ☐ User management: list, create, edit, delete
- ☐ Department management: list, create, edit, delete
- ☐ Organization settings: view, update
- ☐ Role assignment and removal
- ☐ Permission validation

### Author Features
- ☐ Question bank management: list, create, edit, delete
- ☐ Question creation: all types work
- ☐ Question editing: updates save correctly
- ☐ Status workflow: draft → review → approved
- ☐ Tag management

### Coordinator Features
- ☐ Exam management: list, create, edit, delete
- ☐ Enrollment management: invite, view, manage
- ☐ Exam scheduling: dates and times work
- ☐ Question bank selection
- ☐ Exam configuration saves correctly

### Reviewer Features
- ☐ Session list displays correctly
- ☐ Session detail page works
- ☐ Flag display works
- ☐ Review actions work (clear/violation)
- ☐ Notes can be added

**Notes:** _[Document any issues]_

---

## 3. Multi-Role Testing ✓

### Test User Combinations
- ☐ Author + Coordinator: sees Questions + Exams
- ☐ Coordinator + Reviewer: sees Exams + Sessions
- ☐ Admin + Author: sees Administration + Questions
- ☐ All staff roles: sees all sections
- ☐ Single-role users: see only their section

### Permission Validation
- ☐ Users can only access authorized sections
- ☐ Direct URL navigation is blocked for unauthorized sections
- ☐ Server actions validate permissions
- ☐ API endpoints check permissions
- ☐ No permission errors in console

### Cross-Role Workflows
- ☐ Author creates question bank → Coordinator uses it in exam
- ☐ Coordinator schedules exam → Reviewer reviews sessions
- ☐ Admin manages users → Users can sign in with new roles

**Test Users:**
```
author-coordinator@acme.com
coordinator-reviewer@acme.com
admin-author@acme.com
multirole@acme.com
```

**Notes:** _[Document test results]_

---

## 4. Security Testing ✓

### Authentication & Authorization
- ☐ Session tokens are HTTP-only cookies
- ☐ CSRF protection enabled
- ☐ XSS protection headers set
- ☐ Unauthorized API calls return 401/403
- ☐ Direct URL access requires authentication
- ☐ Permission checks on all server actions

### Input Validation
- ☐ Form inputs are validated client-side
- ☐ Form inputs are validated server-side
- ☐ SQL injection prevented (using Prisma)
- ☐ XSS prevented (React escaping)
- ☐ File upload validation (if applicable)

### Secrets Management
- ☐ No secrets in source code
- ☐ Environment variables properly configured
- ☐ `.env` file in `.gitignore`
- ☐ Production secrets rotated
- ☐ Database credentials secured

### Audit Logging
- ☐ Sensitive operations logged to AuditLog
- ☐ User actions tracked
- ☐ Failed login attempts logged
- ☐ Permission violations logged

**Security Scan:**
```bash
# Check for hardcoded secrets
grep -r "password\|secret\|api_key" apps/staff --exclude-dir=node_modules
# Should find no hardcoded credentials
```

**Notes:** _[Document security findings]_

---

## 5. Performance Testing ✓

### Page Load Times
- ☐ Dashboard loads in < 2 seconds
- ☐ Navigation transitions in < 500ms
- ☐ Form submissions in < 1 second
- ☐ Data fetches in < 3 seconds
- ☐ No layout shifts (CLS < 0.1)

### Bundle Size
- ☐ Initial JS bundle < 500KB (gzipped)
- ☐ Route-based code splitting implemented
- ☐ Images optimized
- ☐ Fonts optimized
- ☐ No duplicate dependencies

### Database Performance
- ☐ Queries have indexes on frequently accessed columns
- ☐ No N+1 query problems
- ☐ Connection pooling configured
- ☐ Query execution times acceptable (< 100ms)

### Lighthouse Scores
- ☐ Performance: > 90
- ☐ Accessibility: > 90
- ☐ Best Practices: > 90
- ☐ SEO: > 90 (if applicable)

**Performance Test Commands:**
```bash
# Build for production
npm run build

# Analyze bundle size
cd apps/staff/.next
du -sh ./static/chunks/*.js

# Run Lighthouse audit
npx lighthouse http://localhost:4001 --view
```

**Notes:** _[Document performance metrics]_

---

## 6. Browser Compatibility ✓

### Desktop Browsers
- ☐ Chrome (latest)
- ☐ Edge (latest)
- ☐ Firefox (latest)
- ☐ Safari (latest)

### Mobile Browsers (if applicable)
- ☐ Chrome Mobile
- ☐ Safari iOS
- ☐ Samsung Internet

### Responsive Design
- ☐ Desktop (1920x1080)
- ☐ Laptop (1366x768)
- ☐ Tablet (768x1024)
- ☐ Mobile (375x667)

**Notes:** _[Document browser-specific issues]_

---

## 7. Database Integrity ✓

### Migrations
- ☐ All migrations applied successfully
- ☐ Migration history is clean
- ☐ Rollback tested for latest migration
- ☐ No pending schema changes
- ☐ Prisma schema matches database

### Data Validation
- ☐ Foreign key constraints enforced
- ☐ Unique constraints work
- ☐ NOT NULL constraints enforced
- ☐ Check constraints work (if any)
- ☐ Cascade deletes configured correctly

### Seed Data
- ☐ Seed script runs without errors
- ☐ Demo users created correctly
- ☐ Multi-role users work
- ☐ Sample data is realistic

**Database Commands:**
```bash
# Check migration status
npm run db:migrate status

# Verify schema
cd packages/database
npx prisma validate

# Test seed
npm run db:seed
```

**Notes:** _[Document database state]_

---

## 8. Error Handling ✓

### User-Facing Errors
- ☐ Form validation errors displayed clearly
- ☐ Network errors handled gracefully
- ☐ 404 pages implemented
- ☐ 403 pages implemented
- ☐ 500 error page implemented
- ☐ Loading states shown during async operations

### Developer Errors
- ☐ Error logging configured
- ☐ Stack traces available in dev mode
- ☐ No sensitive data in error messages
- ☐ Error boundaries implemented
- ☐ Sentry or similar error tracking (if configured)

### Edge Cases
- ☐ Empty state displays
- ☐ No data scenarios handled
- ☐ Long content wraps properly
- ☐ Special characters handled
- ☐ Concurrent updates handled

**Notes:** _[Document error handling coverage]_

---

## 9. UI/UX Polish ✓

### Visual Consistency
- ☐ Colors match design system
- ☐ Typography consistent
- ☐ Spacing consistent
- ☐ Icons consistent
- ☐ Button styles consistent
- ☐ Form styles consistent

### Accessibility
- ☐ Keyboard navigation works
- ☐ Focus indicators visible
- ☐ ARIA labels present
- ☐ Alt text on images
- ☐ Color contrast meets WCAG AA
- ☐ Screen reader tested

### User Feedback
- ☐ Success toasts for actions
- ☐ Error messages for failures
- ☐ Loading spinners for async operations
- ☐ Disabled states for unavailable actions
- ☐ Confirmation dialogs for destructive actions

### Micro-interactions
- ☐ Hover states
- ☐ Active states
- ☐ Transition animations
- ☐ Loading animations
- ☐ Button click feedback

**Notes:** _[Document UX issues]_

---

## 10. Documentation ✓

### Code Documentation
- ☐ README.md updated
- ☐ CLAUDE.md updated with new structure
- ☐ API documentation (if applicable)
- ☐ Complex functions have comments
- ☐ Type definitions documented

### User Documentation
- ☐ User guide created (if needed)
- ☐ Admin guide created
- ☐ FAQ updated
- ☐ Changelog updated
- ☐ Migration guide for legacy app users

### Technical Documentation
- ☐ Architecture diagrams updated
- ☐ Database schema documented
- ☐ Deployment guide created
- ☐ Environment variables documented
- ☐ Troubleshooting guide created

**Documentation Files:**
- `README.md`
- `CLAUDE.md`
- `docs/plans/2026-02-09-staff-portal-consolidation-design.md`
- `docs/plans/staff-portal-rollback-plan.md`

**Notes:** _[Document documentation status]_

---

## 11. Deployment Preparation ✓

### Environment Configuration
- ☐ Production environment variables set
- ☐ Database connection string configured
- ☐ BETTER_AUTH_SECRET rotated
- ☐ BETTER_AUTH_URL set to production domain
- ☐ BLOB storage configured (if used)

### Build Configuration
- ☐ `next.config.ts` production-ready
- ☐ `outputFileTracingRoot` configured
- ☐ `transpilePackages` includes all required packages
- ☐ Environment-specific settings configured

### Vercel Configuration (if using)
- ☐ `vercel.json` created
- ☐ Build command configured
- ☐ Install command configured
- ☐ Output directory configured
- ☐ Environment variables set in Vercel dashboard

### DNS & SSL
- ☐ Domain registered
- ☐ DNS records configured
- ☐ SSL certificate provisioned
- ☐ HTTPS redirect enabled
- ☐ www redirect configured (if applicable)

**Notes:** _[Document deployment configuration]_

---

## 12. Monitoring & Observability ✓

### Logging
- ☐ Application logs configured
- ☐ Error logs captured
- ☐ Audit logs working
- ☐ Log retention policy set
- ☐ Log aggregation configured (optional)

### Monitoring
- ☐ Uptime monitoring configured
- ☐ Performance monitoring enabled
- ☐ Error tracking enabled
- ☐ User analytics (if desired)
- ☐ Database monitoring

### Alerts
- ☐ Error rate alerts configured
- ☐ Downtime alerts configured
- ☐ Performance degradation alerts
- ☐ Database connection alerts
- ☐ On-call rotation established

**Notes:** _[Document monitoring setup]_

---

## 13. Backup & Recovery ✓

### Database Backups
- ☐ Automated backups configured
- ☐ Backup frequency: daily minimum
- ☐ Backup retention: 30 days minimum
- ☐ Backup restoration tested
- ☐ Point-in-time recovery available

### Disaster Recovery
- ☐ Rollback plan documented
- ☐ Previous deployment preserved
- ☐ Database rollback tested
- ☐ Recovery time objective (RTO) defined
- ☐ Recovery point objective (RPO) defined

### Code Repository
- ☐ Code pushed to remote
- ☐ Production branch protected
- ☐ Release tagged
- ☐ Git history preserved
- ☐ Rollback commits ready

**Notes:** _[Document backup strategy]_

---

## 14. Legal & Compliance ✓

### Privacy
- ☐ Privacy policy updated
- ☐ GDPR compliance (if applicable)
- ☐ Data retention policy defined
- ☐ User data deletion process
- ☐ Cookie policy (if applicable)

### Terms of Service
- ☐ Terms of service updated
- ☐ User agreements displayed
- ☐ Consent mechanism implemented

### Security
- ☐ Security audit completed (if required)
- ☐ Penetration testing (if required)
- ☐ Vulnerability scan (if required)
- ☐ Compliance certifications (if required)

**Notes:** _[Document compliance status]_

---

## 15. Stakeholder Sign-Off ✓

### Technical Team
- ☐ Lead developer approval
- ☐ QA approval
- ☐ DevOps approval
- ☐ Security team approval (if applicable)

### Product Team
- ☐ Product manager approval
- ☐ Design team approval
- ☐ User acceptance testing complete

### Management
- ☐ Engineering manager approval
- ☐ Business stakeholder approval
- ☐ Budget approval for production costs

**Sign-Offs:**

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Lead Developer | | | |
| QA Engineer | | | |
| Product Manager | | | |
| Engineering Manager | | | |

**Notes:** _[Document any conditions or concerns]_

---

## Pre-Production Test Execution

### Test Environment
```bash
# Start staff portal in production mode
npm run build
npm run start
```

### Smoke Test Script
```bash
#!/bin/bash

echo "🧪 Running pre-production smoke tests..."

# Test 1: Staff portal builds
cd apps/staff && npm run build
if [ $? -eq 0 ]; then
  echo "✅ Staff portal builds successfully"
else
  echo "❌ Staff portal build failed"
  exit 1
fi

# Test 2: No TypeScript errors
npx tsc --noEmit
if [ $? -eq 0 ]; then
  echo "✅ No TypeScript errors"
else
  echo "❌ TypeScript errors found"
  exit 1
fi

# Test 3: No ESLint errors
npm run lint
if [ $? -eq 0 ]; then
  echo "✅ No ESLint errors"
else
  echo "❌ ESLint errors found"
  exit 1
fi

# Test 4: Database migrations are up to date
cd ../../packages/database
npx prisma migrate status
if [ $? -eq 0 ]; then
  echo "✅ Database migrations up to date"
else
  echo "❌ Database migration issues"
  exit 1
fi

echo "🎉 All smoke tests passed!"
```

---

## Production Deployment Checklist

### Pre-Deployment
- ☐ All checklist items above completed
- ☐ Stakeholder sign-off obtained
- ☐ Deployment window scheduled
- ☐ Team notified of deployment
- ☐ Rollback plan reviewed

### During Deployment
- ☐ Backup database before deployment
- ☐ Deploy to production
- ☐ Run database migrations
- ☐ Verify deployment successful
- ☐ Smoke test production environment

### Post-Deployment
- ☐ Monitor error rates (first 15 minutes)
- ☐ Verify key features work
- ☐ Check performance metrics
- ☐ Monitor user feedback
- ☐ Document any issues

### Rollback Criteria
Rollback immediately if:
- ☐ Error rate > 5%
- ☐ Critical feature broken
- ☐ Database corruption
- ☐ Security vulnerability discovered
- ☐ Performance degradation > 50%

**Notes:** _[Document deployment timeline]_

---

## Final Approval

### Production Readiness Assessment

**Overall Status:** ☐ READY / ☐ NOT READY

**Completed Sections:**
- Code Quality: ☐
- Functionality Testing: ☐
- Multi-Role Testing: ☐
- Security Testing: ☐
- Performance Testing: ☐
- Browser Compatibility: ☐
- Database Integrity: ☐
- Error Handling: ☐
- UI/UX Polish: ☐
- Documentation: ☐
- Deployment Preparation: ☐
- Monitoring & Observability: ☐
- Backup & Recovery: ☐
- Legal & Compliance: ☐
- Stakeholder Sign-Off: ☐

**Blocking Issues:** _[List any issues that prevent production deployment]_

**Non-Blocking Issues:** _[List any issues that can be fixed post-deployment]_

**Go/No-Go Decision:**
- ☐ GO - Deploy to production
- ☐ NO-GO - Address blocking issues first

**Decision Made By:** _[Name]_
**Date:** _[Date]_

---

**Pre-Production Checklist Complete**
