# Staff Portal Rollback Plan

## Overview

This document outlines procedures to roll back the staff portal consolidation if issues are discovered.

## Quick Rollback Options

### Option 1: Switch Back to Old Apps (Fastest)

If staff portal has issues, users can immediately use the old apps:

1. **Old apps still available** at their original ports:
   - Admin: `npm run dev:admin` (port 4001)
   - Author: `npm run dev:author` (port 4002)
   - Coordinator: `npm run dev:coordinator` (port 4003)
   - Reviewer: `npm run dev:reviewer` (port 4004)

2. **No data loss** - all features use the same database

3. **No code changes needed** - just direct users to old URLs

**Timeline:** Immediate (< 5 minutes)

### Option 2: Git Revert (If Staff Portal Causes Issues)

If the staff portal code is causing problems:

```bash
# Find the merge commit
git log --oneline --grep="staff portal"

# Revert the merge
git revert -m 1 <merge-commit-hash>

# Or reset to before consolidation
git reset --hard <commit-before-staff-portal>

# Push changes
git push origin main
```

**WARNING:** Only use if staff portal code has bugs. Coordinate with team before force pushing.

**Timeline:** 10-15 minutes

### Option 3: Feature Flag (Planned for Production)

Add environment variable to control which portal is used:

```env
# .env
USE_LEGACY_APPS=true  # Use old apps
USE_LEGACY_APPS=false # Use staff portal (default)
```

Update routing/landing page to redirect based on flag.

**Timeline:** Requires code changes (1-2 hours)

## When to Roll Back

Roll back if:
- **Critical bugs** in staff portal that block work
- **Permission issues** preventing access to features
- **Data integrity problems** (unlikely - same database)
- **Performance degradation** compared to old apps
- **User confusion** that training cannot resolve quickly

## Rollback Decision Matrix

| Issue Severity | User Impact | Rollback Recommended? |
|----------------|-------------|----------------------|
| Critical bug blocking all users | High | **YES** - Option 1 immediately |
| Bug affecting specific feature | Medium | **MAYBE** - Can users use old app for that feature? |
| UI/UX confusion | Low | **NO** - Provide training/docs |
| Minor visual bug | Low | **NO** - Fix forward |
| Performance < 10% slower | Low | **NO** - Investigate and optimize |
| Performance > 50% slower | High | **YES** - Option 1 while investigating |

## Post-Rollback Actions

After rolling back:

1. **Notify team** - Explain why rollback was necessary
2. **Document issues** - Create GitHub issues for problems found
3. **Root cause analysis** - Why did it fail? What was missed?
4. **Create fix plan** - How to address issues before retry
5. **Set new timeline** - When will staff portal be ready?
6. **Update stakeholders** - Communicate revised plan

## Prevention Measures

To avoid needing rollback:

1. ✅ **Parallel run period** - Keep old apps running alongside new portal
2. ✅ **Gradual migration** - Encourage but don't force users to switch
3. ✅ **Monitor errors** - Watch logs for issues
4. ✅ **Gather feedback** - Quick surveys after 1 day, 1 week
5. ✅ **Have escape hatch** - Clear instructions for using old apps if needed

## Transition Period

**Recommended:** 2-4 weeks

- **Week 1-2:** Both systems available, encourage staff portal use
- **Week 3-4:** Monitor adoption, gather feedback, fix issues
- **After 4 weeks:** If stable, delete old apps

During transition:
- Monitor which apps users are running
- Collect user feedback
- Fix any issues found
- Be ready to extend transition if needed

## Communication Templates

### Rollback Announcement

```
Subject: Staff Portal Temporarily Unavailable - Use Legacy Apps

Hi team,

We've identified issues with the new Staff Portal and are temporarily
rolling back to the previous apps while we resolve them.

Please use these apps until further notice:
- Admin: http://localhost:4001 (npm run dev:admin)
- Author: http://localhost:4002 (npm run dev:author)
- Coordinator: http://localhost:4003 (npm run dev:coordinator)
- Reviewer: http://localhost:4004 (npm run dev:reviewer)

We'll update you once the Staff Portal is ready for use again.

Questions? Contact [your team lead]
```

### Re-Launch Announcement

```
Subject: Staff Portal Re-Launch - Issues Resolved

Hi team,

The Staff Portal issues have been resolved and it's ready for use again!

Access: http://localhost:4001 (npm run dev:staff)

Changes since last launch:
- [List of fixes]

The legacy apps remain available as backup if needed.

Questions? Contact [your team lead]
```

## Success Metrics

Track these to decide if rollback is needed:

- **Error rate:** < 1% of requests should fail
- **Page load time:** < 2s for dashboard
- **User adoption:** > 50% using staff portal after 1 week
- **Support tickets:** < 5 staff portal issues per day
- **User satisfaction:** > 80% positive feedback

## Final Notes

- **Old apps are safety net** - Don't delete until confident
- **Data is safe** - All apps use same database
- **No rush** - Better to roll back and fix than push broken code
- **Communication is key** - Keep users informed of changes

**Remember:** Rolling back is not failure, it's good engineering practice to have contingency plans.
