# Phase 4: Exam-Taking Flow - Design

**Date:** 2026-02-09
**Status:** Approved
**Phase:** 4 of MVP
**Dependencies:** Phase 3 (Candidate dashboard with session management) ✅ Complete

## Overview

Transform the placeholder exam page from Phase 3 into a fully functional exam interface. Candidates can complete pre-exam checks, answer questions with continuous auto-save, navigate with a question palette, review their answers, and submit - all with a countdown timer and proper session management.

## Goals

1. **Pre-Exam Checks:** Verify browser compatibility, show instructions, request camera access (if recording enabled)
2. **Interactive Exam Interface:** One question at a time with palette navigation
3. **Continuous Auto-Save:** Never lose candidate work - debounced saves every 2-3 seconds
4. **Timer with Warnings:** Countdown timer with alerts at 10min, 5min, 1min, auto-submit at 0:00
5. **Review Before Submit:** Show all questions/answers before final submission
6. **Session Resumption:** Resume from last viewed question with all progress restored

## Core Flow

```
Candidate Dashboard
  ↓ Click "Start Exam" or "Resume Exam"
  ↓
Landing on /dashboard/exams/[id]/take?session=[sessionId]
  ↓
[If NOT_STARTED] → Pre-Exam Checks Screen
  - Browser compatibility check
  - Display exam instructions
  - Agree to policies (checkboxes)
  - Camera access check (if enableRecording)
  ↓ Click "Begin Exam"
  ↓ Session: NOT_STARTED → IN_PROGRESS, startedAt = now
  ↓
[If IN_PROGRESS] → Exam Interface
  - Load questions and saved answers
  - Resume at lastViewedQuestionIndex
  - Start/resume countdown timer
  ↓
Taking Exam
  - View questions one at a time
  - Answer with type-specific inputs
  - Auto-save on typing (debounced 2s)
  - Auto-save on navigation
  - Navigate: Previous/Next or click palette
  - Flag questions for review
  - Timer counts down with warnings
  ↓ Click "Review & Submit"
  ↓
Review Screen
  - See all questions and answers
  - Highlight unanswered/flagged
  - Show summary stats
  ↓ Click "Submit Exam" → Confirmation modal
  ↓ Confirm
  ↓
Submission
  - Session: IN_PROGRESS → COMPLETED
  - completedAt = now
  - Show success message
  - Redirect to dashboard (3s)
```

## Architecture

### Component Structure

**Server Components:**
- `TakeExamPage` - Entry point, validation, data loading

**Client Components:**
- `PreExamChecks` - Browser check, instructions, camera preview
- `ExamInterface` - Main exam UI wrapper (timer, layout)
- `QuestionDisplay` - Renders question based on type
- `QuestionPalette` - Sidebar navigation with status
- `ExamTimer` - Countdown with warnings
- `ReviewScreen` - All questions before submit

**Server Actions:**
- `startExamSession(sessionId)` - Transition NOT_STARTED → IN_PROGRESS
- `saveAnswer(sessionId, questionId, answerData)` - Upsert answer + update lastViewedQuestionIndex
- `submitExam(sessionId)` - Transition IN_PROGRESS → COMPLETED

### State Management

**Server-Side (Database):**
- Session status (NOT_STARTED, IN_PROGRESS, COMPLETED)
- Answer records (one per question, upserted on save)
- lastViewedQuestionIndex (for resumption)

**Client-Side (React State):**
- Current question index
- All answers (loaded from DB, updated optimistically)
- Timer remaining seconds
- Flag states per question
- UI state (which screen showing)

## Pre-Exam Checks Screen

### Purpose
Verify candidate is ready before starting the timer. Session remains NOT_STARTED during this phase.

### Checks Performed

**1. Browser Compatibility**
- Detect browser type and version
- Require: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- Block: IE, old browsers, mobile browsers (configurable)
- Show error if incompatible: "This exam requires a modern desktop browser"

**2. Exam Instructions & Policies**
- Display `exam.instructions` (rich text)
- Show exam details: duration, question count, attempts
- List proctoring features: camera, AI monitoring
- Checkbox: "I have read and understood the exam instructions" (required)
- Checkbox: "I agree to the exam policies and academic integrity guidelines" (required)

**3. Camera Access Check** (if `exam.enableRecording === true`)
- Request via `navigator.mediaDevices.getUserMedia({ video: true })`
- Show live preview (small video element)
- Display status: "Camera is active ✓"
- If denied: "Camera access required. Please enable in browser settings."
- **Note:** Preview only - actual recording is Phase 5

### UI Layout

```
┌─────────────────────────────────────────────┐
│         Exam: [Title]                       │
│         Organization: [Org Name]            │
├─────────────────────────────────────────────┤
│                                             │
│  Pre-Exam Checklist                         │
│                                             │
│  ✓ Browser Compatibility                    │
│    Chrome 120 detected                      │
│                                             │
│  📋 Exam Instructions                       │
│    [Instructions text display]              │
│                                             │
│    ☐ I have read the instructions          │
│    ☐ I agree to exam policies              │
│                                             │
│  📷 Camera Check (if recording enabled)     │
│    [Live camera preview]                    │
│    ✓ Camera is active                       │
│                                             │
│  [Begin Exam] (enabled when all checked)    │
│  [Exit to Dashboard]                        │
│                                             │
└─────────────────────────────────────────────┘
```

### Transition to Exam

**On "Begin Exam" click:**
1. Call `startExamSession(sessionId)`
2. Server updates: `status = IN_PROGRESS`, `startedAt = now()`
3. Client transitions to `ExamInterface` component
4. Timer starts countdown

## Exam Interface

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ [Exam Title] | ⏱ Timer: 45:32 | Attempt 1/3                 │
├─────────────────────────────┬───────────────────────────────┤
│                             │                               │
│  Question Display           │   Question Palette            │
│                             │                               │
│  Question 5 of 20           │   Filter: [All ▼]             │
│  Worth 5 points             │   ┌─────────────────────┐    │
│                             │   │ 1✓  6✓  11○  16○    │    │
│  [Question text here with   │   │ 2✓  7○  12✓  17○    │    │
│   formatting support]       │   │ 3✓  8○  13○  18○    │    │
│                             │   │ 4○  9✓  14✓  19○    │    │
│  [Answer input/options      │   │ 5⚑  10○ 15✓  20○    │    │
│   based on question type]   │   └─────────────────────┘    │
│                             │                               │
│  ☐ Flag for Review          │   Status:                     │
│                             │   • 15 answered               │
│  [Auto-save status]         │   • 5 unanswered              │
│                             │   • 1 flagged                 │
│  [< Previous]  [Next >]     │                               │
│                             │   [Review & Submit]           │
└─────────────────────────────┴───────────────────────────────┘
```

### Question Display Component

**Header:**
- Question number: "Question 5 of 20"
- Points value: "Worth 5 points"

**Question Content:**
- Question text (supports basic formatting)
- Optional: Image/diagram display

**Answer Input by Type:**

**Multiple Choice:**
```typescript
○ Option A text
○ Option B text
○ Option C text
○ Option D text
```
- Radio buttons (single selection)
- Store `selectedOption` as option ID

**True/False:**
```typescript
○ True
○ False
```
- Two radio buttons
- Store as "true" or "false" string

**Short Answer:**
```typescript
[Single line text input]
```
- Input field, 500 char limit
- Store in `textResponse`

**Essay:**
```typescript
[Multi-line textarea, auto-expanding]
```
- Textarea, 5000 char limit
- Character counter: "245 / 5000 characters"
- Store in `textResponse`

**Controls:**
- Checkbox: "Flag for Review"
- Navigation buttons: "Previous" | "Next"
- Auto-save indicator: "Saved ✓" or "Saving..."

### Timer Component

**Display:**
- Format: "MM:SS" (e.g., "45:32")
- Fixed position in header, always visible
- Updates every second via `setInterval`

**Color Coding:**
- Normal (> 10 min): default text color
- Warning (≤ 10 min): yellow (`text-yellow-600`)
- Critical (≤ 5 min): red (`text-red-600`)

**Warnings:**
- **At 10 minutes:** Toast notification "10 minutes remaining"
- **At 5 minutes:** Toast notification "5 minutes remaining"
- **At 1 minute:** Modal popup "Only 1 minute left!" with dismiss button

**Expiration (0:00):**
- Automatically call `submitExam(sessionId)`
- Show modal: "Time's up! Your exam has been submitted."
- Redirect to dashboard

**Calculation:**
- Remaining = min(scheduledEnd, startedAt + duration) - now
- Consistent with Phase 3 expiration logic

### Question Palette Sidebar

**Purpose:** Navigation and progress overview

**Status Indicators:**
- **Answered (✓):** Green checkmark - question has saved answer
- **Unanswered (○):** Gray circle - no answer yet
- **Flagged (⚑):** Orange flag icon (overlays status)
- **Current:** Blue background/border highlight

**Filter Dropdown:**
- Options: "All" | "Unanswered" | "Flagged"
- Updates visible question numbers
- Default: "All"

**Grid Layout:**
- Compact grid: 4-5 numbers per row
- Click any number → jump to that question
- Scrollable if many questions

**Status Counts:**
- Display below grid: "15 answered, 5 unanswered, 1 flagged"
- Updates in real-time

**Review Button:**
- "Review & Submit" button at bottom
- Primary color, always accessible
- Opens ReviewScreen component

**Keyboard Navigation:**
- Tab through numbers
- Enter to jump to question
- Screen reader: "Question 5, answered"

## Auto-Save Mechanism

### Triggers

**1. Continuous Auto-Save (Typing):**
- Debounced 2 seconds after last keystroke
- Applies to short answer and essay questions
- Cancels previous pending save

**2. Navigation Save:**
- Immediate save when clicking Previous/Next
- Immediate save when clicking palette number
- Cancels pending debounced save

**3. Flag Toggle:**
- Immediate save when checking/unchecking flag

### Implementation

**Client-Side (React):**
```typescript
const [answer, setAnswer] = useState(initialAnswer);
const debouncedSave = useDebouncedCallback(
  () => saveAnswer(sessionId, questionId, answer),
  2000
);

// On input change
const handleChange = (value) => {
  setAnswer(value);
  debouncedSave();
};

// On navigation
const handleNext = async () => {
  debouncedSave.cancel();
  await saveAnswer(sessionId, questionId, answer);
  setCurrentQuestionIndex(i + 1);
};
```

**Server Action:**
```typescript
async function saveAnswer(
  sessionId: string,
  questionId: string,
  answerData: {
    selectedOption?: string;
    textResponse?: string;
    isFlagged: boolean;
    questionIndex: number;
  }
) {
  // Validate session ownership
  // Upsert Answer record
  // Update session.lastViewedQuestionIndex
  // Return success status
}
```

**Optimistic Updates:**
- Update palette status immediately
- Don't wait for server response
- If save fails: revert UI, show error toast

**Retry Logic:**
- 3 retry attempts with exponential backoff
- Queue failed saves if network down
- Flush queue on reconnection

**User Feedback:**
- Success: Green toast "Answer saved ✓" (3s)
- Saving: Small spinner near answer input
- Error: Red toast "Failed to save. Retrying..."

## Review Screen

### Purpose
Give candidates confidence before final submission by showing all their answers.

### Display

**Header:**
- Exam title
- Timer (still running): "Time remaining: 15:32"
- Warning if < 5 min: "⚠️ Less than 5 minutes remaining!"

**Summary Stats:**
```
┌─────────────────────────────────────────┐
│  Exam Summary                           │
│                                         │
│  ✓ 18 of 20 questions answered         │
│  ⚠ 2 questions unanswered               │
│  ⚑ 1 question flagged for review        │
└─────────────────────────────────────────┘
```

**Question List:**
- All questions displayed in order (scrollable)
- Each entry shows:
  - Question number and points: "Question 5 • 5 pts"
  - Question text (truncated if long, click to expand)
  - Their answer (formatted by type)
  - Status badge: "Answered" (green) or "Unanswered" (red)
  - Flag icon if flagged

**Visual Highlighting:**
- **Unanswered:** Red background, "⚠ Not answered" badge
- **Flagged:** Orange left border, flag icon
- **Answered:** Normal, green checkmark

**Example Entry:**
```
┌─────────────────────────────────────────┐
│ Question 5 • 5 pts                  ✓   │
│ What is the capital of France?          │
│ Your answer: Paris                      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Question 7 • 10 pts              ⚠ ⚑    │
│ Explain the theory of relativity...     │
│ ⚠ Not answered                          │
└─────────────────────────────────────────┘
```

### Actions

**"Go Back to Exam" Button (secondary):**
- Returns to ExamInterface at current question
- No changes made
- Review is read-only

**"Submit Exam" Button (primary, prominent):**
- Opens confirmation modal
- Modal content:
  - "Are you sure you want to submit?"
  - If unanswered: "2 questions will be submitted blank"
  - "You cannot change answers after submitting"
- Buttons: "Cancel" | "Yes, Submit Exam"

**On Confirmation:**
1. Call `submitExam(sessionId)`
2. Server: `status = COMPLETED`, `completedAt = now()`
3. Show success: "Exam submitted successfully!"
4. Stop timer, disable all interactions
5. Auto-redirect to dashboard after 3 seconds

## Session Resumption

### Scenario
Candidate closes browser/tab during exam, then clicks "Resume Exam" from dashboard.

### Flow

**1. Entry Point:**
- Click "Resume Exam" → navigate to `/dashboard/exams/[id]/take?session=[sessionId]`

**2. Server-Side Loading:**
- Fetch session (status must be IN_PROGRESS)
- Check expiration:
  ```typescript
  const expiresAt = Math.min(
    scheduledEnd,
    startedAt + (duration * 60 * 1000)
  );
  if (now >= expiresAt) {
    // Auto-complete and redirect
  }
  ```
- Load all question assignments and saved answers
- Get `lastViewedQuestionIndex`

**3. State Restoration:**
- **Skip pre-exam checks** - already completed
- **Load directly into ExamInterface**
- **Start at last viewed question** - `lastViewedQuestionIndex`
- **Pre-fill all answers:**
  - MC/TF: Pre-select saved option
  - Short answer: Pre-fill text input
  - Essay: Pre-fill textarea
- **Restore flags** - show flagged questions in palette
- **Calculate remaining time** - resume countdown

**4. Timer Calculation:**
```typescript
const elapsed = now - startedAt;
const remaining = Math.max(0, (duration * 60 * 1000) - elapsed);
// Or: remaining until scheduledEnd, whichever is earlier
```

**5. Palette Status:**
- Mark answered questions with ✓
- Show flagged questions with ⚑
- Highlight current question

**User Experience:**
- Seamless - looks like they never left
- All progress preserved
- Timer continues from where it stopped
- Optional toast: "Welcome back! Your progress has been saved."

## Data Model

### Database Changes

**Add to ExamSession model:**
```prisma
model ExamSession {
  // ... existing fields ...
  lastViewedQuestionIndex Int @default(0)  // NEW: Track position for resume
}
```

**Add to Exam model (if not exists):**
```prisma
model Exam {
  // ... existing fields ...
  instructions String? @db.Text  // NEW: Pre-exam instructions
}
```

**Answer model (already exists, no changes):**
```prisma
model Answer {
  id              String
  sessionId       String
  questionId      String
  selectedOption  String?   // For MC/TF
  textResponse    String?   // For short answer/essay
  isFlagged       Boolean   @default(false)
  createdAt       DateTime
  updatedAt       DateTime
}
```

### Server Actions

**1. startExamSession(sessionId: string)**
- **Input:** sessionId from URL
- **Validation:**
  - Session exists and belongs to user
  - Status is NOT_STARTED
  - Session not expired
- **Updates:**
  - `status = IN_PROGRESS`
  - `startedAt = now()`
- **Returns:** `{ success: boolean }`

**2. saveAnswer(sessionId, questionId, answerData)**
- **Input:**
  ```typescript
  {
    sessionId: string;
    questionId: string;
    answerData: {
      selectedOption?: string;
      textResponse?: string;
      isFlagged: boolean;
      questionIndex: number;
    };
  }
  ```
- **Validation:**
  - Session is IN_PROGRESS
  - User owns session
  - Question belongs to exam
- **Operations:**
  - Upsert Answer (update if exists, create if not)
  - Update `session.lastViewedQuestionIndex = questionIndex`
- **Returns:** `{ success: boolean; error?: string }`

**3. submitExam(sessionId: string)**
- **Input:** sessionId
- **Validation:**
  - Session is IN_PROGRESS
  - User owns session
- **Updates:**
  - `status = COMPLETED`
  - `completedAt = now()`
- **Returns:** `{ success: boolean }`

## Error Handling

### Network Failures

**During Auto-Save:**
- Queue failed saves in client state
- Retry with exponential backoff (3 attempts)
- Show banner: "Connection lost. Answers will save when reconnected."
- On reconnect: Flush queue, show "Connection restored ✓"

**Queue Overflow:**
- If 10+ failed saves queued, show warning
- Suggest refreshing page to sync

### Session Expiration

**Timer Reaches 0:00:**
- Auto-submit immediately
- Show modal: "Time's up! Your exam has been submitted."
- Redirect to dashboard

**During Active Exam:**
- Check expiration on each save
- If expired: Force submit with modal

**On Resume Attempt:**
- Server detects expiration
- Redirect to dashboard with toast: "Session expired. Your answers have been submitted."

### Browser/Tab Close

**beforeunload Warning:**
- Show browser prompt: "Exam in progress. Are you sure you want to leave?"
- Not blocking - user can still close
- Warns about potential unsaved work

**Data Protection:**
- Auto-save runs before close (if time allows)
- On return: Session resumption restores all saved answers

### Invalid Data

**Missing Questions:**
- Show error: "Failed to load questions. Please contact support."
- Provide support contact info

**Invalid Answer Format:**
- Validate on save
- Show specific error: "Answer exceeds character limit"

**Session Not Found:**
- Redirect to dashboard with error: "Session not found"

### Concurrent Access

**Multiple Tabs Detected:**
- Use localStorage or BroadcastChannel
- Show warning: "This exam is open in another tab. Please close other tabs."
- Not blocking, but warn about save conflicts

### Rate Limiting

**Save Throttling:**
- Maximum 1 save per second per session
- Prevent rapid-fire saves

**Submit Protection:**
- Disable "Submit" button after click
- Prevent double-submit

### Accessibility

**Screen Readers:**
- All status updates announced
- Timer warnings announced
- Question navigation announced

**Keyboard Navigation:**
- Full navigation without mouse
- Tab through all interactive elements
- Shortcuts: Left/Right arrows for Previous/Next

**Visual Accessibility:**
- High contrast mode support
- Timer warnings visible in high contrast
- Focus indicators on all interactive elements

**Focus Management:**
- Modal dialogs trap focus
- Returning from review returns focus to review button

## Out of Scope (Future Phases)

**Phase 5 - Webcam Recording:**
- Actual video/audio recording (MediaRecorder API)
- Upload to Vercel Blob storage
- Chunked recording for reliability
- Playback interface for reviewers

**Phase 5 - Auto-Scoring:**
- Immediate scoring for objective questions
- Pass/fail calculation
- Score display in dashboard
- Detailed results page

**Phase 6 - AI Monitoring:**
- Real-time proctoring alerts
- Flag generation during exam
- Facial recognition and pose estimation
- Browser focus monitoring

**Future Enhancements:**
- Identity verification (photo capture + comparison)
- Lockdown browser detection
- Full-screen enforcement
- Question randomization
- Time extensions/accommodations
- Offline exam support
- Practice exams

## Success Criteria

✅ **Functional Requirements:**
- Pre-exam checks verify browser, show instructions, request camera access
- Candidates can answer questions of all types (MC, TF, short answer, essay)
- Continuous auto-save prevents data loss
- Timer counts down with warnings at 10min, 5min, 1min
- Question palette shows status and allows navigation
- Flag questions for review
- Review screen shows all questions/answers before submit
- Submit updates session to COMPLETED
- Resume works seamlessly with all state restored

✅ **Technical Requirements:**
- Minimal database changes (lastViewedQuestionIndex, instructions fields)
- Server-side validation for all actions
- Optimistic updates for smooth UX
- Error handling with retry logic
- Accessibility compliant (keyboard nav, screen readers)

✅ **UX Requirements:**
- Clear, focused interface (one question at a time)
- Never lose candidate work (auto-save + retry)
- Confidence-building review screen
- Helpful warnings before time expires
- Seamless resumption if interrupted

## Next Steps

1. **Implementation Plan:** Create detailed step-by-step implementation plan
2. **Set Up Worktree:** Isolated workspace for Phase 4 development
3. **Build & Test:** Implement components and server actions
4. **Manual Testing:** Verify all flows (start, answer, save, resume, submit)
5. **Prepare for Phase 5:** Recording and scoring features

---

**Design Complete:** 2026-02-09
**Ready for Implementation:** Yes
