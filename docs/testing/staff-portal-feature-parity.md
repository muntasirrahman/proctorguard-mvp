# Staff Portal Feature Parity Testing

**Date:** 2026-02-10
**Test Phase:** Task 15 - Feature Parity Validation
**Purpose:** Verify all features from legacy apps work identically in unified Staff Portal

## Overview

This document validates that the Staff Portal consolidation did not lose or break any features during migration. Each feature from the 4 legacy apps should work identically in the new unified portal.

## Testing Methodology

For each feature:
1. Test in legacy app (baseline)
2. Test in staff portal (comparison)
3. Verify identical behavior
4. Document any differences

---

## Admin Features (from apps/admin)

### Feature A1: User Management

**Legacy App:** apps/admin/app/dashboard/users/page.tsx
**Staff Portal:** apps/staff/app/dashboard/admin/users/page.tsx

#### Test Cases

| Test Case | Legacy Result | Staff Portal Result | Status |
|-----------|--------------|-------------------|--------|
| View user list | ⏳ | ⏳ | ⏳ |
| Search users by email | ⏳ | ⏳ | ⏳ |
| Filter users by role | ⏳ | ⏳ | ⏳ |
| View user details | ⏳ | ⏳ | ⏳ |
| Edit user information | ⏳ | ⏳ | ⏳ |
| Assign roles to user | ⏳ | ⏳ | ⏳ |
| Remove roles from user | ⏳ | ⏳ | ⏳ |
| Deactivate user | ⏳ | ⏳ | ⏳ |
| Multi-role assignment | ⏳ | ⏳ | ⏳ |
| Permission validation | ⏳ | ⏳ | ⏳ |

**Notes:**
- _[Document any differences or issues]_

---

### Feature A2: Department Management

**Legacy App:** apps/admin/app/dashboard/departments/page.tsx
**Staff Portal:** apps/staff/app/dashboard/admin/departments/page.tsx

#### Test Cases

| Test Case | Legacy Result | Staff Portal Result | Status |
|-----------|--------------|-------------------|--------|
| View department list | ⏳ | ⏳ | ⏳ |
| Create new department | ⏳ | ⏳ | ⏳ |
| Edit department name | ⏳ | ⏳ | ⏳ |
| Delete empty department | ⏳ | ⏳ | ⏳ |
| View department members | ⏳ | ⏳ | ⏳ |
| Assign users to department | ⏳ | ⏳ | ⏳ |
| Cannot delete dept with members | ⏳ | ⏳ | ⏳ |

**Notes:**
- _[Document any differences or issues]_

---

### Feature A3: Organization Settings

**Legacy App:** apps/admin/app/dashboard/settings/page.tsx
**Staff Portal:** apps/staff/app/dashboard/admin/settings/page.tsx

#### Test Cases

| Test Case | Legacy Result | Staff Portal Result | Status |
|-----------|--------------|-------------------|--------|
| View organization details | ⏳ | ⏳ | ⏳ |
| Update organization name | ⏳ | ⏳ | ⏳ |
| Update timezone | ⏳ | ⏳ | ⏳ |
| Update language | ⏳ | ⏳ | ⏳ |
| Update domain | ⏳ | ⏳ | ⏳ |
| Settings persist after save | ⏳ | ⏳ | ⏳ |
| Validation errors displayed | ⏳ | ⏳ | ⏳ |

**Notes:**
- _[Document any differences or issues]_

---

## Author Features (from apps/author)

### Feature B1: Question Bank Management

**Legacy App:** apps/author/app/dashboard/page.tsx
**Staff Portal:** apps/staff/app/dashboard/questions/page.tsx

#### Test Cases

| Test Case | Legacy Result | Staff Portal Result | Status |
|-----------|--------------|-------------------|--------|
| View question banks list | ⏳ | ⏳ | ⏳ |
| Search question banks | ⏳ | ⏳ | ⏳ |
| Filter by status | ⏳ | ⏳ | ⏳ |
| Filter by tags | ⏳ | ⏳ | ⏳ |
| Create new question bank | ⏳ | ⏳ | ⏳ |
| Edit question bank details | ⏳ | ⏳ | ⏳ |
| Delete empty question bank | ⏳ | ⏳ | ⏳ |
| Cannot delete bank with questions | ⏳ | ⏳ | ⏳ |
| View question count | ⏳ | ⏳ | ⏳ |
| Status badge colors | ⏳ | ⏳ | ⏳ |

**Notes:**
- _[Document any differences or issues]_

---

### Feature B2: Question Creation & Editing

**Legacy App:** apps/author/app/dashboard/questions/[id]/edit/page.tsx
**Staff Portal:** apps/staff/app/dashboard/questions/[id]/edit/page.tsx

#### Test Cases

| Test Case | Legacy Result | Staff Portal Result | Status |
|-----------|--------------|-------------------|--------|
| Create multiple choice question | ⏳ | ⏳ | ⏳ |
| Create true/false question | ⏳ | ⏳ | ⏳ |
| Create short answer question | ⏳ | ⏳ | ⏳ |
| Create essay question | ⏳ | ⏳ | ⏳ |
| Add question text | ⏳ | ⏳ | ⏳ |
| Add multiple choice options | ⏳ | ⏳ | ⏳ |
| Set correct answer | ⏳ | ⏳ | ⏳ |
| Add explanation | ⏳ | ⏳ | ⏳ |
| Set difficulty level | ⏳ | ⏳ | ⏳ |
| Set point value | ⏳ | ⏳ | ⏳ |
| Add tags | ⏳ | ⏳ | ⏳ |
| Save draft | ⏳ | ⏳ | ⏳ |
| Submit for review | ⏳ | ⏳ | ⏳ |
| Edit existing question | ⏳ | ⏳ | ⏳ |
| Delete question | ⏳ | ⏳ | ⏳ |
| Form validation works | ⏳ | ⏳ | ⏳ |

**Notes:**
- _[Document any differences or issues]_

---

## Coordinator Features (from apps/coordinator)

### Feature C1: Exam Management

**Legacy App:** apps/coordinator/app/dashboard/page.tsx
**Staff Portal:** apps/staff/app/dashboard/exams/page.tsx

#### Test Cases

| Test Case | Legacy Result | Staff Portal Result | Status |
|-----------|--------------|-------------------|--------|
| View exams list | ⏳ | ⏳ | ⏳ |
| Search exams by title | ⏳ | ⏳ | ⏳ |
| Filter by status | ⏳ | ⏳ | ⏳ |
| Filter by date | ⏳ | ⏳ | ⏳ |
| Create new exam | ⏳ | ⏳ | ⏳ |
| Select question bank | ⏳ | ⏳ | ⏳ |
| Set exam title | ⏳ | ⏳ | ⏳ |
| Set description | ⏳ | ⏳ | ⏳ |
| Set duration | ⏳ | ⏳ | ⏳ |
| Set start date/time | ⏳ | ⏳ | ⏳ |
| Set end date/time | ⏳ | ⏳ | ⏳ |
| Set passing score | ⏳ | ⏳ | ⏳ |
| Set max attempts | ⏳ | ⏳ | ⏳ |
| Enable/disable proctoring | ⏳ | ⏳ | ⏳ |
| Randomize questions | ⏳ | ⏳ | ⏳ |
| Edit exam details | ⏳ | ⏳ | ⏳ |
| Delete draft exam | ⏳ | ⏳ | ⏳ |
| Cannot delete active exam | ⏳ | ⏳ | ⏳ |

**Notes:**
- _[Document any differences or issues]_

---

### Feature C2: Enrollment Management

**Legacy App:** apps/coordinator/app/dashboard/exams/[id]/enrollments/page.tsx
**Staff Portal:** apps/staff/app/dashboard/exams/[id]/enrollments/page.tsx

#### Test Cases

| Test Case | Legacy Result | Staff Portal Result | Status |
|-----------|--------------|-------------------|--------|
| View enrollments list | ⏳ | ⏳ | ⏳ |
| Search by candidate name | ⏳ | ⏳ | ⏳ |
| Filter by status | ⏳ | ⏳ | ⏳ |
| Invite single candidate | ⏳ | ⏳ | ⏳ |
| Invite multiple candidates (bulk) | ⏳ | ⏳ | ⏳ |
| Send invitation email | ⏳ | ⏳ | ⏳ |
| Resend invitation | ⏳ | ⏳ | ⏳ |
| View enrollment status | ⏳ | ⏳ | ⏳ |
| View attempt count | ⏳ | ⏳ | ⏳ |
| View score | ⏳ | ⏳ | ⏳ |
| Remove enrollment | ⏳ | ⏳ | ⏳ |
| Reset attempt count | ⏳ | ⏳ | ⏳ |
| Export enrollments (CSV) | ⏳ | ⏳ | ⏳ |

**Notes:**
- _[Document any differences or issues]_

---

## Reviewer Features (from apps/reviewer)

### Feature D1: Session Review

**Legacy App:** apps/reviewer/app/dashboard/page.tsx
**Staff Portal:** apps/staff/app/dashboard/sessions/page.tsx

#### Test Cases

| Test Case | Legacy Result | Staff Portal Result | Status |
|-----------|--------------|-------------------|--------|
| View sessions list | ⏳ | ⏳ | ⏳ |
| Filter by status | ⏳ | ⏳ | ⏳ |
| Filter by exam | ⏳ | ⏳ | ⏳ |
| Filter by candidate | ⏳ | ⏳ | ⏳ |
| View flagged sessions only | ⏳ | ⏳ | ⏳ |
| Open session detail | ⏳ | ⏳ | ⏳ |
| View candidate info | ⏳ | ⏳ | ⏳ |
| View exam answers | ⏳ | ⏳ | ⏳ |
| View recording (placeholder) | ⏳ | ⏳ | ⏳ |
| View flags list | ⏳ | ⏳ | ⏳ |
| View flag timestamps | ⏳ | ⏳ | ⏳ |
| Create new flag | ⏳ | ⏳ | ⏳ |
| Add flag notes | ⏳ | ⏳ | ⏳ |
| Mark session as cleared | ⏳ | ⏳ | ⏳ |
| Mark session as violation | ⏳ | ⏳ | ⏳ |
| Add review notes | ⏳ | ⏳ | ⏳ |

**Notes:**
- _[Document any differences or issues]_
- _Note: Some reviewer features are placeholders pending Phase 5 implementation_

---

## Cross-Feature Testing

### Navigation & UI Consistency

| Test Case | Legacy Result | Staff Portal Result | Status |
|-----------|--------------|-------------------|--------|
| Breadcrumb navigation | ⏳ | ⏳ | ⏳ |
| Back button works | ⏳ | ⏳ | ⏳ |
| Loading states shown | ⏳ | ⏳ | ⏳ |
| Error messages displayed | ⏳ | ⏳ | ⏳ |
| Success toasts shown | ⏳ | ⏳ | ⏳ |
| Form validation | ⏳ | ⏳ | ⏳ |
| Responsive layout | ⏳ | ⏳ | ⏳ |
| Consistent styling | N/A | ⏳ | ⏳ |

---

### Performance Comparison

| Metric | Legacy App | Staff Portal | Acceptable? |
|--------|-----------|-------------|-------------|
| Initial page load | ⏳ | ⏳ | ⏳ |
| Navigation time | ⏳ | ⏳ | ⏳ |
| Form submission | ⏳ | ⏳ | ⏳ |
| Data fetch time | ⏳ | ⏳ | ⏳ |
| Bundle size | ⏳ | ⏳ | ⏳ |

**Acceptance Criteria:**
- Staff portal should be within 10% of legacy app performance
- No regression in page load times
- Form submissions should be as fast or faster

---

### Security & Permissions

| Test Case | Legacy Result | Staff Portal Result | Status |
|-----------|--------------|-------------------|--------|
| Unauthorized access blocked | ⏳ | ⏳ | ⏳ |
| Direct URL access validated | ⏳ | ⏳ | ⏳ |
| Server actions check permissions | ⏳ | ⏳ | ⏳ |
| API endpoints secured | ⏳ | ⏳ | ⏳ |
| Session timeout works | ⏳ | ⏳ | ⏳ |
| CSRF protection | ⏳ | ⏳ | ⏳ |

---

## Data Integrity Testing

### Database Operations

| Test Case | Legacy Result | Staff Portal Result | Status |
|-----------|--------------|-------------------|--------|
| Create records | ⏳ | ⏳ | ⏳ |
| Update records | ⏳ | ⏳ | ⏳ |
| Delete records | ⏳ | ⏳ | ⏳ |
| Cascade deletes work | ⏳ | ⏳ | ⏳ |
| Transactions rollback on error | ⏳ | ⏳ | ⏳ |
| Audit logs created | ⏳ | ⏳ | ⏳ |
| Data validation enforced | ⏳ | ⏳ | ⏳ |

---

## Bug Tracking

### Issues Found During Testing

#### Issue #1: [Title]
- **Severity:** Critical / High / Medium / Low
- **Feature:** [Which feature]
- **Legacy Behavior:** [What happened in old app]
- **Staff Portal Behavior:** [What happens in new app]
- **Steps to Reproduce:**
  1.
  2.
  3.
- **Expected:**
- **Actual:**
- **Root Cause:**
- **Fix:**
- **Status:** Open / In Progress / Fixed / Wont Fix

---

## Test Execution Instructions

### For Each Feature Domain:

1. **Start legacy app:**
   ```bash
   # For admin features
   npm run dev:admin  # Port 4001

   # For author features
   npm run dev:author  # Port 4002

   # For coordinator features
   npm run dev:coordinator  # Port 4003

   # For reviewer features
   npm run dev:reviewer  # Port 4004
   ```

2. **Start staff portal:**
   ```bash
   npm run dev:staff  # Port 4001
   ```

3. **Test in legacy app first:**
   - Sign in with appropriate role
   - Execute test case
   - Document behavior

4. **Test in staff portal:**
   - Sign in with same role
   - Execute identical test case
   - Compare behavior

5. **Document results:**
   - Mark ✅ if identical
   - Mark ⚠️ if minor differences (note them)
   - Mark ❌ if broken or different behavior
   - Add detailed notes for any issues

---

## Test Results Summary

### Admin Features
- **Total Test Cases:** 24
- **Passed:** ⏳
- **Failed:** ⏳
- **Not Tested:** ⏳
- **Pass Rate:** ⏳

### Author Features
- **Total Test Cases:** 26
- **Passed:** ⏳
- **Failed:** ⏳
- **Not Tested:** ⏳
- **Pass Rate:** ⏳

### Coordinator Features
- **Total Test Cases:** 31
- **Passed:** ⏳
- **Failed:** ⏳
- **Not Tested:** ⏳
- **Pass Rate:** ⏳

### Reviewer Features
- **Total Test Cases:** 16
- **Passed:** ⏳
- **Failed:** ⏳
- **Not Tested:** ⏳
- **Pass Rate:** ⏳

### Overall
- **Total Test Cases:** 97
- **Passed:** ⏳
- **Failed:** ⏳
- **Not Tested:** ⏳
- **Pass Rate:** ⏳

---

## Sign-Off

### Feature Parity Validation

- ☐ All critical features tested
- ☐ No regressions found
- ☐ Performance acceptable
- ☐ Security validated
- ☐ UI/UX consistent
- ☐ Data integrity confirmed
- ☐ All issues documented and triaged

**Tested By:** _[Name]_
**Date:** _[Date]_
**Approved By:** _[Name]_
**Date:** _[Date]_

---

## Recommendations

Based on testing results:

1. **High Priority Issues:** _[List critical bugs that must be fixed]_
2. **Medium Priority Issues:** _[List important but non-blocking issues]_
3. **Low Priority Issues:** _[List nice-to-have improvements]_
4. **Production Readiness:** ☐ Ready / ☐ Not Ready

---

**Feature Parity Test Plan Complete - Ready for Execution**
