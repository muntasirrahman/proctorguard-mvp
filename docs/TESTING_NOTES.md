# Coordinator Dashboard Testing Notes

Date: 2026-02-09
Tester: Claude + Browser Automation

## Test Environment
- **URL**: http://localhost:4003
- **User**: coordinator@acme.com
- **Browser**: Chrome (automated via MCP)

## Issues Found & Fixed

### 1. Icon Import Error (FIXED)
**Issue**: Dashboard layout was passing Lucide icon components directly to Client Components
**Error**: "Functions cannot be passed directly to Client Components"
**Fix**: Changed `icon: Calendar` to `icon: 'Calendar'` (string instead of component)
**File**: `apps/coordinator/app/dashboard/layout.tsx`
**Commit**: 0c9c3f6

### 2. Import Path Errors (FIXED)
**Issue**: Multiple files had incorrect relative import paths for actions
**Error**: "Module not found: Can't resolve '../../../actions/...'"
**Affected Files**:
- `apps/coordinator/app/dashboard/exams/[id]/enrollment-list.tsx`
- `apps/coordinator/app/dashboard/exams/[id]/exam-actions.tsx`
- `apps/coordinator/app/dashboard/exams/[id]/page.tsx`
- `apps/coordinator/app/dashboard/exams/new/page.tsx`

**Fix**: Changed all imports from `../../actions/` to `../../../actions/`
**Commit**: 657df9d

### 3. Missing Switch Component (FIXED)
**Issue**: ExamForm was importing Switch component that doesn't exist in UI package
**Error**: "React.jsx: type is invalid -- expected a string... but got: undefined"
**Fix**: Replaced all `Switch` instances with `Checkbox` (which is exported)
**File**: `apps/coordinator/app/dashboard/exams/exam-form.tsx`
**Commit**: 657df9d

## Successfully Tested Features

### ✅ Authentication & Navigation
- [x] Sign-in page loads correctly
- [x] Sign-in with coordinator@acme.com works
- [x] Dashboard redirects authenticated users
- [x] User menu displays correct email
- [x] "Exams" navigation item visible in sidebar

### ✅ Dashboard Layout
- [x] ProctorGuard branding displays
- [x] "EXAM COORDINATOR" label shows in sidebar
- [x] Dashboard shell renders correctly
- [x] Empty state shows "No exams yet" message
- [x] "Create Exam" and "Create Your First Exam" buttons present

### ✅ Create Exam Form
- [x] Navigation to /dashboard/exams/new works
- [x] Form loads without errors
- [x] Basic Information card displays:
  - Title field with placeholder
  - Description textarea
  - Department dropdown
  - Question Bank dropdown (required)
- [x] Configuration card displays:
  - Duration (minutes) field (default: 60)
  - Passing Score (%) field (default: 70)
  - Allowed Attempts field (default: 1)

## Not Yet Tested

### Exam CRUD Operations
- [ ] Create exam with valid data
- [ ] Form validation (required fields)
- [ ] Edit exam functionality
- [ ] Delete exam functionality
- [ ] Exam status transitions (DRAFT→SCHEDULED→ACTIVE→COMPLETED)

### Enrollment Management
- [ ] Single candidate invitation
- [ ] Bulk candidate invitation
- [ ] Enrollment approval
- [ ] Enrollment rejection
- [ ] Enrollment removal

### Data Display
- [ ] Exam list view with populated data
- [ ] Exam detail page
- [ ] Enrollment list rendering
- [ ] Status badges
- [ ] Metrics display

### Error Handling
- [ ] Invalid form data
- [ ] Duplicate enrollments
- [ ] Non-existent candidate emails
- [ ] Permission errors

## Known Limitations

1. **No Switch Component**: The UI package doesn't have a Switch component, so checkboxes are used instead for boolean options (e.g., "Enable Recording")

2. **Test Data**: The seed script has some issues:
   - Users already exist, causing seed to fail
   - All roles should be properly assigned (verified manually)

## Recommendations

1. **Add Switch Component**: Create a proper Switch component in the UI package for better UX
2. **Fix Seed Script**: Make seed script idempotent (skip existing users)
3. **Continue Manual Testing**: Use the checklist at `/tmp/testing-checklist.md` for complete test coverage
4. **Add E2E Tests**: Consider adding Playwright tests for critical flows

## Next Steps

The dashboard is now functional and ready for manual testing. Use the browser to:
1. Create a test exam
2. Try inviting candidates
3. Test lifecycle transitions
4. Verify error handling
