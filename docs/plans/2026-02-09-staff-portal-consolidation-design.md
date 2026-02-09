# Staff Portal Consolidation Design

**Date:** 2026-02-09
**Status:** Design Approved
**Author:** Muntasir Rahman

## Executive Summary

Consolidate 4 separate staff applications (Admin, Author, Coordinator, Reviewer) into a single unified Staff Portal to improve UX for multi-role users while maintaining the separate Candidate Portal.

**Current State:** 5 separate Next.js apps
- Admin (port 4001) - ORG_ADMIN
- Author (port 4002) - EXAM_AUTHOR
- Coordinator (port 4003) - EXAM_COORDINATOR
- Reviewer (port 4004) - PROCTOR_REVIEWER
- Candidate (port 4000) - CANDIDATE

**Target State:** 2 Next.js apps
- **Staff Portal** (port 4001) - ADMIN, EXAM_AUTHOR, EXAM_COORDINATOR, PROCTOR_REVIEWER
- **Candidate Portal** (port 4000) - CANDIDATE (unchanged)

**Key Insight:** Multi-role users are very common (50%+ of users). Current architecture forces unnecessary app-switching for users who are both authors AND coordinators, or coordinators AND reviewers.

---

## Design Rationale

### Problem Statement

Users frequently have multiple staff roles:
- A teacher creates questions (AUTHOR) and schedules exams (COORDINATOR)
- A department head manages users (ADMIN) and reviews sessions (REVIEWER)
- An exam coordinator schedules exams and manages enrollments

Forcing these users to switch between 4 separate applications creates significant UX friction.

### Why Two Apps (Not One)?

**Candidate role must remain separate because:**
- Candidates are external users (students, test-takers)
- Staff are internal users (teachers, administrators, reviewers)
- Completely different UX paradigms
- Security boundary: candidates should never see staff features
- Conflict of interest: staff members who take exams should have a clear separation

### Why Not Keep Five Apps?

**Current pain points:**
- Multi-role users switch apps constantly
- Duplicate layouts, navigation, auth code across 4 staff apps
- Harder to maintain consistency
- Deployment overhead (4 staff deployments)

---

## Architecture Design

### High-Level Structure

```
apps/
├── staff/              # NEW - Unified Staff Portal
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── signin/
│   │   │   └── signup/
│   │   ├── dashboard/
│   │   │   ├── questions/      # Author features
│   │   │   ├── exams/          # Coordinator features
│   │   │   ├── sessions/       # Reviewer features
│   │   │   ├── admin/          # Admin features
│   │   │   └── layout.tsx      # Unified layout with dynamic nav
│   │   ├── actions/
│   │   │   ├── questions/      # Question bank actions
│   │   │   ├── exams/          # Exam management actions
│   │   │   ├── sessions/       # Session review actions
│   │   │   └── admin/          # Admin actions
│   │   └── api/auth/[...all]/
│   ├── middleware.ts
│   └── next.config.ts
│
└── candidate/          # UNCHANGED - Existing Candidate Portal
    └── (existing structure)
```

### Permission System (No Changes Required)

The existing `@proctorguard/permissions` package already supports multi-role users perfectly:

```typescript
// Existing code already aggregates permissions from all roles
const permissions = await getUserPermissions(userId, organizationId);
// Returns union of permissions from all user's roles

// Navigation just checks permissions, not roles
if (await hasPermission(context, Permission.CREATE_QUESTION)) {
  // Show "Create Question" in nav
}
```

**Key insight:** We're not changing the permission system - just the UI that consumes it.

---

## Navigation Design

### Dynamic Permission-Based Navigation

The Staff Portal will display a unified sidebar navigation that shows sections based on the user's aggregated permissions:

```typescript
// Navigation structure
const navigation = [
  {
    label: "Questions",
    icon: FileQuestion,
    items: [
      {
        label: "Question Banks",
        href: "/dashboard/questions",
        permission: Permission.VIEW_QUESTION_BANK
      },
      {
        label: "Create Question Bank",
        href: "/dashboard/questions/new",
        permission: Permission.CREATE_QUESTION_BANK
      },
      {
        label: "Review Queue",
        href: "/dashboard/questions/review",
        permission: Permission.APPROVE_QUESTION
      },
    ]
  },
  {
    label: "Exams",
    icon: Calendar,
    items: [
      {
        label: "All Exams",
        href: "/dashboard/exams",
        permission: Permission.VIEW_EXAM_CONFIG
      },
      {
        label: "Create Exam",
        href: "/dashboard/exams/new",
        permission: Permission.CREATE_EXAM
      },
      {
        label: "Enrollments",
        href: "/dashboard/enrollments",
        permission: Permission.VIEW_ENROLLMENTS
      },
    ]
  },
  {
    label: "Sessions",
    icon: Video,
    items: [
      {
        label: "Review Sessions",
        href: "/dashboard/sessions",
        permission: Permission.REVIEW_SESSION
      },
      {
        label: "Flagged Sessions",
        href: "/dashboard/sessions/flagged",
        permission: Permission.RESOLVE_FLAG
      },
    ]
  },
  {
    label: "Administration",
    icon: Settings,
    items: [
      {
        label: "Users",
        href: "/dashboard/admin/users",
        permission: Permission.MANAGE_USERS
      },
      {
        label: "Departments",
        href: "/dashboard/admin/departments",
        permission: Permission.MANAGE_DEPARTMENTS
      },
      {
        label: "Reports",
        href: "/dashboard/reports",
        permission: Permission.VIEW_REPORTS
      },
      {
        label: "Audit Logs",
        href: "/dashboard/admin/audit",
        permission: Permission.VIEW_AUDIT_LOGS
      },
    ]
  }
];

// Filter navigation client-side
const filteredNav = filterNavigationByPermissions(navigation, userPermissions);
```

### What Different Users See

| User Roles | Visible Navigation Sections |
|-----------|----------------------------|
| EXAM_AUTHOR only | Questions |
| EXAM_COORDINATOR only | Exams |
| PROCTOR_REVIEWER only | Sessions |
| ORG_ADMIN only | Administration |
| AUTHOR + COORDINATOR | Questions + Exams |
| COORDINATOR + REVIEWER | Exams + Sessions |
| ADMIN + AUTHOR + COORDINATOR + REVIEWER | All sections (full navigation) |

**Design principle:** Keep it simple. No role badges, no role switcher, no complexity. Users see what they can do based on their aggregated permissions.

---

## Migration Strategy

### Consolidation Approach

**Phase 1: Create Staff Portal Shell**
1. Create `apps/staff/` directory
2. Copy auth setup from `apps/admin/` (Better Auth config, middleware)
3. Set up base dashboard with dynamic navigation component
4. Deploy to staging, verify auth and navigation filtering works

**Phase 2: Migrate Features by Domain**

Consolidate features in order of risk (lowest first):

1. **Admin Features** (from `apps/admin/`)
   - User management (`/dashboard/admin/users`)
   - Organization settings (`/dashboard/admin/settings`)
   - Department management (`/dashboard/admin/departments`)
   - Reports (`/dashboard/reports`)
   - Server actions: `apps/admin/app/actions/` → `apps/staff/app/actions/admin/`

2. **Author Features** (from `apps/author/`)
   - Question bank list (`/dashboard/questions`)
   - Question bank creation (`/dashboard/questions/new`)
   - Question editing (`/dashboard/questions/[id]`)
   - Server actions: `apps/author/app/actions/` → `apps/staff/app/actions/questions/`

3. **Coordinator Features** (from `apps/coordinator/`)
   - Exam list (`/dashboard/exams`)
   - Exam creation (`/dashboard/exams/new`)
   - Exam detail and enrollment management (`/dashboard/exams/[id]`)
   - Server actions: `apps/coordinator/app/actions/` → `apps/staff/app/actions/exams/`

4. **Reviewer Features** (from `apps/reviewer/`)
   - Session list (`/dashboard/sessions`)
   - Session review (`/dashboard/sessions/[id]`)
   - Flag resolution (`/dashboard/sessions/flagged`)
   - Server actions: `apps/reviewer/app/actions/` → `apps/staff/app/actions/sessions/`

**Phase 3: Update Shared Packages**
- Update `@proctorguard/ui` navigation component to support dynamic permission-based rendering
- No changes needed to `@proctorguard/permissions`, `@proctorguard/auth`, or `@proctorguard/database`

**Phase 4: Deprecate Old Apps**
- Remove `apps/admin/`, `apps/author/`, `apps/coordinator/`, `apps/reviewer/`
- Keep code in git history for rollback if needed
- Update root `package.json` scripts
- Update documentation

### File Organization Pattern

```
apps/staff/app/
├── dashboard/
│   ├── questions/           # Author domain
│   │   ├── page.tsx        # List question banks
│   │   ├── new/
│   │   │   └── page.tsx    # Create question bank
│   │   └── [id]/
│   │       ├── page.tsx    # Question bank detail
│   │       └── edit/       # Edit questions
│   │
│   ├── exams/              # Coordinator domain
│   │   ├── page.tsx        # List exams
│   │   ├── new/
│   │   │   └── page.tsx    # Create exam
│   │   └── [id]/
│   │       ├── page.tsx    # Exam detail
│   │       └── enrollments/ # Enrollment management
│   │
│   ├── sessions/           # Reviewer domain
│   │   ├── page.tsx        # List sessions
│   │   ├── flagged/        # Flagged sessions
│   │   └── [id]/
│   │       └── page.tsx    # Session review
│   │
│   └── admin/              # Admin domain
│       ├── users/
│       ├── departments/
│       ├── settings/
│       └── audit/
│
└── actions/
    ├── questions/          # Author actions
    │   ├── questionBanks.ts
    │   └── questions.ts
    ├── exams/              # Coordinator actions
    │   ├── exams.ts
    │   └── enrollments.ts
    ├── sessions/           # Reviewer actions
    │   ├── sessions.ts
    │   └── flags.ts
    └── admin/              # Admin actions
        ├── users.ts
        ├── departments.ts
        └── organizations.ts
```

---

## Deployment & Routing

### Deployment Options

**Recommended: Separate Subdomains**
- Staff Portal: `staff.proctorguard.com` or `app.proctorguard.com`
- Candidate Portal: `exam.proctorguard.com` or `candidate.proctorguard.com`

**Benefits:**
- Clear separation
- Easier routing
- Independent scaling
- Simpler to reason about

**Alternative: Path-Based Routing**
- Staff Portal: `proctorguard.com/staff/*`
- Candidate Portal: `proctorguard.com/candidate/*`

Requires reverse proxy or monorepo deployment with path routing.

### Vercel Deployment

Deploy both apps independently:

```json
// apps/staff/vercel.json
{
  "buildCommand": "cd ../.. && npx turbo run build --filter=staff",
  "installCommand": "cd ../.. && npm install",
  "framework": null
}

// apps/candidate/vercel.json
{
  "buildCommand": "cd ../.. && npx turbo run build --filter=candidate",
  "installCommand": "cd ../.. && npm install",
  "framework": null
}
```

### Environment Variables

Both apps share the same environment variables:
- `DATABASE_URL` - Shared PostgreSQL database
- `DIRECT_URL` - Direct database connection for migrations
- `BETTER_AUTH_SECRET` - Shared auth secret (enables SSO)
- `BETTER_AUTH_URL` - Set per app:
  - Staff: `https://staff.proctorguard.com`
  - Candidate: `https://exam.proctorguard.com`

### Session Sharing (Single Sign-On)

Both apps use the same Better Auth configuration:
- **Same cookie domain**: `.proctorguard.com`
- **Shared session table**: Both apps query the same `Session` table in database
- **Result**: Log in once, authenticated in both portals automatically

---

## Edge Cases & Special Considerations

### Multi-Portal Users (Staff + Candidate)

**Scenario:** A teaching assistant who creates questions (EXAM_AUTHOR) and also takes certification exams (CANDIDATE).

**Solution:**

```typescript
// Login redirect logic
async function redirectAfterLogin(user) {
  const roles = await getUserRoles(user.id, orgId);

  const staffRoles = ['ADMIN', 'EXAM_AUTHOR', 'EXAM_COORDINATOR', 'PROCTOR_REVIEWER'];
  const hasStaffRole = roles.some(role => staffRoles.includes(role));
  const hasCandidateRole = roles.includes('CANDIDATE');

  if (hasStaffRole && hasCandidateRole) {
    // Rare edge case: user has both staff and candidate roles
    // Default to staff portal with link to candidate portal in navigation
    return '/staff/dashboard';
  } else if (hasStaffRole) {
    return '/staff/dashboard';
  } else {
    return '/candidate/dashboard';
  }
}
```

**UX for dual-role users:**
- Staff portal adds a "Take Exams" menu item that links to candidate portal
- Seamless transition due to shared auth session
- Clear context switch when moving between portals

### Permission Inheritance

When a user has multiple staff roles:

```typescript
// User has EXAM_AUTHOR + EXAM_COORDINATOR
const permissions = await getUserPermissions(userId, orgId);
// Returns union of permissions from both roles:
// [
//   Permission.CREATE_QUESTION_BANK,
//   Permission.EDIT_QUESTION_BANK,
//   Permission.CREATE_EXAM,
//   Permission.SCHEDULE_EXAM,
//   Permission.INVITE_CANDIDATE,
//   // ... etc
// ]
```

Navigation automatically shows all sections the user has access to.

### Data Access Patterns

**No database changes needed!** Existing queries already support multi-role users:

- Question banks filtered by `authorId` - authors see only their banks
- Exams filtered by `coordinatorId` or `organizationId` - coordinators see org exams
- Permission checks happen in server actions (already implemented)
- Resource-based access control helpers work as-is (`canAccessQuestionBank`, `canAccessExam`, etc.)

**The consolidation is purely UI/UX - the security model stays intact.**

### Handling Role-Specific Features

Some features are role-specific even within a domain:

**Example: Exam List Page**

```typescript
// /dashboard/exams/page.tsx
export default async function ExamsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const permissions = await getUserPermissions(session.user.id, orgId);

  // Different users see different views of the same page
  const canCreate = permissions.includes(Permission.CREATE_EXAM);
  const canViewAll = permissions.includes(Permission.VIEW_EXAM_CONFIG);
  const canInvite = permissions.includes(Permission.INVITE_CANDIDATE);

  return (
    <div>
      <h1>Exams</h1>

      {canCreate && <CreateExamButton />}

      <ExamList
        exams={exams}
        canInvite={canInvite}
        canEdit={canCreate}
      />
    </div>
  );
}
```

Features are enabled/disabled based on permissions, not roles.

---

## Testing Strategy

### Feature Parity Testing

For each migrated feature domain, verify:
- ✅ Same functionality as original app
- ✅ Permission checks work correctly
- ✅ Multi-role users see correct navigation
- ✅ Server actions validate permissions properly
- ✅ Data isolation maintained (authors see only their question banks, etc.)

### Test Matrix

| User Role Combination | Expected Navigation Sections | Notes |
|----------------------|----------------------------|-------|
| ORG_ADMIN only | Administration | Full admin access |
| EXAM_AUTHOR only | Questions | Can create/edit question banks |
| EXAM_COORDINATOR only | Exams | Can schedule exams, manage enrollments |
| PROCTOR_REVIEWER only | Sessions | Can review sessions, resolve flags |
| AUTHOR + COORDINATOR | Questions + Exams | Most common multi-role combination |
| COORDINATOR + REVIEWER | Exams + Sessions | Can schedule and review |
| ADMIN + AUTHOR | Questions + Administration | Admin who also creates content |
| ADMIN + AUTHOR + COORDINATOR + REVIEWER | All sections | Power user with full access |

### Integration Testing

**Cross-feature workflows:**
1. Create question bank (author) → Create exam using that bank (coordinator)
2. Create exam (coordinator) → Review flagged session from that exam (reviewer)
3. Invite candidate (coordinator) → View enrollment in admin reports (admin)

**Session sharing:**
1. Log in to staff portal
2. Navigate to candidate portal (if dual-role user)
3. Verify no re-authentication required
4. Sign out from one portal
5. Verify signed out from both portals

**Permission-based UI:**
1. Log in as user with EXAM_AUTHOR role only
2. Verify "Questions" section visible, others hidden
3. Navigate to `/dashboard/exams` directly
4. Verify redirected or shown "no access" message
5. Add EXAM_COORDINATOR role to user
6. Refresh browser
7. Verify "Exams" section now visible

### Automated Testing

```typescript
// Example: Navigation filter test
describe('Staff Portal Navigation', () => {
  it('shows only Questions for EXAM_AUTHOR', async () => {
    const user = await createUser({ roles: ['EXAM_AUTHOR'] });
    const permissions = await getUserPermissions(user.id, orgId);
    const nav = filterNavigationByPermissions(navigation, permissions);

    expect(nav).toHaveLength(1);
    expect(nav[0].label).toBe('Questions');
  });

  it('shows Questions + Exams for AUTHOR + COORDINATOR', async () => {
    const user = await createUser({ roles: ['EXAM_AUTHOR', 'EXAM_COORDINATOR'] });
    const permissions = await getUserPermissions(user.id, orgId);
    const nav = filterNavigationByPermissions(navigation, permissions);

    expect(nav).toHaveLength(2);
    expect(nav.map(n => n.label)).toEqual(['Questions', 'Exams']);
  });

  it('shows all sections for ADMIN', async () => {
    const user = await createUser({ roles: ['ORG_ADMIN'] });
    const permissions = await getUserPermissions(user.id, orgId);
    const nav = filterNavigationByPermissions(navigation, permissions);

    expect(nav).toHaveLength(4);
  });
});
```

---

## Rollout Plan

### Timeline

**Week 1: Build Staff Portal Shell**
- Create `apps/staff/` with auth, layout, navigation
- Deploy to staging with dynamic nav (no features yet)
- Test with demo accounts (single-role and multi-role)
- Verify permission-based navigation filtering works

**Week 2: Migrate Admin Features**
- Copy user management, organization settings, departments
- Test admin workflows
- Deploy to staging

**Week 3: Migrate Author Features**
- Copy question bank creation, question editing
- Test question workflows
- Verify authors only see their own question banks

**Week 4: Migrate Coordinator Features**
- Copy exam creation, scheduling, enrollment management
- Test exam workflows
- Verify coordinators see organization exams

**Week 5: Migrate Reviewer Features**
- Copy session review, flag resolution
- Test review workflows
- Verify reviewers can access sessions for their organization

**Week 6: Parallel Run & Testing**
- Both old apps (4001-4004) and new staff portal running
- Internal team uses new staff portal for all daily work
- Monitor for issues, compare behavior against old apps
- Collect feedback from multi-role users

**Week 7: Production Cutover**
- Switch production DNS/routing to staff portal
- Deprecate old apps (keep code in git for rollback)
- Monitor error rates, user feedback
- Keep old deployment alive for 1 week as safety net

**Week 8: Cleanup**
- Delete old app code from repository
- Update documentation
- Archive old deployments

### Rollback Plan

If critical issues are discovered:

**Option 1: Revert DNS/Routing**
- Old apps still deployed and available
- Update DNS to point back to old apps
- Users immediately back on stable version
- Fix issues in staff portal offline
- Re-test and redeploy when ready

**Option 2: Feature Flag Rollback**
- Add feature flag: `ENABLE_UNIFIED_STAFF_PORTAL`
- Can toggle between old apps and new staff portal
- Gradual rollout: 10% → 50% → 100% of users
- Roll back by setting flag to `false`

**Safety measures:**
- Old apps remain deployed for 2 weeks post-cutover
- Database is unchanged (no migrations needed)
- Can switch back at any time
- Git tags for rollback points

---

## Success Criteria

### Functional Requirements

- ✅ All features from 4 staff apps work identically in unified staff portal
- ✅ Permission system enforces same access controls as before
- ✅ Multi-role users see aggregated navigation
- ✅ Single-role users see only their domain
- ✅ Candidate portal remains unchanged and working
- ✅ Session sharing works (SSO between staff and candidate portals)

### Performance Requirements

- ✅ No performance regression vs old apps
- ✅ Navigation renders instantly (< 100ms)
- ✅ Permission checks don't slow down page loads

### User Experience Requirements

- ✅ Multi-role users don't need to switch apps
- ✅ Navigation is intuitive and discoverable
- ✅ No confusion about what features are available
- ✅ Dual-role (staff + candidate) users can access both portals easily

### Maintenance Requirements

- ✅ Simpler deployment (2 apps instead of 5)
- ✅ Less code duplication
- ✅ Easier to add new features (one place instead of four)
- ✅ Consistent UI/UX across all staff features

---

## Risks & Mitigations

### Risk 1: Permission Logic Bugs

**Risk:** Aggregating permissions from multiple roles could expose features users shouldn't access.

**Mitigation:**
- Permission system already supports multi-role (getUserPermissions aggregates)
- Add comprehensive tests for all role combinations
- Server-side permission checks are the source of truth (already implemented)
- Client-side navigation is just UI - server actions validate

### Risk 2: Navigation Complexity

**Risk:** Users with many roles see overwhelming navigation.

**Mitigation:**
- Keep navigation simple and flat
- Use clear section labels
- Most users have 2-3 roles max, not all roles
- Can add "favorites" or "recent" sections in future if needed

### Risk 3: Migration Bugs

**Risk:** Features work differently in unified app vs original apps.

**Mitigation:**
- Migrate one domain at a time (admin → author → coordinator → reviewer)
- Parallel run period to catch issues before cutover
- Comprehensive feature parity testing
- Rollback plan with old apps still deployed

### Risk 4: Deployment Disruption

**Risk:** Cutover causes downtime or user confusion.

**Mitigation:**
- Staged rollout (staging → internal team → production)
- Old apps remain available as fallback
- Clear communication to users about consolidation
- Support plan for user questions

---

## Future Enhancements

### Phase 2 Improvements (Post-Consolidation)

1. **Dashboard Personalization**
   - Users can customize which sections appear in their nav
   - "Pin" frequently used features to top
   - Recently viewed items

2. **Role Context Indicators**
   - Small badge showing which role grants access to current page
   - Helpful for users learning the system
   - "You're viewing this as: Coordinator"

3. **Quick Switcher**
   - Cmd+K or Ctrl+K to search all features
   - Jump directly to any section user has access to
   - Similar to VS Code command palette

4. **Unified Search**
   - Search across questions, exams, sessions, users
   - Results filtered by permissions
   - "Find anything in the system"

5. **Activity Feed**
   - Unified feed of recent activity across all domains
   - "Question Bank approved", "Exam scheduled", "Session flagged"
   - Filtered by user's roles/permissions

### Technical Debt Paydown

1. **Shared Component Library**
   - Extract common patterns from migrated features
   - Build reusable components in `@proctorguard/ui`
   - Consistent look and feel

2. **API Layer**
   - Consider adding tRPC or similar for type-safe server actions
   - Better error handling across all domains
   - Centralized logging and monitoring

3. **Testing Infrastructure**
   - Add E2E tests for critical workflows
   - Visual regression testing
   - Performance benchmarking

---

## Open Questions

1. **Branding:** Should "Staff Portal" have a different name? "ProctorGuard Admin" or "Management Portal"?

2. **Onboarding:** Should we add an onboarding tour for first-time users showing them available sections?

3. **Mobile:** Is mobile access required for staff portal? Current apps are desktop-focused.

4. **Permissions UI:** Should admins be able to see a "permission matrix" showing what each user can access?

5. **Audit Trail:** Should we log when users access different sections to track usage patterns?

---

## Appendix

### Current App Ports

- Candidate: 4000
- Admin: 4001
- Author: 4002
- Coordinator: 4003
- Reviewer: 4004

### New App Ports

- Candidate: 4000 (unchanged)
- Staff: 4001

### Demo Accounts (from seed data)

| Email | Password | Roles | What They'll See in Staff Portal |
|-------|----------|-------|----------------------------------|
| admin@acme.com | password123 | SUPER_ADMIN | All sections (full access) |
| orgadmin@acme.com | password123 | ORG_ADMIN | Administration section |
| author@acme.com | password123 | EXAM_AUTHOR | Questions section only |
| coordinator@acme.com | password123 | EXAM_COORDINATOR | Exams section only |
| reviewer@acme.com | password123 | PROCTOR_REVIEWER | Sessions section only |
| enrollment@acme.com | password123 | ENROLLMENT_MANAGER | Exams > Enrollments |
| candidate@acme.com | password123 | CANDIDATE | Candidate portal (no staff access) |

### Related Documentation

- `CLAUDE.md` - Current architecture overview
- `README.md` - Project setup and structure
- `packages/permissions/index.ts` - Permission system implementation
- `docs/GETTING_STARTED.md` - Setup guide

### References

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Better Auth](https://www.better-auth.com/)
- [Prisma ORM](https://www.prisma.io/)

---

**End of Design Document**
