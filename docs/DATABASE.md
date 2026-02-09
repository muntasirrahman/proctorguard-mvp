# Database Schema Reference

**Last Updated:** 2026-02-10
**ORM:** Prisma
**Database:** PostgreSQL

## Connection Information

### Local Development

```
Host: localhost
Port: 5432
Database: proctorguard_dev
User: proctorguard_user
Password: ProctorGuard2024!Secure
```

**Connection String:**
```
postgresql://proctorguard_user:ProctorGuard2024!Secure@localhost:5432/proctorguard_dev
```

### Environment Variables

```env
# Local Development
DATABASE_URL="postgresql://proctorguard_user:ProctorGuard2024!Secure@localhost:5432/proctorguard_dev?pgbouncer=true"
DIRECT_URL="postgresql://proctorguard_user:ProctorGuard2024!Secure@localhost:5432/proctorguard_dev"
```

---

## Roles (9 Total)

| Role | Code | Purpose |
|------|------|---------|
| Super Admin | `SUPER_ADMIN` | Full platform access |
| Organization Admin | `ORG_ADMIN` | Organization management |
| Exam Author | `EXAM_AUTHOR` | Content creation only |
| Exam Coordinator | `EXAM_COORDINATOR` | Exam scheduling only |
| Enrollment Manager | `ENROLLMENT_MANAGER` | Candidate invitations only |
| Proctor Reviewer | `PROCTOR_REVIEWER` | Session review only |
| Quality Assurance | `QUALITY_ASSURANCE` | Audit and approval |
| Report Viewer | `REPORT_VIEWER` | Read-only analytics |
| Candidate | `CANDIDATE` | Exam taker |

---

## Core Models

### User & Authentication

```prisma
model User {
  id             String   @id @default(cuid())
  email          String   @unique
  emailVerified  Boolean  @default(false)
  name           String?
  image          String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

model Account {
  id         String   @id @default(cuid())
  accountId  String
  providerId String
  userId     String
  password   String?
  // Managed by Better Auth
}

model Session {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  ipAddress String?
  userAgent String?
}
```

### Organization Structure

```prisma
model Organization {
  id         String   @id @default(cuid())
  name       String
  slug       String   @unique
  domain     String?
  settings   Json?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  departments Department[]
  members     OrganizationMember[]
  userRoles   UserRole[]
}

model Department {
  id             String   @id @default(cuid())
  name           String
  organizationId String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  organization Organization @relation(fields: [organizationId], references: [id])
  userRoles    UserRole[]
}

model OrganizationMember {
  userId         String
  organizationId String
  joinedAt       DateTime @default(now())

  user         User         @relation(fields: [userId], references: [id])
  organization Organization @relation(fields: [organizationId], references: [id])

  @@id([userId, organizationId])
}
```

### Roles & Permissions

```prisma
model UserRole {
  id             String   @id @default(cuid())
  userId         String
  role           Role
  organizationId String
  departmentId   String?
  assignedAt     DateTime @default(now())

  user         User         @relation(fields: [userId], references: [id])
  organization Organization @relation(fields: [organizationId], references: [id])
  department   Department?  @relation(fields: [departmentId], references: [id])

  @@unique([userId, role, organizationId])
}

enum Role {
  SUPER_ADMIN
  ORG_ADMIN
  EXAM_AUTHOR
  EXAM_COORDINATOR
  ENROLLMENT_MANAGER
  PROCTOR_REVIEWER
  QUALITY_ASSURANCE
  REPORT_VIEWER
  CANDIDATE
}
```

### Question Banks & Questions

```prisma
model QuestionBank {
  id             String             @id @default(cuid())
  title          String
  description    String?
  organizationId String
  authorId       String
  status         QuestionBankStatus @default(DRAFT)
  tags           String[]
  createdAt      DateTime           @default(now())
  updatedAt      DateTime           @updatedAt

  questions Question[]
}

model Question {
  id             String         @id @default(cuid())
  questionBankId String
  type           String         // 'multiple_choice', 'true_false', 'short_answer', 'essay'
  text           String
  options        Json?          // For multiple choice questions
  correctAnswer  Json
  explanation    String?
  difficulty     Difficulty
  points         Int
  status         QuestionStatus @default(DRAFT)
  tags           String[]
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  questionBank QuestionBank @relation(fields: [questionBankId], references: [id], onDelete: Cascade)
}

enum QuestionBankStatus {
  DRAFT
  IN_REVIEW
  APPROVED
  REJECTED
  ARCHIVED
}

enum QuestionStatus {
  DRAFT
  IN_REVIEW
  APPROVED
  REJECTED
  ARCHIVED
}

enum Difficulty {
  EASY
  MEDIUM
  HARD
}
```

### Exams & Enrollments

```prisma
model Exam {
  id                    String      @id @default(cuid())
  title                 String
  description           String?
  organizationId        String
  coordinatorId         String
  questionBankId        String
  status                ExamStatus  @default(DRAFT)
  scheduledStartAt      DateTime?
  scheduledEndAt        DateTime?
  duration              Int         // in minutes
  passingScore          Int
  maxAttempts           Int         @default(1)
  randomizeQuestions    Boolean     @default(false)
  randomizeOptions      Boolean     @default(false)
  enableProctoring      Boolean     @default(false)
  proctoringSensitivity String      @default("MEDIUM")
  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt

  enrollments Enrollment[]
  sessions    ExamSession[]
}

model Enrollment {
  id              String   @id @default(cuid())
  examId          String
  candidateId     String
  status          String   @default("INVITED") // INVITED, ACCEPTED, IN_PROGRESS, COMPLETED
  invitedAt       DateTime @default(now())
  startedAt       DateTime?
  completedAt     DateTime?
  score           Int?
  passed          Boolean?
  attemptsUsed    Int      @default(0)

  exam     Exam          @relation(fields: [examId], references: [id])
  sessions ExamSession[]

  @@unique([examId, candidateId])
}

enum ExamStatus {
  DRAFT
  SCHEDULED
  ACTIVE
  COMPLETED
  CANCELLED
  ARCHIVED
}
```

### Exam Sessions & Answers

```prisma
model ExamSession {
  id           String        @id @default(cuid())
  enrollmentId String
  examId       String
  candidateId  String
  status       SessionStatus @default(NOT_STARTED)
  startedAt    DateTime?
  submittedAt  DateTime?
  score        Int?
  passed       Boolean?
  flagged      Boolean       @default(false)
  reviewedBy   String?
  reviewedAt   DateTime?
  reviewNotes  String?
  recordingUrl String?

  enrollment Enrollment @relation(fields: [enrollmentId], references: [id])
  exam       Exam       @relation(fields: [examId], references: [id])
  answers    Answer[]
  flags      Flag[]
}

model Answer {
  id              String   @id @default(cuid())
  sessionId       String
  questionId      String
  candidateAnswer Json
  isCorrect       Boolean?
  pointsAwarded   Int?
  createdAt       DateTime @default(now())

  session ExamSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@unique([sessionId, questionId])
}

enum SessionStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
  FLAGGED
  UNDER_REVIEW
  CLEARED
  VIOLATION_CONFIRMED
}
```

### Proctoring Flags

```prisma
model Flag {
  id          String    @id @default(cuid())
  sessionId   String
  type        FlagType
  severity    String    @default("MEDIUM") // LOW, MEDIUM, HIGH
  timestamp   DateTime
  description String?
  metadata    Json?
  resolvedBy  String?
  resolvedAt  DateTime?
  resolution  String?

  session ExamSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
}

enum FlagType {
  NO_FACE_DETECTED
  MULTIPLE_FACES
  LOOKING_AWAY
  PHONE_DETECTED
  TAB_SWITCH
  COPY_PASTE
  SCREENSHOT_ATTEMPT
  SUSPICIOUS_ACTIVITY
  OTHER
}
```

### Audit Logging

```prisma
model AuditLog {
  id             String   @id @default(cuid())
  userId         String
  organizationId String?
  action         String
  resource       String
  resourceId     String?
  metadata       Json?
  ipAddress      String?
  userAgent      String?
  createdAt      DateTime @default(now())
}
```

---

## Key Relationships

```
Organization
├── Department (1:N)
├── UserRole (1:N)
└── OrganizationMember (1:N)

User
├── UserRole (1:N) - Multi-role support
└── OrganizationMember (1:N) - Multi-org support

QuestionBank
└── Question (1:N) - Cascade delete

Exam
├── Enrollment (1:N)
└── ExamSession (1:N)

Enrollment
└── ExamSession (1:N) - Multiple attempts

ExamSession
├── Answer (1:N) - Cascade delete
└── Flag (1:N) - Cascade delete
```

---

## Common Queries

### Get User's Roles in Organization

```typescript
const roles = await prisma.userRole.findMany({
  where: {
    userId: 'user-123',
    organizationId: 'org-456'
  },
  select: { role: true }
});
```

### Get Question Banks for Author

```typescript
const questionBanks = await prisma.questionBank.findMany({
  where: { authorId: session.user.id },
  include: {
    questions: {
      where: { status: QuestionStatus.APPROVED }
    }
  }
});
```

### Get Active Exams for Organization

```typescript
const exams = await prisma.exam.findMany({
  where: {
    organizationId: 'org-123',
    status: { in: [ExamStatus.SCHEDULED, ExamStatus.ACTIVE] }
  },
  include: {
    enrollments: {
      where: { status: 'INVITED' }
    }
  }
});
```

### Get Flagged Sessions for Review

```typescript
const sessions = await prisma.examSession.findMany({
  where: {
    status: SessionStatus.FLAGGED,
    reviewedBy: null
  },
  include: {
    flags: true,
    exam: true
  },
  orderBy: { startedAt: 'desc' }
});
```

---

## Schema Management

### Creating Migrations

```bash
# Edit packages/database/prisma/schema.prisma
npm run db:migrate
```

### Applying Migrations

```bash
# Development
npm run db:migrate

# Production
DATABASE_URL="<production-url>" npx prisma migrate deploy
```

### Seeding Data

```bash
npm run db:seed
```

Creates 11 demo users:
- 7 single-role users
- 4 multi-role users

All passwords: `password123`

### Opening Prisma Studio

```bash
npm run db:studio
```

Opens GUI at http://localhost:5555

---

## Indexes & Performance

Key indexes already defined in schema:
- `User.email` - Unique index for auth
- `Session.token` - Unique index for session lookup
- `Organization.slug` - Unique index for URL routing
- `UserRole.[userId, role, organizationId]` - Unique composite for multi-role
- `Enrollment.[examId, candidateId]` - Unique composite to prevent duplicates

---

## Schema Location

**Full Schema:** `packages/database/prisma/schema.prisma`

**Migrations:** `packages/database/prisma/migrations/`

**Seed Script:** `packages/database/prisma/seed.ts`
