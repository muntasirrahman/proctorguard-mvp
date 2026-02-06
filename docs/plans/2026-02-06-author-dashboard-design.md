# Author Dashboard Design

**Date**: 2026-02-06
**Status**: Approved
**Issue**: proctor-exam-mvp-7yw

## Overview

Build the author dashboard (port 3003) for question bank and question management. Authors create and manage their own content.

## Route Structure

```
/dashboard                           → Question bank list
/dashboard/banks/[id]                → Question list for bank
/dashboard/banks/[id]/questions/new  → Create question
/dashboard/banks/[id]/questions/[qid]→ Edit question
```

Sidebar navigation with active state highlighting. Uses existing DashboardShell component.

## Pages

### Question Bank List (`/dashboard`)

**Header**: "Question Banks" title + "Create Question Bank" button

**Search/Filter**: Filter by status (All, DRAFT, IN_REVIEW, APPROVED, ARCHIVED)

**Table Columns**:
| Name | Status | Questions | Created | Actions |
|------|--------|-----------|---------|---------|
| General Knowledge | Approved | 25 | Jan 15 | Edit, Delete |

- Status shown as badge (DRAFT: gray, IN_REVIEW: yellow, APPROVED: green, ARCHIVED: muted)
- Questions = count of questions in bank
- Edit → opens modal
- Delete → confirmation, only if bank has 0 questions
- Click row → navigate to question list

**Create/Edit Question Bank Modal**:
- Title (required)
- Description (optional, textarea)
- Tags (optional, comma-separated input)
- Status (dropdown: DRAFT, IN_REVIEW, APPROVED, ARCHIVED)

### Question List (`/dashboard/banks/[id]`)

**Header**:
- Bank name, description, status badge
- "Create Question" button (top right)

**Table**:
| Type | Question | Difficulty | Points | Status | Actions |
|------|----------|------------|--------|--------|---------|
| MCQ | What is the capital... | Medium | 10 | Draft | Edit, Delete |

- Type: Badge ("Multiple Choice", "True/False", "Essay")
- Question: Truncated text (~60 chars)
- Difficulty: EASY, MEDIUM, HARD
- Points: Numeric value
- Status: Badge (same colors as bank status)
- Edit → navigate to edit page
- Delete → confirmation

**Empty State**: "No questions yet. Create your first question to get started."

### Question Editor (`/dashboard/banks/[id]/questions/[new|qid]`)

**Header**: Back button + "Create Question" or "Edit Question" title

**Common Fields** (all types):
- Question Text (textarea, required)
- Difficulty (dropdown: EASY, MEDIUM, HARD, default: MEDIUM)
- Points (number, default: 1, min: 1)
- Time Limit (number in seconds, optional)
- Explanation (textarea, optional - shown after answer)
- Status (dropdown: DRAFT, IN_REVIEW, APPROVED, REJECTED, ARCHIVED)
- Tags (optional, comma-separated)

**Type Selector**: Radio buttons at top (Multiple Choice, True/False, Essay)

**Type-Specific Fields**:

**Multiple Choice** (single-answer):
- Option A (text input, required)
- Option B (text input, required)
- Option C (text input, required)
- Option D (text input, required)
- Option E (text input, required)
- Correct Answer (radio: A, B, C, D, E)

**True/False**:
- Correct Answer (radio: True, False)

**Essay**:
- No additional fields (manual grading)

**Action Buttons**:
- Cancel (back to question list)
- Save (updates question, stays on page)
- Save & Close (updates, returns to list)

## Server Actions

### `apps/author/app/actions/question-banks.ts`

```typescript
getQuestionBanks(userId: string)
// Returns author's question banks with question counts

createQuestionBank(data: { title, description?, tags?, status })
// Creates bank with authorId = current user
// Requires: CREATE_QUESTION_BANK

updateQuestionBank(bankId: string, data: { title?, description?, tags?, status? })
// Updates bank, verifies authorId matches current user
// Requires: EDIT_QUESTION_BANK

deleteQuestionBank(bankId: string)
// Deletes bank only if it has 0 questions
// Requires: DELETE_QUESTION_BANK
```

### `apps/author/app/actions/questions.ts`

```typescript
getQuestions(bankId: string)
// Returns questions for bank, verifies author access

getQuestion(questionId: string)
// Returns single question for editing, verifies author access

createQuestion(bankId: string, data: QuestionData)
// Creates question in bank
// Requires: CREATE_QUESTION

updateQuestion(questionId: string, data: QuestionData)
// Updates question, verifies author access
// Requires: EDIT_QUESTION

deleteQuestion(questionId: string)
// Deletes question, verifies author access
// Requires: DELETE_QUESTION
```

**QuestionData type**:
```typescript
{
  type: 'multiple_choice' | 'true_false' | 'essay'
  text: string
  difficulty: Difficulty
  points: number
  timeLimit?: number
  explanation?: string
  status: QuestionStatus
  tags?: string[]

  // Type-specific
  options?: Json  // For MCQ: { A: string, B: string, C: string, D: string, E: string }
  correctAnswer?: Json  // For MCQ: 'A'|'B'|'C'|'D'|'E', for T/F: true|false
}
```

## Permission Matrix

| Action | Required Permission |
|--------|-------------------|
| View own banks | CREATE_QUESTION_BANK |
| Create bank | CREATE_QUESTION_BANK |
| Edit own bank | EDIT_QUESTION_BANK |
| Delete own bank | DELETE_QUESTION_BANK |
| View own questions | VIEW_QUESTION |
| Create question | CREATE_QUESTION |
| Edit own question | EDIT_QUESTION |
| Delete own question | DELETE_QUESTION |

EXAM_AUTHOR role has all these permissions.

## Data Model Notes

- `QuestionBank.authorId` ensures authors only see their own banks
- `Question.options` stored as JSON: `{ "A": "text", "B": "text", ... }`
- `Question.correctAnswer` stored as JSON: `"A"` or `true`/`false`
- `Question.type` stored as string: `"multiple_choice"`, `"true_false"`, `"essay"`

## UI Components

Uses `@proctorguard/ui` (shadcn):
- Card, Table, Button, Input, Label, Textarea, Badge
- Dialog (for bank create/edit modals)
- RadioGroup (for MCQ correct answer, type selector, T/F answer)
- Select (for difficulty, status dropdowns)

## Out of Scope (Post-MVP)

- Bulk operations (delete multiple, batch status change)
- Multi-answer MCQ (checkboxes)
- Question preview
- Question duplication
- Image/media upload for questions
- Rich text editor for question text
- Question import/export
