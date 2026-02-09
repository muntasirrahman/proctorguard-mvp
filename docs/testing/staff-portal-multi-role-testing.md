# Staff Portal Multi-Role User Testing

**Date:** 2026-02-10
**Test Phase:** Task 14 - Multi-Role User Experience Validation
**Status:** Test Plan Ready

## Test Environment

- **Database:** proctorguard_dev (localhost:5432)
- **Application:** Staff Portal (http://localhost:4001)
- **Test Users:** Created via seed script with multiple role combinations

## Test Users

### Single-Role Users (Baseline)
| Email | Roles | Expected Navigation Sections |
|-------|-------|------------------------------|
| orgadmin@acme.com | ORG_ADMIN | Administration |
| author@acme.com | EXAM_AUTHOR | Questions |
| coordinator@acme.com | EXAM_COORDINATOR | Exams |
| reviewer@acme.com | PROCTOR_REVIEWER | Sessions |

### Multi-Role Users (Test Focus)
| Email | Roles | Expected Navigation Sections |
|-------|-------|------------------------------|
| author-coordinator@acme.com | EXAM_AUTHOR + EXAM_COORDINATOR | Questions + Exams |
| coordinator-reviewer@acme.com | EXAM_COORDINATOR + PROCTOR_REVIEWER | Exams + Sessions |
| admin-author@acme.com | ORG_ADMIN + EXAM_AUTHOR | Questions + Administration |
| multirole@acme.com | ORG_ADMIN + EXAM_AUTHOR + EXAM_COORDINATOR + PROCTOR_REVIEWER | All sections (Questions + Exams + Sessions + Administration) |

## Test Procedures

### Test 1: Single-Role Navigation Verification

**Purpose:** Establish baseline - verify single-role users see only their domain

**Steps:**
1. Sign in as `author@acme.com` (password: password123)
2. Verify navigation shows only "Questions" section
3. Verify cannot access `/dashboard/exams` (redirect or 403)
4. Verify cannot access `/dashboard/sessions` (redirect or 403)
5. Verify cannot access `/dashboard/admin` (redirect or 403)
6. Sign out

**Repeat for:** coordinator@acme.com, reviewer@acme.com, orgadmin@acme.com

**Expected Results:**
- ✅ Each user sees only their designated section
- ✅ Direct URL navigation to unauthorized sections is blocked
- ✅ No console errors
- ✅ Permission checks work server-side

---

### Test 2: Author + Coordinator Navigation

**Purpose:** Verify users with 2 roles see both sections

**User:** author-coordinator@acme.com

**Steps:**
1. Sign in as `author-coordinator@acme.com`
2. Verify navigation shows "Questions" section
3. Verify navigation shows "Exams" section
4. Verify navigation does NOT show "Sessions" or "Administration"
5. Navigate to `/dashboard/questions`
   - Should see question banks list
   - Should be able to create question bank
6. Navigate to `/dashboard/exams`
   - Should see exams list
   - Should be able to create exam
7. Try to access `/dashboard/sessions` (should be blocked)
8. Try to access `/dashboard/admin` (should be blocked)

**Expected Results:**
- ✅ Both Questions and Exams sections visible in nav
- ✅ Can access and use features in both sections
- ✅ Blocked from Sessions and Administration
- ✅ Permission aggregation works correctly

---

### Test 3: Coordinator + Reviewer Navigation

**Purpose:** Verify different 2-role combination

**User:** coordinator-reviewer@acme.com

**Steps:**
1. Sign in as `coordinator-reviewer@acme.com`
2. Verify navigation shows "Exams" section
3. Verify navigation shows "Sessions" section
4. Verify navigation does NOT show "Questions" or "Administration"
5. Navigate to `/dashboard/exams`
   - Should see exams list
   - Should be able to manage exams
6. Navigate to `/dashboard/sessions`
   - Should see sessions list
   - Should be able to review sessions
7. Try to access `/dashboard/questions` (should be blocked)
8. Try to access `/dashboard/admin` (should be blocked)

**Expected Results:**
- ✅ Both Exams and Sessions sections visible in nav
- ✅ Can access and use features in both sections
- ✅ Blocked from Questions and Administration
- ✅ No cross-contamination of permissions

---

### Test 4: Admin + Author Navigation

**Purpose:** Verify admin role can be combined with content role

**User:** admin-author@acme.com

**Steps:**
1. Sign in as `admin-author@acme.com`
2. Verify navigation shows "Questions" section
3. Verify navigation shows "Administration" section
4. Verify navigation does NOT show "Exams" or "Sessions"
5. Navigate to `/dashboard/questions`
   - Should see question banks
   - Should be able to create content
6. Navigate to `/dashboard/admin/users`
   - Should see user management
   - Should be able to manage users
7. Try to access `/dashboard/exams` (should be blocked)
8. Try to access `/dashboard/sessions` (should be blocked)

**Expected Results:**
- ✅ Both Questions and Administration sections visible
- ✅ Can create content AND manage users
- ✅ Blocked from coordinator and reviewer features
- ✅ Role separation maintained where appropriate

---

### Test 5: All Staff Roles (Power User)

**Purpose:** Verify users with all staff roles see complete navigation

**User:** multirole@acme.com

**Steps:**
1. Sign in as `multirole@acme.com`
2. Verify navigation shows ALL sections:
   - Questions
   - Exams
   - Sessions
   - Administration
3. Navigate to each section and verify access:
   - `/dashboard/questions` - can create question banks
   - `/dashboard/exams` - can create exams
   - `/dashboard/sessions` - can review sessions
   - `/dashboard/admin/users` - can manage users
4. Verify no permission errors in console
5. Test creating content in each domain:
   - Create a question bank (author permission)
   - Create an exam (coordinator permission)
   - Access session review (reviewer permission)
   - Manage users (admin permission)

**Expected Results:**
- ✅ All navigation sections visible
- ✅ Full access to all staff features
- ✅ Can perform actions across all domains
- ✅ Navigation remains organized and usable
- ✅ No permission conflicts or errors

---

### Test 6: Permission-Based Feature Visibility

**Purpose:** Verify individual features within pages are permission-gated

**User:** author-coordinator@acme.com

**Steps:**
1. Navigate to `/dashboard/exams`
2. Verify "Create Exam" button is visible (has EXAM_COORDINATOR role)
3. Navigate to Question Bank detail page
4. Verify can edit questions (has EXAM_AUTHOR role)
5. Try to access session review features
6. Verify session review UI is not accessible

**Expected Results:**
- ✅ Fine-grained permission checks work
- ✅ Buttons/actions are shown/hidden based on permissions
- ✅ Server actions validate permissions
- ✅ No unauthorized actions possible

---

### Test 7: Session Persistence Across Navigation

**Purpose:** Verify session and permission state persists

**User:** coordinator-reviewer@acme.com

**Steps:**
1. Sign in as `coordinator-reviewer@acme.com`
2. Navigate to `/dashboard/exams`
3. Refresh the page
4. Verify navigation still shows Exams and Sessions
5. Navigate to `/dashboard/sessions`
6. Refresh the page
7. Verify session persists and permissions remain

**Expected Results:**
- ✅ Session persists across page refreshes
- ✅ Navigation state is consistent
- ✅ Permissions remain correctly applied
- ✅ No authentication errors

---

## Test Execution Checklist

### Pre-Testing
- ☐ Database seeded with multi-role test users
- ☐ Staff portal running on port 4001
- ☐ Browser console open for error monitoring
- ☐ Network tab open to verify API responses

### During Testing
- ☐ Record any unexpected behavior
- ☐ Screenshot navigation for each user type
- ☐ Note any console errors or warnings
- ☐ Verify URL redirects work correctly
- ☐ Check that unauthorized access attempts are blocked

### Post-Testing
- ☐ Document any bugs found
- ☐ Verify all test cases pass
- ☐ Update this document with actual results
- ☐ Create issues for any failures

---

## Test Results

### Test 1: Single-Role Navigation
**Status:** ⏳ PENDING
**Tested By:** _[Name]_
**Date:** _[Date]_
**Results:** _[Pass/Fail - Notes]_

### Test 2: Author + Coordinator
**Status:** ⏳ PENDING
**Tested By:** _[Name]_
**Date:** _[Date]_
**Results:** _[Pass/Fail - Notes]_

### Test 3: Coordinator + Reviewer
**Status:** ⏳ PENDING
**Tested By:** _[Name]_
**Date:** _[Date]_
**Results:** _[Pass/Fail - Notes]_

### Test 4: Admin + Author
**Status:** ⏳ PENDING
**Tested By:** _[Name]_
**Date:** _[Date]_
**Results:** _[Pass/Fail - Notes]_

### Test 5: All Staff Roles
**Status:** ⏳ PENDING
**Tested By:** _[Name]_
**Date:** _[Date]_
**Results:** _[Pass/Fail - Notes]_

### Test 6: Permission-Based Features
**Status:** ⏳ PENDING
**Tested By:** _[Name]_
**Date:** _[Date]_
**Results:** _[Pass/Fail - Notes]_

### Test 7: Session Persistence
**Status:** ⏳ PENDING
**Tested By:** _[Name]_
**Date:** _[Date]_
**Results:** _[Pass/Fail - Notes]_

---

## Known Issues

_Document any issues discovered during testing:_

### Issue 1: [Title]
- **Severity:** High/Medium/Low
- **User:** [Which test user experienced this]
- **Steps to Reproduce:**
- **Expected:**
- **Actual:**
- **Resolution:**

---

## Browser Compatibility

Test on multiple browsers to ensure consistent behavior:

- ☐ Chrome/Edge (Chromium)
- ☐ Firefox
- ☐ Safari

---

## Manual Testing Instructions

To run these tests manually:

1. **Start the staff portal:**
   ```bash
   npm run dev:staff
   ```

2. **Open browser to:**
   ```
   http://localhost:4001
   ```

3. **Sign in with each test user** (password: password123):
   - author-coordinator@acme.com
   - coordinator-reviewer@acme.com
   - admin-author@acme.com
   - multirole@acme.com

4. **For each user, verify:**
   - Navigation shows correct sections
   - Can access allowed sections
   - Cannot access forbidden sections
   - Features work within allowed sections

5. **Document results** in the Test Results section above

---

## Automated Testing (Future Enhancement)

Consider adding automated E2E tests for these scenarios:

```typescript
// Example: Playwright test
test('multi-role user sees aggregated navigation', async ({ page }) => {
  await page.goto('http://localhost:4001');
  await page.fill('[name="email"]', 'author-coordinator@acme.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // Verify Questions section visible
  await expect(page.locator('nav >> text=Questions')).toBeVisible();

  // Verify Exams section visible
  await expect(page.locator('nav >> text=Exams')).toBeVisible();

  // Verify Sessions section NOT visible
  await expect(page.locator('nav >> text=Sessions')).not.toBeVisible();
});
```

---

## Success Criteria

✅ All 7 test cases pass
✅ No permission errors in console
✅ Navigation correctly filters by user permissions
✅ Multi-role users can access all their authorized features
✅ Unauthorized access attempts are properly blocked
✅ Session state persists correctly
✅ No UI/UX issues discovered

---

**Test Plan Complete - Ready for Execution**
