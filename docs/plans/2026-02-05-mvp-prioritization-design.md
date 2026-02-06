# ProctorGuard MVP Prioritization Design

**Date**: 2026-02-05
**Status**: Approved
**Context**: First paying customer pilot -- 1 org, <50 candidates

## Decisions

- **Proctoring**: Browser-only webcam recording (MediaRecorder API + Vercel Blob). No lockdown browser, no real-time AI. Flags are created manually by reviewers post-exam.
- **Scale**: Single organization, small candidate pool. Multi-tenancy exists in the schema but edge cases deferred.
- **Scoring**: Auto-score objective questions (MCQ, true/false). Essay questions scored manually by reviewers.

## Phase 1: Admin & Author Setup

Build the back-office tools that create content and manage users.

### 1.1 Auth Flow (all apps)
- Sign-in / sign-up pages using Better Auth
- Session-aware layouts with nav, user menu, sign-out
- Middleware redirects for unauthenticated users (already partially exists)

### 1.2 Admin Dashboard (port 3002)
- **Org overview**: name, member count, department list
- **User management**: list users, invite by email, assign/remove roles
- **Department CRUD**: create, rename, delete departments
- **Role assignment**: assign roles per user per org (from the 9 Role enum values)

### 1.3 Author Dashboard (port 3003)
- **Question bank list**: author's banks with status badges, search/filter
- **Question bank CRUD**: create, edit title/description/tags, change status (DRAFT -> IN_REVIEW)
- **Question editor**: create/edit questions within a bank
  - Types: multiple_choice, true_false, essay
  - Fields: text, options (for MCQ), correct answer, explanation, difficulty, points, time limit
  - Status workflow: DRAFT -> IN_REVIEW -> APPROVED
- **Bulk operations**: delete selected questions, change status in batch

## Phase 2: Exam Configuration & Enrollment

### 2.1 Coordinator Dashboard (port 3004)
- **Exam list**: all exams for the org with status, date, candidate count
- **Exam CRUD**: create exam with:
  - Title, description, department (optional)
  - Select question bank (only APPROVED banks)
  - Duration (minutes), passing score (%), allowed attempts
  - Schedule: start/end datetime
  - Proctoring toggles: require recording (on by default), others off for MVP
- **Exam lifecycle**: DRAFT -> SCHEDULED -> ACTIVE -> COMPLETED
  - SCHEDULED: auto-transition or manual activation
  - COMPLETED: after scheduled end or manual close
- **Enrollment management**:
  - View enrolled candidates per exam
  - Invite candidates by email (creates Enrollment with PENDING status)
  - Approve/reject enrollment requests
  - Bulk invite via email list

### 2.2 Candidate Enrollment View (port 3001)
- View pending invitations, accept/decline
- See upcoming enrolled exams with schedule info

## Phase 3: Exam-Taking Experience

The core product value -- candidates take exams through the browser.

### 3.1 Candidate Dashboard (port 3001)
- **Upcoming exams**: enrolled exams with countdown, "Start Exam" button (when within schedule window)
- **Past exams**: completed sessions with score, pass/fail status
- **Active session**: resume in-progress exam if browser was closed

### 3.2 Pre-Exam Flow
1. System check: verify camera permission via browser API
2. Camera preview: candidate sees themselves, confirms readiness
3. Accept exam rules/terms (simple checkbox acknowledgment)
4. Begin exam -> creates ExamSession, starts timer

### 3.3 Exam Interface
- **Question display**: one question at a time, rendered by type
  - MCQ: radio buttons for single-answer, checkboxes for multi-answer
  - True/false: two radio buttons
  - Essay: textarea with character count
- **Navigation**: previous/next buttons, question navigator sidebar (numbered grid showing answered/unanswered/flagged)
- **Timer**: countdown display, warnings at 10min and 5min remaining
- **Flag for review**: candidate can flag questions to revisit
- **Auto-save**: answers saved on each change (Server Action or API call)
- **Submit**: review page showing all questions (answered/unanswered), confirm submission

### 3.4 Webcam Recording
- Start MediaRecorder on exam begin (video/webm, ~720p)
- Record continuously throughout exam session
- On submission: upload recording to Vercel Blob storage
- Store blob key in ExamSession.recordingBlobKey
- Handle errors gracefully: if recording fails, exam still proceeds (log warning)

### 3.5 Auto-Scoring
- On submission, score all objective questions immediately
- Calculate total score, determine pass/fail against exam's passingScore
- Update ExamSession: score, passed, status -> COMPLETED
- Essay questions: leave points as null, require manual review

## Phase 4: Post-Exam Review

### 4.1 Reviewer Dashboard (port 3005)
- **Session list**: filterable by exam, status, date range, review status
- **Session detail view**:
  - Candidate info, exam info, score, timing
  - Video playback of recording (from Vercel Blob URL)
  - Answer review: see each answer, correctness, time spent
  - Flag panel: list existing flags, create new manual flags
- **Flag creation**: select type (from FlagType enum), severity, description, timestamp
- **Review actions**:
  - Mark session as CLEARED (no issues)
  - Mark as VIOLATION_CONFIRMED (with notes)
  - Change review status: PENDING -> IN_REVIEW -> CLEARED/VIOLATION

### 4.2 Candidate Results View (port 3001)
- Score and pass/fail status
- Per-question breakdown (for objective questions): correct/incorrect
- Flag summary: any flags raised on the session (type, description)
- Session status: cleared, under review, violation confirmed

### 4.3 Audit Logging
- Log to AuditLog table for all sensitive operations:
  - User role changes
  - Question bank status changes
  - Exam creation/modification
  - Enrollment changes
  - Session review decisions
  - Flag creation/resolution
- Fields: userId, action, resource, resourceId, details (JSON), ipAddress, timestamp

## Out of Scope (Post-MVP)

These are explicitly deferred:
- Lockdown browser (native desktop app)
- Real-time AI monitoring (face detection, gaze tracking, device detection)
- Identity verification (ID scan, liveness detection, face matching)
- Appeals system with evidence viewer
- HRIS integrations (Workday, SAP, Oracle)
- Analytics dashboards and KPI metrics
- Consent management and GDPR data subject rights workflows
- Bias monitoring
- Accommodation management
- Multi-org advanced features (org switching, cross-org reporting)

## Technical Notes

- All Server Actions must check session + permissions (per CLAUDE.md patterns)
- Use `@proctorguard/ui` (shadcn/ui) for all components
- Use `@proctorguard/database` (Prisma) for all DB access
- MediaRecorder API for webcam capture (Chrome/Firefox/Safari support)
- Vercel Blob for video storage
- No schema changes needed -- current schema covers all MVP features
