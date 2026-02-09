# Phase 3 Candidate Dashboard: Session Flow Test Plan

**Document Version:** 1.0
**Created:** 2026-02-09
**Status:** Ready for Testing
**Related Issue:** proctor-exam-mvp (Phase 3 - Task 8)

## Overview

This document provides step-by-step manual testing instructions for the complete exam session creation and management flow in the candidate dashboard. This is **Task 8** of the Phase 3 implementation.

## Prerequisites

Before starting tests, ensure the following conditions are met:

### 1. Database State
- [ ] Database has been seeded with demo data
- [ ] Run: `npm run db:seed`
- [ ] Verify seed completed without errors

### 2. Test User Account
- [ ] User: `candidate@acme.com` exists
- [ ] Password: `password123`
- [ ] Role: `CANDIDATE` in ACME Corporation

### 3. Test Exam Setup
At minimum, you need **one exam** with the following configuration:

- [ ] **Exam status:** `ACTIVE`
- [ ] **Enrollment:** User `candidate@acme.com` has an enrollment with status `ENROLLED`
- [ ] **Time window:** `scheduledStart` is in the past, `scheduledEnd` is in the future
- [ ] **Attempts:** `maxAttempts` > 0, `attemptsUsed` < `maxAttempts`

**To verify exam setup:**
```bash
# Option 1: Use Prisma Studio
npm run db:studio
# Navigate to: Exam → filter by status=ACTIVE
# Navigate to: Enrollment → filter by candidateId

# Option 2: Query directly
npx prisma studio
```

### 4. Development Server
- [ ] Start candidate app: `npm run dev:candidate`
- [ ] Verify server running at: http://localhost:4000
- [ ] Check terminal for any startup errors

---

## Test Suite

### Test 1: Sign In as Candidate

**Objective:** Verify authentication flow works correctly.

**Steps:**
1. Navigate to http://localhost:4000/auth/signin
2. Enter credentials:
   - Email: `candidate@acme.com`
   - Password: `password123`
3. Click "Sign In" button

**Expected Results:**
- ✅ No validation errors appear
- ✅ "Signing in..." loading state shows briefly
- ✅ Redirects to `/dashboard` (overview page)
- ✅ User menu shows candidate's name/email
- ✅ No console errors in browser DevTools

**Actual Results:**
```
[ ] PASS
[ ] FAIL - Issue: _______________________________________________

Notes:
```

---

### Test 2: View Enrolled Exams

**Objective:** Verify exam listing and state categorization.

**Steps:**
1. From dashboard, navigate to "Enrolled Exams" tab
   - URL should be: http://localhost:4000/dashboard/exams
2. Scroll through the page to view all sections:
   - "Available to Start" section
   - "Active Session" section
   - "Past Exams" section

**Expected Results:**
- ✅ At least one exam appears in "Available to Start" section
- ✅ Exam card shows:
  - Exam title
  - Time window (e.g., "Jan 15, 2026 9:00 AM - Jan 20, 2026 5:00 PM")
  - Attempts remaining (e.g., "Attempts: 1 of 3 used")
  - Green "Start Exam" button
- ✅ "Active Session" section is empty (or shows other in-progress exams)
- ✅ Loading state completed (no skeleton cards)
- ✅ No error messages displayed

**Actual Results:**
```
[ ] PASS
[ ] FAIL - Issue: _______________________________________________

Notes:
```

---

### Test 3: Start New Exam Session

**Objective:** Verify session creation flow works end-to-end.

**Steps:**
1. Locate an exam in "Available to Start" section
2. Click the green "Start Exam" button
3. Observe the UI changes
4. Wait for page navigation

**Expected Results:**
- ✅ Button text changes to "Loading..." immediately
- ✅ Button becomes disabled during loading
- ✅ Page redirects to `/dashboard/exams/[examId]/take?session=[sessionId]`
  - Note the `examId` and `sessionId` from the URL
- ✅ Placeholder exam page loads with:
  - "Taking Exam: [Exam Title]"
  - Session information displayed (Session ID, Attempt, Status)
  - "Exit to Dashboard" button visible
- ✅ No console errors in browser DevTools
- ✅ No error toast notifications appear

**Actual Results:**
```
[ ] PASS
[ ] FAIL - Issue: _______________________________________________

Captured Values:
- Exam ID: _______________
- Session ID: _______________
- Attempt Number: _______________

Notes:
```

---

### Test 4: Verify Session Creation in Database

**Objective:** Confirm database state matches expected session creation.

**Steps:**
1. Open Prisma Studio: `npm run db:studio`
2. Navigate to `ExamSession` table
3. Find the session created in Test 3 (use Session ID from URL)
4. Verify session fields
5. Navigate to `Enrollment` table
6. Find enrollment for this candidate and exam
7. Check `attemptsUsed` field

**Expected Results:**
- ✅ `ExamSession` record exists with:
  - `status: IN_PROGRESS`
  - `startedAt: [timestamp when started]`
  - `completedAt: null`
  - `enrollmentId: [matches enrollment]`
- ✅ `Enrollment.attemptsUsed` incremented by 1
- ✅ No duplicate sessions with `IN_PROGRESS` status for this enrollment

**Actual Results:**
```
[ ] PASS
[ ] FAIL - Issue: _______________________________________________

Database Values:
- Session Status: _______________
- Started At: _______________
- Attempts Used: _______________

Notes:
```

---

### Test 5: Return to Dashboard from Exam

**Objective:** Verify navigation and UI state after starting exam.

**Steps:**
1. From the exam taking page (`/dashboard/exams/[id]/take`), click "Exit to Dashboard"
2. Verify redirection
3. Locate the exam that was just started

**Expected Results:**
- ✅ Redirects to `/dashboard/exams` (enrolled exams list)
- ✅ Exam now appears in "Active Session" section (NOT "Available to Start")
- ✅ Exam card shows:
  - "IN PROGRESS" badge
  - Time remaining (if duration set)
  - Green "Resume Exam" button (NOT "Start Exam")
- ✅ "Available to Start" section no longer shows this exam
- ✅ UI updated without full page reload

**Actual Results:**
```
[ ] PASS
[ ] FAIL - Issue: _______________________________________________

Notes:
```

---

### Test 6: Resume Active Session

**Objective:** Verify resuming an in-progress exam session.

**Steps:**
1. From "Active Session" section, click green "Resume Exam" button
2. Observe loading state
3. Verify navigation

**Expected Results:**
- ✅ Button text changes to "Loading..." immediately
- ✅ Button becomes disabled during loading
- ✅ Redirects to `/dashboard/exams/[examId]/take?session=[sessionId]`
- ✅ **Same session ID** as in Test 3 (not a new session)
- ✅ Session info shows same attempt number
- ✅ No new `ExamSession` record created in database
- ✅ No console errors

**Actual Results:**
```
[ ] PASS
[ ] FAIL - Issue: _______________________________________________

Verification:
- Session ID matches Test 3: [ ] YES [ ] NO
- Attempt number unchanged: [ ] YES [ ] NO

Notes:
```

---

### Test 7: Prevent Double-Click Session Creation

**Objective:** Verify loading states prevent duplicate session creation.

**Steps:**
1. Navigate back to `/dashboard/exams`
2. Find another available exam (or use same exam if multiple attempts allowed)
3. **Rapidly double-click** the "Start Exam" button
4. Wait for navigation
5. Check database for duplicate sessions

**Expected Results:**
- ✅ Button disables after first click
- ✅ Only one navigation occurs
- ✅ Only one `ExamSession` created (check Prisma Studio)
- ✅ No error messages or crashes

**Actual Results:**
```
[ ] PASS
[ ] FAIL - Issue: _______________________________________________

Notes:
```

---

### Test 8: Session Expiration (Optional - Time-Intensive)

**Objective:** Verify expired sessions are handled correctly.

> **Note:** This test requires creating a test exam with very short duration (2-5 minutes). Skip if time-constrained.

**Setup:**
1. Create test exam via seed script or Prisma Studio with:
   - `durationMinutes: 2`
   - `scheduledStart: now - 1 hour`
   - `scheduledEnd: now + 1 hour`
2. Create enrollment for `candidate@acme.com`

**Steps:**
1. Start exam session
2. Navigate to exam taking page
3. **Wait 2+ minutes** (session expires)
4. Return to `/dashboard/exams`
5. Attempt to click "Resume Exam"

**Expected Results:**
- ✅ Toast notification: "This exam session has expired"
- ✅ Button becomes disabled or changes state
- ✅ Exam moves to "Past Exams" section
- ✅ Session status in database: `COMPLETED` or `FLAGGED`

**Actual Results:**
```
[ ] PASS
[ ] FAIL - Issue: _______________________________________________
[ ] SKIPPED - Reason: _______________________________________________

Notes:
```

---

### Test 9: Maximum Attempts Validation

**Objective:** Verify "Start Exam" disabled when max attempts reached.

**Setup:**
1. Find or create exam with `maxAttempts: 1`
2. Ensure enrollment has `attemptsUsed: 0`

**Steps:**
1. Start exam (uses first attempt)
2. Return to dashboard
3. Manually update session to `COMPLETED` via Prisma Studio
   - Find session → set `status: COMPLETED`, `completedAt: now`
4. Refresh `/dashboard/exams` page

**Expected Results:**
- ✅ Exam moves to "Past Exams" section
- ✅ No "Start Exam" button shown (attempts exhausted)
- ✅ Shows message: "All attempts used (1 of 1)"
- ✅ Clicking exam shows attempt history

**Actual Results:**
```
[ ] PASS
[ ] FAIL - Issue: _______________________________________________

Notes:
```

---

## Troubleshooting

### Issue: No exams appear in "Available to Start"

**Possible Causes:**
1. Exam status is not `ACTIVE`
2. Time window is invalid (`scheduledStart` in future OR `scheduledEnd` in past)
3. No enrollment exists for candidate
4. `attemptsUsed >= maxAttempts`

**Solutions:**
```bash
# Check exam and enrollment in Prisma Studio
npm run db:studio

# Verify exam time windows:
# scheduledStart < NOW < scheduledEnd

# Re-run seed if data is corrupted:
npx prisma migrate reset --force
npm run db:seed
```

---

### Issue: "Start Exam" button does nothing

**Possible Causes:**
1. JavaScript error in console (check DevTools)
2. Server action failed (check terminal logs)
3. Session already exists with `IN_PROGRESS` status

**Solutions:**
```bash
# Check browser console for errors
# Check server terminal for action errors

# Clear orphaned sessions in Prisma Studio:
# Find ExamSession with IN_PROGRESS status
# Delete or update to COMPLETED
```

---

### Issue: Redirects to 404 after starting exam

**Possible Causes:**
1. Session ID not passed correctly in URL
2. Exam taking page route not implemented
3. Session validation failing

**Solutions:**
```bash
# Verify route exists:
# apps/candidate/app/dashboard/exams/[id]/take/page.tsx

# Check URL format:
# Should be: /dashboard/exams/[examId]/take?session=[sessionId]

# Verify session ID is valid UUID in URL
```

---

### Issue: Multiple sessions created for same enrollment

**Possible Causes:**
1. Double-click protection not working
2. Race condition in server action
3. Database constraint missing

**Solutions:**
```bash
# Check existing sessions in Prisma Studio
# Delete duplicate sessions manually

# Verify server action has proper validation:
# Should check for existing IN_PROGRESS session
```

---

### Issue: Session never expires (Test 8)

**Possible Causes:**
1. `durationMinutes` not set on exam
2. Session validation not checking time
3. Caching issue (page not refetching)

**Solutions:**
```bash
# Verify exam.durationMinutes is set
# Check session validation logic in server action
# Hard refresh page (Cmd+Shift+R / Ctrl+Shift+R)
```

---

## Test Results Summary

**Test Date:** _______________
**Tester Name:** _______________
**Environment:** Development (localhost:4000)
**Database:** PostgreSQL (local)

### Results Overview

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | Sign In | ⬜ PASS / ⬜ FAIL | |
| 2 | View Enrolled Exams | ⬜ PASS / ⬜ FAIL | |
| 3 | Start New Session | ⬜ PASS / ⬜ FAIL | |
| 4 | Verify Database State | ⬜ PASS / ⬜ FAIL | |
| 5 | Return to Dashboard | ⬜ PASS / ⬜ FAIL | |
| 6 | Resume Active Session | ⬜ PASS / ⬜ FAIL | |
| 7 | Prevent Double-Click | ⬜ PASS / ⬜ FAIL | |
| 8 | Session Expiration | ⬜ PASS / ⬜ FAIL / ⬜ SKIP | |
| 9 | Max Attempts Validation | ⬜ PASS / ⬜ FAIL | |

### Critical Issues Found
```
1. _______________________________________________________________
2. _______________________________________________________________
3. _______________________________________________________________
```

### Minor Issues Found
```
1. _______________________________________________________________
2. _______________________________________________________________
```

### Recommendations
```
[ ] Ready for production
[ ] Needs fixes before deployment
[ ] Requires additional testing

Next Steps:
_______________________________________________________________
_______________________________________________________________
```

---

## Appendix: Quick Reference

### Key URLs
- Sign In: http://localhost:4000/auth/signin
- Dashboard: http://localhost:4000/dashboard
- Enrolled Exams: http://localhost:4000/dashboard/exams
- Exam Taking: http://localhost:4000/dashboard/exams/[id]/take?session=[sessionId]

### Test Credentials
- Email: `candidate@acme.com`
- Password: `password123`

### Useful Commands
```bash
# Start dev server
npm run dev:candidate

# Open database GUI
npm run db:studio

# Re-seed database
npx prisma migrate reset --force
npm run db:seed

# View server logs
# (check terminal running dev:candidate)
```

### Database Tables to Monitor
- `ExamSession` - session records
- `Enrollment` - attempts tracking
- `Exam` - exam configuration
- `User` - candidate account

---

**End of Test Plan**
