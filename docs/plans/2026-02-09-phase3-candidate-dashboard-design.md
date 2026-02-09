# Phase 3: Candidate Dashboard with Session Management - Design

**Date:** 2026-02-09
**Status:** Approved
**Phase:** 3 of MVP
**Dependencies:** Phase 2 (Candidate enrollment view) ✅ Complete

## Overview

Transform the existing "Enrolled Exams" view from a static list into an interactive dashboard that manages exam sessions throughout their lifecycle. Candidates can start new exams, resume in-progress sessions, and view completed exam results - all from a unified, state-aware interface.

## Goals

1. **Session Management:** Create and track ExamSession records when candidates start exams
2. **Resume Capability:** Allow candidates to resume IN_PROGRESS sessions with expiration handling
3. **State-Aware UI:** Group and display exams by their current state (In Progress, Available, Upcoming, Completed)
4. **Lifecycle Foundation:** Establish the session creation/routing layer that Phase 4 (exam-taking flow) will build upon

## Core Capability

The dashboard automatically determines each exam's state based on:
- Existing sessions (IN_PROGRESS, COMPLETED)
- Exam schedule window (scheduledStart, scheduledEnd)
- Attempt limits (attemptsUsed vs allowedAttempts)
- Session expiration (exam window end OR duration elapsed from startedAt)

## Architecture

### Components

1. **Enhanced EnrolledExams Component**
   - Groups exams by state with visual priority
   - State-specific buttons and information
   - Real-time state calculation

2. **Session Management Actions** (`apps/candidate/app/actions/sessions.ts`)
   - `startExam()` - Creates session, validates eligibility
   - `resumeSession()` - Validates expiration, returns session
   - `getSessionState()` - Determines current state

3. **Placeholder Exam Page** (`/dashboard/exams/[id]/take`)
   - Shows session context and "Coming Soon" message
   - Validates session exists and belongs to candidate
   - Establishes routing pattern for Phase 4

4. **Session Expiration Logic**
   - Sessions expire when: `now >= min(scheduledEnd, startedAt + duration)`
   - Expired sessions auto-complete on resume attempt

### Data Flow

```
Dashboard Load
  ↓
Fetch enrolled exams + latest session per enrollment
  ↓
Calculate state for each exam
  ↓
Group: In Progress → Available → Upcoming → Completed
  ↓
Render with state-specific UI

Button Click (Start/Resume)
  ↓
Server Action validates state
  ↓
Create/Find session
  ↓
Redirect to /dashboard/exams/[enrollmentId]/take?session=[sessionId]
  ↓
(Phase 4 will build exam UI at this route)
```

### Database

**No schema changes required.** Uses existing models:
- `Enrollment` - tracks attemptsUsed
- `ExamSession` - tracks session state (NOT_STARTED, IN_PROGRESS, COMPLETED)
- `Exam` - provides schedule window and duration

## UI Organization

### Enhanced Enrolled Exams Tab

Four distinct card types, each with unique styling and actions:

#### 1. In Progress Sessions (Top - Green Accent)
**Visual:** Green left border, prominent position
**Button:** "Resume Exam" (green, full width)
**Shows:**
- Time remaining: "45 minutes remaining"
- Progress indicator: "Started 15 min ago"
- Warning badge if < 10 minutes remaining
- Attempt number

**Sorting:** Most recent first

#### 2. Available Exams (Blue Accent)
**Visual:** Blue left border
**Button:** "Start Exam" (blue, full width)
**Shows:**
- "Available until [end time]"
- Duration: "60 minutes"
- Attempts: "1 / 3 attempts used"
- Exam description

**Sorting:** Soonest ending window first

#### 3. Upcoming Exams (Grey Accent)
**Visual:** Grey left border, muted colors
**Button:** Disabled "Starts [date/time]"
**Shows:**
- Countdown: "Starts in 2 days 5 hours"
- For < 24 hours: Live countdown timer
- Schedule window
- Exam description

**Sorting:** Soonest starting time first

#### 4. Completed Exams (Bottom - Muted)
**Visual:** No border, subtle styling
**Button:** None
**Shows:**
- Score: "85 / 100"
- Pass/Fail badge (green/red)
- Completion date: "Completed Feb 9, 2026"
- Time taken: "Completed in 52 minutes"
- "Maximum attempts reached" badge (if applicable)

**Sorting:** Most recent completion first

### Visual Hierarchy

Each section has a header with count:
- "Active Session (1)"
- "Available Now (2)"
- "Upcoming (3)"
- "Past Exams (5)"

Cards use:
- Color-coded left borders (4px thick)
- State-appropriate button colors and styles
- Consistent spacing and typography
- Responsive grid (1 column mobile, 2 columns desktop)

## Session Management Logic

### State Determination Algorithm

For each enrolled exam, apply this logic:

```typescript
function getExamState(enrollment, exam, latestSession) {
  const now = new Date();

  // Check for IN_PROGRESS session
  if (latestSession?.status === 'IN_PROGRESS') {
    const expiresAt = Math.min(
      exam.scheduledEnd,
      latestSession.startedAt + (exam.duration * 60 * 1000)
    );

    if (now < expiresAt) {
      return 'IN_PROGRESS';
    } else {
      // Auto-expire on next resume attempt
      return 'EXPIRED';
    }
  }

  // Check if within exam window
  if (now >= exam.scheduledStart && now <= exam.scheduledEnd) {
    if (enrollment.attemptsUsed < exam.allowedAttempts) {
      return 'AVAILABLE';
    }
  }

  // Check if upcoming
  if (now < exam.scheduledStart) {
    return 'UPCOMING';
  }

  // Otherwise completed/past
  return 'COMPLETED';
}
```

### Session Creation (Start Exam)

**Triggered by:** "Start Exam" button click

**Validations:**
1. Exam status is ACTIVE or SCHEDULED
2. Current time is within [scheduledStart, scheduledEnd]
3. `enrollment.attemptsUsed < exam.allowedAttempts`
4. No existing IN_PROGRESS session for this enrollment

**Actions:**
1. Create ExamSession:
   ```typescript
   {
     examId: exam.id,
     enrollmentId: enrollment.id,
     candidateId: session.user.id,
     attemptNumber: enrollment.attemptsUsed + 1,
     status: 'NOT_STARTED',
     startedAt: null, // Set when exam UI loads
     // other fields default
   }
   ```
2. Increment `enrollment.attemptsUsed`
3. Return session ID

**On Success:** Redirect to `/dashboard/exams/[enrollmentId]/take?session=[sessionId]`

**On Failure:** Show error toast, stay on dashboard

### Session Resume

**Triggered by:** "Resume Exam" button click

**Validations:**
1. Find IN_PROGRESS session for enrollment
2. Check expiration:
   ```typescript
   const expiresAt = Math.min(
     exam.scheduledEnd,
     session.startedAt + (exam.duration * 60 * 1000)
   );
   const isExpired = now >= expiresAt;
   ```

**If Expired:**
1. Update session: `{ status: 'COMPLETED', completedAt: now }`
2. Show toast: "Session expired. Your answers have been submitted."
3. Stay on dashboard (session moves to Completed section)

**If Valid:**
1. Return session ID
2. Redirect to `/dashboard/exams/[enrollmentId]/take?session=[sessionId]`

### Session Expiration Rules

A session expires when **either** condition is met:

1. **Exam window ends:** `now >= exam.scheduledEnd`
2. **Duration elapses:** `now >= session.startedAt + (exam.duration * 60 * 1000)`

**Example:**
- Exam window: 9am - 5pm
- Duration: 60 minutes
- Candidate starts at 4:30pm
- Session expires at 5pm (window ends), not 5:30pm (duration would allow)

## Implementation Structure

### New Files

**1. `apps/candidate/app/actions/sessions.ts`**

Server actions for session management:

```typescript
'use server';

import { auth } from '@proctorguard/auth';
import { prisma } from '@proctorguard/database';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function startExam(enrollmentId: string) {
  // 1. Authenticate
  // 2. Validate enrollment ownership
  // 3. Check exam is available (window, attempts)
  // 4. Create session (NOT_STARTED)
  // 5. Increment attemptsUsed
  // 6. Return { success: true, sessionId }
}

export async function resumeSession(enrollmentId: string) {
  // 1. Authenticate
  // 2. Find IN_PROGRESS session
  // 3. Check expiration
  // 4. If expired: auto-complete, return error
  // 5. If valid: return { success: true, sessionId }
}

export async function getExamState(enrollment, exam, latestSession) {
  // Implements state determination algorithm
  // Returns: 'IN_PROGRESS' | 'AVAILABLE' | 'UPCOMING' | 'COMPLETED' | 'EXPIRED'
}
```

**2. `apps/candidate/app/dashboard/exams/[id]/take/page.tsx`**

Placeholder exam page for Phase 3:

```typescript
export default async function TakeExamPage({
  params,
  searchParams
}: {
  params: { id: string },
  searchParams: { session: string }
}) {
  // 1. Validate session exists
  // 2. Check session belongs to current user
  // 3. Load exam and session details
  // 4. Show placeholder UI:
  //    - Exam title and description
  //    - Session info (attempt, time remaining)
  //    - "Exam interface coming in Phase 4"
  //    - Timer display (non-functional)
  //    - "Exit" button → back to dashboard
}
```

### Modified Files

**1. `apps/candidate/app/actions/enrollments.ts`**

Update `getEnrolledExams()`:

```typescript
export async function getEnrolledExams() {
  // ... existing auth ...

  const enrollments = await prisma.enrollment.findMany({
    where: {
      candidateId: session.user.id,
      status: 'ENROLLED'
    },
    include: {
      exam: {
        include: { organization: true }
      },
      // ADD THIS:
      sessions: {
        orderBy: { createdAt: 'desc' },
        take: 1, // Get latest session only
        where: {
          status: { in: ['NOT_STARTED', 'IN_PROGRESS'] }
        }
      }
    },
    orderBy: { approvedAt: 'desc' }
  });

  return enrollments;
}
```

**2. `apps/candidate/app/dashboard/exams/enrolled-exams.tsx`**

Major enhancements:

```typescript
'use client';

import { startExam, resumeSession } from '../../actions/sessions';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner'; // or your toast library

type EnrolledExam = {
  // ... existing fields ...
  sessions: Array<{
    id: string;
    status: string;
    startedAt: Date | null;
  }>;
};

export function EnrolledExams({ exams }: Props) {
  const router = useRouter();

  // Group exams by state
  const { inProgress, available, upcoming, completed } = groupExamsByState(exams);

  const handleStart = async (enrollmentId: string) => {
    const result = await startExam(enrollmentId);
    if (result.success) {
      router.push(`/dashboard/exams/${enrollmentId}/take?session=${result.sessionId}`);
    } else {
      toast.error(result.error);
    }
  };

  const handleResume = async (enrollmentId: string) => {
    const result = await resumeSession(enrollmentId);
    if (result.success) {
      router.push(`/dashboard/exams/${enrollmentId}/take?session=${result.sessionId}`);
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="space-y-8">
      {inProgress.length > 0 && (
        <Section title="Active Session" count={inProgress.length}>
          {/* Render IN_PROGRESS cards with Resume button */}
        </Section>
      )}

      {available.length > 0 && (
        <Section title="Available Now" count={available.length}>
          {/* Render AVAILABLE cards with Start button */}
        </Section>
      )}

      {upcoming.length > 0 && (
        <Section title="Upcoming" count={upcoming.length}>
          {/* Render UPCOMING cards with disabled button */}
        </Section>
      )}

      {completed.length > 0 && (
        <Section title="Past Exams" count={completed.length}>
          {/* Render COMPLETED cards with scores */}
        </Section>
      )}
    </div>
  );
}
```

## Error Handling

### Session Creation Fails
- **Cause:** Network error, database issue, validation failure
- **Behavior:** Show error toast with message
- **User Action:** Stay on dashboard, can retry by clicking button again
- **Example:** "Unable to start exam. Please try again."

### Session Expired on Resume
- **Cause:** IN_PROGRESS session past expiration time
- **Behavior:**
  1. Auto-update session to COMPLETED
  2. Show toast: "Session expired. Your answers have been submitted."
  3. Stay on dashboard
  4. Session moves to Completed section
- **User Action:** Can start new attempt if available

### Max Attempts Reached
- **Behavior:** Button disabled with explanation text
- **Example:** "Maximum attempts reached (3/3)"
- **No Action Needed:** UI clearly indicates no more attempts available

### Invalid Session ID
- **Cause:** Tampered URL, deleted session, wrong user
- **Behavior:** Redirect to dashboard with error toast
- **Example:** "Invalid session. Please start the exam again."

## Testing Strategy

### Manual Testing Checklist

1. **State Transitions**
   - [ ] Enroll in exam → appears in Upcoming
   - [ ] Wait for window to open → moves to Available
   - [ ] Click Start → session created, redirects to placeholder
   - [ ] Go back to dashboard → appears in In Progress
   - [ ] Click Resume → redirects to same session

2. **Expiration Handling**
   - [ ] Start exam, wait for duration to elapse
   - [ ] Return to dashboard, click Resume
   - [ ] Verify: "Session expired" toast, session in Completed

3. **Window Boundaries**
   - [ ] Create exam starting in 1 hour → shows countdown
   - [ ] Wait for start time → moves to Available
   - [ ] Start exam 30 min before window ends (60 min duration)
   - [ ] Verify session expires at window end (not after full duration)

4. **Attempt Limits**
   - [ ] Enroll in exam with allowedAttempts = 2
   - [ ] Complete first attempt → still shows in Available
   - [ ] Complete second attempt → moves to Completed, button disabled

5. **Multiple Exams**
   - [ ] Enroll in 5+ exams with different states
   - [ ] Verify correct grouping and sorting
   - [ ] Start one exam → verify only that one shows Resume

6. **Error Handling**
   - [ ] Disable network in dev tools
   - [ ] Click Start → verify toast error, stays on dashboard
   - [ ] Re-enable network, click again → verify success

### Edge Cases Handled

- **Clock Skew:** All time calculations use server time (server actions)
- **Concurrent Sessions:** Only one IN_PROGRESS session allowed per enrollment
- **Rapid Clicking:** Server action validates state before creating session (race condition safe)
- **Expired While Viewing:** State recalculated on each dashboard visit
- **Missing Schedule:** If scheduledStart/End is null, exam shows as "Scheduled" (not Available)

## Out of Scope (Future Phases)

**Phase 4 - Exam Taking Flow:**
- Actual question display and navigation
- Answer submission and validation
- Functional timer with warnings
- Identity verification before starting
- Pre-exam instructions and requirements check

**Phase 5 - Proctoring & Review:**
- Real-time monitoring during exam
- Recording upload and storage
- Flag generation and display
- Reviewer adjudication

**Future Enhancements:**
- Detailed results page (question-by-question breakdown)
- Session pause/resume across page refreshes
- Offline exam support with sync
- Practice mode / exam preview

## Success Criteria

✅ **Functional Requirements:**
- Candidates can start new exam sessions when exams are available
- IN_PROGRESS sessions display prominently with Resume option
- Sessions auto-expire correctly based on window + duration
- Completed exams show score, pass/fail, and session details
- Dashboard accurately reflects current state of all enrolled exams

✅ **Technical Requirements:**
- No database schema changes
- Server-side validation for all actions
- Permission checks (candidate owns enrollment)
- Proper error handling with user-friendly messages
- Revalidation after mutations

✅ **UX Requirements:**
- Clear visual hierarchy (In Progress most prominent)
- State-appropriate button labels and colors
- Helpful empty states and error messages
- Countdown timers for upcoming exams
- Responsive layout (mobile + desktop)

## Next Steps

1. **Implementation:** Create detailed implementation plan with step-by-step tasks
2. **Set Up Worktree:** Isolated workspace for Phase 3 development
3. **Build & Test:** Implement components and server actions
4. **Manual Testing:** Verify all state transitions and error cases
5. **Prepare for Phase 4:** Ensure placeholder page has all context needed for exam UI

---

**Design Complete:** 2026-02-09
**Ready for Implementation:** Yes
