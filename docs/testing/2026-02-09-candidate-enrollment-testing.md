# Candidate Enrollment View - Manual Testing Guide

## Test Date: 2026-02-09

## Implementation Summary
Phase 2.2: Candidate Enrollment View has been implemented with:
- Pending invitations view with accept/decline functionality
- Enrolled exams view with status tracking
- Tab navigation between the two views
- Permission-based access control

## Prerequisites
1. Database seeded with demo users (`npm run db:seed`)
2. Coordinator app running on port 4003
3. Candidate app running on port 4000

## Test Accounts
- **Coordinator**: coordinator@acme.com / password123
- **Candidate**: candidate@acme.com / password123

## Testing Steps

### Setup: Create Exam and Invite Candidate

1. **Start the coordinator app**:
   ```bash
   npm run dev:coordinator
   ```

2. **Sign in as coordinator** (http://localhost:4003):
   - Email: coordinator@acme.com
   - Password: password123

3. **Create a test exam**:
   - Navigate to "Exams" → "Create Exam"
   - Fill in exam details:
     - Title: "Test Exam - Candidate Acceptance Flow"
     - Description: "Testing candidate enrollment acceptance"
     - Duration: 60 minutes
     - Schedule: Today + 1 day to Today + 7 days
     - Question Bank: Select any available
   - Submit the form

4. **Invite candidate to the exam**:
   - On the exam detail page, scroll to "Enrollments" section
   - Click "Invite Candidate"
   - Enter: candidate@acme.com
   - Submit invitation

5. **Verify invitation created**:
   - Should see enrollment in "Pending" status
   - Should show candidate email and invited date

### Test Case 1: View Pending Invitations

1. **Start the candidate app**:
   ```bash
   npm run dev:candidate
   ```

2. **Sign in as candidate** (http://localhost:4000):
   - Email: candidate@acme.com
   - Password: password123

3. **Navigate to "My Exams"**:
   - Should see two tabs: "Pending Invitations" and "Enrolled Exams"
   - "Pending Invitations" tab should show badge with count (1)

4. **Verify pending invitation card shows**:
   - ✅ Exam title
   - ✅ Organization name (ACME Corporation)
   - ✅ Exam description
   - ✅ Duration (60 minutes)
   - ✅ Start date
   - ✅ End date
   - ✅ Invited date
   - ✅ Requirements badges (ID Verification, Lockdown Browser, etc.)
   - ✅ "Accept" button (primary)
   - ✅ "Decline" button (outline)

### Test Case 2: Accept Invitation

1. **Click "Accept" button** on the invitation card

2. **Verify acceptance**:
   - Button shows "Processing..." during action
   - After success, page refreshes
   - Invitation disappears from "Pending Invitations" tab
   - "Pending Invitations" badge count decreases to 0
   - "Enrolled Exams" badge count increases to 1

3. **Switch to "Enrolled Exams" tab**:
   - Should see the exam card
   - Status badge should show "Upcoming" (blue)
   - Should show enrolled date (today)
   - Should show attempts: 0 / 1
   - "Start Exam" button should be disabled (exam not started yet)
   - Helper text: "Exam will be available when it starts"

4. **Verify in database** (optional):
   ```sql
   SELECT id, status, approvedBy, approvedAt
   FROM "Enrollment"
   WHERE candidateId = '<candidate-user-id>';
   ```
   - Status should be "ENROLLED"
   - approvedBy should equal candidateId (self-approved)
   - approvedAt should be set to current timestamp

### Test Case 3: Decline Invitation

1. **Create another invitation** (as coordinator):
   - Create a second test exam
   - Invite candidate@acme.com again

2. **Sign in as candidate** and navigate to "My Exams"

3. **Click "Decline" button** on the new invitation

4. **Verify confirmation dialog**:
   - Dialog title: "Decline Invitation"
   - Dialog message: "Are you sure you want to decline this exam invitation? This action cannot be undone."
   - "Cancel" button
   - "Decline" button

5. **Click "Decline" in dialog**:
   - Button shows "Processing..." during action
   - After success, dialog closes and page refreshes
   - Invitation disappears from "Pending Invitations" tab
   - Badge count decreases

6. **Verify in database** (optional):
   ```sql
   SELECT id, status
   FROM "Enrollment"
   WHERE candidateId = '<candidate-user-id>'
   AND status = 'REJECTED';
   ```
   - Should see the declined enrollment with status "REJECTED"

### Test Case 4: Expired Invitation

1. **Create invitation with expiration** (requires database modification):
   ```sql
   UPDATE "Enrollment"
   SET "expiresAt" = NOW() - INTERVAL '1 day'
   WHERE candidateId = '<candidate-user-id>'
   AND status = 'PENDING';
   ```

2. **View as candidate**:
   - Invitation card should show "Expired" badge (red)
   - Card should have reduced opacity (60%)
   - "Accept" button should be disabled
   - "Decline" button should be disabled
   - Warning text: "This invitation has expired and can no longer be accepted"

3. **Attempt to accept** (should fail):
   - Even if manually triggered, server should reject with error: "This invitation has expired"

### Test Case 5: Empty States

1. **When no pending invitations**:
   - Text: "No pending invitations"
   - Helper text: "Check back later for new exam invitations"

2. **When no enrolled exams**:
   - Text: "No enrolled exams yet"
   - Helper text: "Check Pending Invitations to accept exam invitations"

### Test Case 6: Exam Status Badges

1. **Create multiple exams with different schedules**:
   - Past exam: scheduledStart = 7 days ago, scheduledEnd = 5 days ago
   - Active exam: scheduledStart = yesterday, scheduledEnd = tomorrow
   - Future exam: scheduledStart = tomorrow, scheduledEnd = 7 days from now

2. **Accept all three invitations**

3. **Verify status badges on enrolled exams**:
   - Past exam: "Ended" (gray/secondary)
   - Active exam: "Active" (default blue)
   - Future exam: "Upcoming" (default blue)

4. **Verify "Start Exam" button states**:
   - Past exam: Disabled, text: "Not Available", helper: "Exam period has ended"
   - Active exam: Disabled (exam taking not implemented yet)
   - Future exam: Disabled, text: "Not Available", helper: "Exam will be available when it starts"

### Test Case 7: Attempt Tracking

1. **Create exam with maxAttempts = 3**

2. **Accept invitation**

3. **Verify attempts display**:
   - Should show: "Attempts: 0 / 3"

4. **Simulate used attempt** (requires database):
   ```sql
   INSERT INTO "ExamSession" (id, examId, enrollmentId, candidateId, attemptNumber, status)
   VALUES (
     gen_random_uuid(),
     '<exam-id>',
     '<enrollment-id>',
     '<candidate-id>',
     1,
     'COMPLETED'
   );
   ```

5. **Refresh page**:
   - Should show: "Attempts: 1 / 3"

6. **Add 2 more sessions to reach limit**

7. **Verify at max attempts**:
   - Should show: "Attempts: 3 / 3"
   - "Start Exam" button: Disabled
   - Helper text: "Maximum attempts reached"

### Test Case 8: Permission Validation

1. **Test without CANDIDATE role** (requires database modification):
   - Remove CANDIDATE role from user
   - Attempt to access /dashboard/exams
   - Should get error: "No candidate role found"

2. **Test with wrong organization** (requires database modification):
   - Create enrollment in different organization
   - Should not appear in pending invitations (organization-scoped)

3. **Test with wrong candidate** (requires API testing):
   - Try to accept enrollment belonging to different candidate
   - Should get error: "Unauthorized: You are not the candidate for this enrollment"

## Edge Cases to Verify

- ✅ Multiple pending invitations display correctly
- ✅ Multiple enrolled exams display correctly
- ✅ Tab switching preserves state
- ✅ Badge counts update after accept/decline
- ✅ Loading states prevent double-clicks
- ✅ Error messages display properly
- ✅ Date formatting is consistent
- ✅ Responsive layout works on mobile
- ✅ Dialog can be closed via X button or Cancel
- ✅ Requirements badges only show when applicable

## Known Limitations (Future Enhancements)

- "Start Exam" button is disabled (exam taking not implemented - Phase 3)
- No email notifications for invitations
- No invitation expiration warnings before expiry
- No bulk accept/decline
- No invitation history view for rejected invitations
- No calendar integration
- No two-step approval flow

## Success Criteria

All test cases pass with:
- ✅ Correct data display
- ✅ Proper permission checks
- ✅ Accurate status transitions
- ✅ Good user experience (loading states, confirmations, empty states)
- ✅ No console errors
- ✅ Database state matches UI state

## Automated Testing Notes

This feature currently has no automated tests. Recommended additions:
1. Unit tests for server actions (permission validation, status transitions)
2. Integration tests for database queries
3. E2E tests for accept/decline flows
4. Component tests for UI elements
