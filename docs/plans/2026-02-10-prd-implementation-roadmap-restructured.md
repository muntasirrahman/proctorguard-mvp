# ProctorGuard PRD Implementation Plan - Restructured Roadmap

## Executive Summary

This restructured roadmap takes a **manual-first, AI-later** approach to implementation, prioritizing core workflows with human oversight before adding expensive AI automation.

**Strategic Rationale:**
1. **Cost Efficiency:** Validate business model with manual processes before investing in AI infrastructure (~$1-2/exam ongoing costs)
2. **Quality Control:** Manual verification establishes baseline accuracy metrics before AI augmentation
3. **Risk Mitigation:** Avoid AI false positives impacting candidate experience during early adoption
4. **Faster Time-to-Market:** Core features ready in **6-8 months** vs 10-12 months with AI-first approach

---

## Phase Structure Overview

| Phase | Name | Timeline | Priority | Dependencies | Team | AI Cost |
|-------|------|----------|----------|--------------|------|---------|
| 1 | Staff Review Infrastructure | 4-6 weeks | P0 | - | Team A | $0 |
| 2 | Manual Identity Verification | 3-4 weeks | P1 | Phase 1 | Team A | $0 |
| 3 | Appeals System (Basic) | 4-5 weeks | P1 | Phase 1, 2 | Team A | $0 |
| 4 | Lockdown Browser | 12-16 weeks | P2 | Phase 1 | Team C | $0 |
| 5 | Enterprise Features & Compliance | 8-10 weeks | P2 | Phase 3 | Team A | $0 |
| 6 | Automated AI Identity Verification | 6-8 weeks | P3 | Phase 5 | Team A | $2-5/verification |
| 7 | Automated AI Monitoring | 8-10 weeks | P3 | Phase 6 | Team B | $1-2/exam |
| 8 | Explainable AI Features | 4-5 weeks | P3 | Phase 7 | Team A | $0 |

**Key Milestone:** Core platform (Phases 1-5) ready for revenue in **6-8 months** with ZERO ongoing AI costs.

---

## Phase 1: Staff Review Infrastructure & Basic Monitoring

**Epic:** `proctor-exam-mvp-6xf`
**Timeline:** 4-6 weeks
**Priority:** CRITICAL (P0)
**Status:** 15 tasks created and ready

**Unchanged from original plan.** Foundation for all proctoring features.

### Key Deliverables
1. Session Review Dashboard (`/apps/staff/app/dashboard/sessions/`)
2. Video Playback System (HTML5 player with flag timeline)
3. Flag Management UI (`/apps/staff/app/dashboard/sessions/flagged/`)
4. Review Workflow (PENDING → IN_REVIEW → CLEARED/VIOLATION)

### Database Changes
```prisma
model ExamSession {
  reviewAssignedTo   String?
  reviewAssignedAt   DateTime?
  reviewStartedAt    DateTime?
  reviewDecision     ReviewDecision?
  reviewRationale    String?          @db.Text
  notifyCandidateAt  DateTime?
  assignedReviewer   User?            @relation("AssignedReviews", fields: [reviewAssignedTo], references: [id])
}

model Flag {
  videoTimestamp     Int?
  screenshotUrl      String?
  aiConfidence       Float?            // For future AI flags
  reviewerNotes      String?           @db.Text
}
```

### Success Metrics
- Reviewers can view and resolve flags within 5 minutes of exam completion
- Video playback loads in <3 seconds

---

## Phase 2: Manual Identity Verification (Post-Exam)

**Epic:** `proctor-exam-mvp-5vh`
**Timeline:** 3-4 weeks (simplified from 6-8 weeks)
**Priority:** HIGH (P1)
**Cost:** $0 recurring (no third-party AI services)

**What Changed:** Removed all automated AI verification (liveness detection, face matching, OCR). Focus on capture + manual staff review.

### Pre-Exam Workflow (Candidate)
1. **Test Taker Photo Capture** - Live selfie using webcam, simple quality checks (blur detection, brightness)
2. **Identity Document Capture** - Upload or capture ID document photo (passport, driver's license, national ID)
3. **Submission Confirmation** - Preview captured images, confirm accuracy before submitting, create `IdentityVerification` record with status `PENDING`

### Post-Exam Workflow (Staff)
4. **Manual Verification Queue** (`/apps/staff/app/dashboard/verifications/`)
   - After exam completion, verification moves to review queue
   - PROCTOR_REVIEWER or ORG_ADMIN reviews:
     - Side-by-side comparison: test taker photo vs ID photo
     - Verify name matches enrollment
     - Check ID document validity (not expired, looks authentic)
   - Decision: APPROVE or REJECT with reason
   - Rejection triggers notification to candidate + exam result invalidation

### Key Features
1. Pre-exam photo capture interface (candidate portal)
2. Post-exam verification queue (staff portal)
3. Side-by-side image comparison UI
4. Approval/rejection workflow with notes

### Database Changes
```prisma
model IdentityVerification {
  id                    String               @id @default(cuid())
  candidateId           String
  organizationId        String
  examSessionId         String?              // Link to specific exam session

  // Document capture (PRE-EXAM)
  documentType          String?              // passport, drivers_license, national_id
  documentImageFrontUrl String?
  documentImageBackUrl  String?
  testTakerPhotoUrl     String               // Live selfie
  capturedAt            DateTime             @default(now())

  // Manual verification (POST-EXAM)
  status                VerificationStatus   @default(PENDING)
  verifiedAt            DateTime?
  verifiedBy            String?              // Staff user ID
  verifiedByUser        User?                @relation(fields: [verifiedBy], references: [id])
  approved              Boolean?
  rejectionReason       String?              @db.Text
  reviewerNotes         String?              @db.Text

  @@index([candidateId])
  @@index([examSessionId])
  @@index([status])
  @@index([verifiedBy])
}

enum VerificationStatus {
  PENDING           // Waiting for exam completion
  IN_REVIEW         // Staff reviewing post-exam
  APPROVED
  REJECTED
  EXPIRED           // Not reviewed within SLA
}
```

### Critical Files
- `packages/database/prisma/schema.prisma` - Add simplified IdentityVerification model
- `apps/candidate/app/dashboard/exams/[id]/verify/page.tsx` - Photo capture flow (new)
- `apps/staff/app/dashboard/verifications/page.tsx` - Manual review queue (new)
- `apps/staff/app/dashboard/verifications/[id]/page.tsx` - Verification detail view (new)

### Success Metrics
- 100% of exam sessions have identity verification records
- Average verification time <3 minutes per review
- <2% rejection rate (indicates quality capture flow)
- 95% verified within 24 hours of exam completion

### Risks & Mitigation
- **Risk:** Manual review bottleneck at scale → **Mitigation:** Hire verification staff as volume grows, SLA monitoring
- **Risk:** Inconsistent verification decisions → **Mitigation:** Reviewer training, decision guidelines, audit sampling
- **Risk:** Verification bypass attempts → **Mitigation:** Block exam start if no verification record, server-side validation

---

## Phase 3: Appeals System (Basic)

**Epic:** `proctor-exam-mvp-ao6`
**Timeline:** 4-5 weeks (simplified from 6-8 weeks)
**Priority:** HIGH (P1)
**Dependencies:** Phase 1, Phase 2

**What Changed:** Removed AI explainability features (natural language explanations, confidence scores). Focus on basic appeals workflow for manual review decisions.

### Key Features

#### 1. Appeal Submission (`/apps/candidate/app/dashboard/results/[sessionId]/appeal/`)
- Candidate can appeal:
  - Identity verification rejection
  - Exam session integrity violation decision
  - Specific flags
- Text explanation field (50-500 characters)
- Optional evidence upload (PDF, images up to 5MB)
- One appeal per session

#### 2. Appeal Review Queue (`/apps/staff/app/dashboard/appeals/`)
- Three-level escalation:
  - Level 1: Initial reviewer (48-hour SLA)
  - Level 2: Senior reviewer (72-hour SLA)
  - Level 3: QA team (1-week SLA)
- View original session details, flags, verification data
- Decision: OVERTURN, UPHOLD, PARTIAL_OVERTURN
- Decision rationale required

#### 3. Appeal Communication
- Email notifications (submitted, under review, decision)
- In-app status tracking
- Simple messaging (no threaded conversations for MVP)

#### 4. Evidence Access for Candidates
- View own session recording (watermarked, no download)
- View flags with timestamps
- View identity verification images

### Database Changes
```prisma
model Appeal {
  id                   String              @id @default(cuid())
  sessionId            String
  candidateId          String
  appealType           AppealType          // IDENTITY_VERIFICATION, SESSION_INTEGRITY, SPECIFIC_FLAGS
  flagIds              String[]            // Specific flags being appealed
  appealText           String              @db.Text
  evidenceUrls         String[]

  status               AppealStatus        @default(PENDING)
  level                Int                 @default(1)
  assignedTo           String?
  decision             AppealDecision?     // OVERTURN, UPHOLD, PARTIAL_OVERTURN
  decisionRationale    String?             @db.Text
  decidedBy            String?
  decidedAt            DateTime?

  slaDueAt             DateTime
  slaBreached          Boolean             @default(false)

  createdAt            DateTime            @default(now())
  updatedAt            DateTime            @updatedAt

  session              ExamSession         @relation(fields: [sessionId], references: [id])
  candidate            User                @relation("CandidateAppeals", fields: [candidateId], references: [id])
  assignedReviewer     User?               @relation("AssignedAppeals", fields: [assignedTo], references: [id])
  decider              User?               @relation("AppealDecisions", fields: [decidedBy], references: [id])

  @@index([sessionId])
  @@index([candidateId])
  @@index([status])
  @@index([level])
  @@index([slaDueAt])
}

enum AppealType {
  IDENTITY_VERIFICATION
  SESSION_INTEGRITY
  SPECIFIC_FLAGS
}

enum AppealStatus {
  PENDING
  IN_REVIEW
  ESCALATED
  RESOLVED
  EXPIRED
}

enum AppealDecision {
  OVERTURN
  UPHOLD
  PARTIAL_OVERTURN
}
```

### Critical Files
- `packages/database/prisma/schema.prisma` - Add Appeal model
- `apps/candidate/app/dashboard/results/[sessionId]/page.tsx` - Results view with appeal button (new)
- `apps/candidate/app/dashboard/results/[sessionId]/appeal/page.tsx` - Appeal submission (new)
- `apps/staff/app/dashboard/appeals/page.tsx` - Appeal queue (new)
- `apps/staff/app/dashboard/appeals/[id]/page.tsx` - Appeal detail and decision (new)

### Success Metrics
- Appeal submission rate <10% of completed exams
- 95% of appeals resolved within SLA
- Appeal overturn rate <20% (higher indicates verification/review quality issues)

---

## Phase 4: Lockdown Browser (Windows/macOS)

**Epic:** `proctor-exam-mvp-8kd`
**Timeline:** 12-16 weeks
**Priority:** MEDIUM (P2)
**Team:** Team C (Electron consultant, can run in parallel)

**Moved up from Phase 5. No changes to implementation. CAN RUN IN PARALLEL with Phases 2-3.**

### Key Deliverables
1. Native Application (Electron, Windows x64, macOS x64/ARM64)
2. Browser Restrictions (kiosk mode, blocked navigation, disabled dev tools)
3. System Restrictions (blocked app switching, task manager, screen capture, clipboard isolation)
4. Process Monitoring (scan every 5s, blocklist: Slack, Discord, Zoom, ChatGPT, etc.)
5. Network Controls (DNS filtering, domain allowlist, VPN/proxy detection)
6. VM & Remote Desktop Detection (hypervisor signatures, RDP detection)

### Database Changes
```prisma
model ExamSession {
  lockdownBrowserUsed    Boolean             @default(false)
  lockdownBrowserVersion String?
  systemInfo             Json?               // OS, CPU, RAM, screen resolution
  lockdownViolations     Json?               // Detected violations
  vmDetected             Boolean             @default(false)
}

model LockdownBrowserRelease {
  id                     String              @id @default(cuid())
  version                String              @unique
  platform               String              // windows-x64, macos-x64, macos-arm64
  downloadUrl            String
  checksum               String              // SHA256
  releaseNotes           String?             @db.Text
  releasedAt             DateTime            @default(now())
}
```

### Success Metrics
- >95% installation success
- <1% crashes
- VM detection accuracy >98%

---

## Phase 5: Enterprise Features & Compliance

**Epic:** `proctor-exam-mvp-edr`
**Timeline:** 8-10 weeks
**Priority:** MEDIUM (P2)
**Dependencies:** Phase 3 (Appeals)

**Moved up from Phase 6. Updated dependencies.**

### Key Deliverables

#### 5.1 HRIS Integration
- Native connectors: Workday, SAP, BambooHR
- Bi-directional sync (import employees, export results)
- Configuration UI for API credentials

#### 5.2 Metrics & Analytics
- Executive Dashboard (completion/success rates, appeal metrics)
- Operations Dashboard (active sessions, review queue)
- Integrity Dashboard (flag analytics, bias monitoring)
- Automated Alerting (Email/Slack thresholds)

#### 5.3 Accessibility (WCAG 2.1 AA)
- Complete keyboard navigation
- Screen reader optimization
- High contrast mode, font scaling to 200%
- Accommodation management (extended time, breaks)

#### 5.4 Compliance & Privacy
- GDPR/CCPA Consent Management
- Data Subject Rights Portal (view, download, delete)
- Data Retention Policies (automated deletion)
- Biometric Data Policies (BIPA compliance)

### Success Metrics
- HRIS sync success >99%
- WCAG 2.1 AA audit pass 100%

---

## Phase 6: Automated AI Identity Verification

**Epic:** `proctor-exam-mvp-995` (NEW)
**Timeline:** 6-8 weeks
**Priority:** LOW (P3)
**Dependencies:** Phase 5
**Cost:** ~$2-5 per verification (Onfido/Jumio)

**NEW EPIC - OPTIONAL ADD-ON.** Automate identity verification using third-party AI services. Replace manual staff review with automated checks.

### Strategic Context
This is an OPTIONAL enhancement to Phase 2. The core platform can generate revenue with manual verification. Add AI automation only if:
1. Manual review becomes a bottleneck (>500 verifications/day)
2. Customers request faster verification (<5 minutes)
3. Cost analysis shows ROI (staff time vs AI costs)

### Key Features
1. **Automated Document Verification** - OCR extraction, authenticity checks, cross-reference with enrollment
2. **Liveness Detection** - Active challenges, presentation attack detection
3. **Automated Face Matching** - Auto-approve >85%, auto-reject <75%, manual review 75-84%
4. **Update Verification Queue** - Staff only review borderline cases and random sampling (5%)

### Database Changes
```prisma
model IdentityVerification {
  // Add AI fields to existing model from Phase 2
  ocrExtractedName     String?
  ocrExtractedDOB      DateTime?
  ocrConfidence        Float?               // 0-100

  livenessScore        Float?               // 0-100
  livenessProvider     String?              // onfido, jumio, persona

  faceMatchScore       Float?               // 0-100
  faceMatchThreshold   Float                @default(85.0)
  faceMatchPassed      Boolean              @default(false)

  automatedDecision    Boolean              @default(false)
  automatedAt          DateTime?
}
```

### Success Metrics
- 80%+ verifications auto-approved (no manual review needed)
- False rejection rate <5%
- Average verification time <60 seconds
- Cost per verification <$3

---

## Phase 7: Automated AI Monitoring & Flagging

**Epic:** `proctor-exam-mvp-bqn` (MOVED FROM PHASE 3)
**Timeline:** 8-10 weeks
**Priority:** LOW (P3)
**Dependencies:** Phase 6
**Cost:** ~$1-2 per exam hour

**What:** Automate flag generation using real-time AI analysis of video/audio/behavior. Replace manual flag creation with automated detection.

### Strategic Context
This is an OPTIONAL enhancement after AI identity verification (Phase 6) is complete. Manual flagging from Phase 1 is sufficient for MVP. Add AI monitoring only if:
1. Manual flagging becomes inefficient (>100 concurrent exams)
2. Customers request real-time detection
3. Phase 6 demonstrates acceptable AI accuracy/cost

### Key Features
1. Real-Time Video Streaming (WebRTC, 1-2 FPS)
2. AI Behavior Analysis (face detection, gaze tracking, object detection, audio monitoring)
3. Browser Behavior Monitoring (focus loss, copy/paste)
4. Automated Flag Generation with confidence scores

### Database Changes
```prisma
model Flag {
  aiConfidence         Float?
  aiModel              String?
  detectionMethod      String?
  frameNumber          Int?
  audioClipUrl         String?
  rawMetadata          Json?
  autoResolved         Boolean             @default(false)
}

model ExamSession {
  streamSessionId      String?
  streamStartedAt      DateTime?
  framesProcessed      Int                 @default(0)
  flagsGenerated       Int                 @default(0)
  aiSummary            Json?
  riskScore            Int?
}

model FrameAnalysis {
  id                   String              @id @default(cuid())
  sessionId            String
  frameNumber          Int
  timecodeMs           Int
  faceDetected         Boolean
  faceCount            Int
  gazeDirection        String?
  objectsDetected      String[]
  audioActivity        Boolean
  analysisData         Json?
}
```

### Success Metrics
- False positive rate <15%
- AI cost per exam <$2
- 95% uptime for streaming infrastructure

---

## Phase 8: Explainable AI Features

**Epic:** `proctor-exam-mvp-c9e` (NEW)
**Timeline:** 4-5 weeks
**Priority:** LOW (P3)
**Dependencies:** Phase 7

**NEW EPIC - OPTIONAL ENHANCEMENT.** Add natural language explanations and confidence visualizations to AI-generated flags and identity verification decisions.

### Strategic Context
This enhances Phase 6 and Phase 7 with human-understandable explanations. Only implement if:
1. Customers request transparency for AI decisions
2. Appeal rate for AI flags is high (>15%)
3. Regulatory requirements demand explainability (EU AI Act)

### Key Features
1. **Natural Language Explanations for Flags** - Template-based generation with evidence linking
2. **Confidence Visualization** - Show AI confidence scores in staff UI
3. **Evidence Clips for AI Flags** - Generate 10-second video clips around each AI flag
4. **Enhanced Candidate Evidence Viewer** - Show AI explanations to candidates when appealing

### Database Changes
```prisma
model Flag {
  explanation          String?             @db.Text    // Natural language explanation
  evidenceClipUrl      String?             // 10-second clip around flag
  appealed             Boolean             @default(false)
}

model IdentityVerification {
  aiExplanation        String?             @db.Text    // Why auto-approved/rejected
}
```

### Success Metrics
- 100% of AI-generated flags have explanations
- Candidate satisfaction with transparency >4.0/5.0
- Appeal rate for AI flags <15%

---

## Execution Timeline

**Manual-First Approach (6-8 months to core features):**

```
Months 1-2:  Phase 1 (Staff Review Infrastructure)
             Phase 4 (Lockdown Browser - START in parallel)

Months 2-3:  Phase 2 (Manual Identity Verification)
             Phase 4 (Lockdown Browser - CONTINUE)

Months 3-4:  Phase 3 (Appeals System)
             Phase 4 (Lockdown Browser - CONTINUE)

Months 4-6:  Phase 4 (Lockdown Browser - COMPLETE)
             Phase 5 (Enterprise Features)

Months 6-8:  Phase 5 (Enterprise Features - COMPLETE)

--- CORE PLATFORM READY FOR REVENUE (Month 6-8) ---

Months 7-9:  Phase 6 (AI Identity Verification) - Optional add-on
Months 9-11: Phase 7 (AI Monitoring) - Optional add-on
Months 11-12: Phase 8 (Explainable AI) - Optional enhancement
```

**Key Milestone:** Core platform (manual workflows + lockdown browser + compliance) ready in **6-8 months** vs 8-10 months with AI-first approach.

---

## Cost Estimates

### Months 1-6 (Core Platform)
- **$0 recurring AI costs**
- Development only: ~$300K-400K (4 developers × 6 months)
- One-time: Code signing ($400/year), accessibility audit ($10K), legal review ($10K)
- **Total for core platform:** ~$320K-420K

### Months 7-12 (AI Add-Ons, Optional)
- Identity verification: ~$2-5 per verification
- AI monitoring: ~$1-2 per exam hour
- Development: ~$150K-200K (2 developers × 6 months)
- **Total for AI features:** ~$150K-200K + ongoing per-exam costs

**Strategic Advantage:** Can launch revenue-generating platform in 6 months with zero ongoing AI costs, then add AI features as premium tier.

---

## Team Structure

**Team A (Core MVP team - 2-3 developers):**
- Months 1-2: Phase 1
- Months 2-3: Phase 2
- Months 3-4: Phase 3
- Months 4-6: Phase 5
- Months 7-9: Phase 6 (if approved)
- Months 11-12: Phase 8 (if approved)

**Team B (AI/ML specialist - 1-2 developers):**
- Months 9-11: Phase 7 (only if AI features approved)

**Team C (Electron consultant - 1 developer):**
- Months 1-6: Phase 4 (lockdown browser in parallel)

---

## Beads Epic IDs

| Phase | Epic ID | Title |
|-------|---------|-------|
| 1 | proctor-exam-mvp-6xf | Staff Review Infrastructure & Basic Monitoring |
| 2 | proctor-exam-mvp-5vh | Manual Identity Verification (Post-Exam) |
| 3 | proctor-exam-mvp-ao6 | Appeals System (Basic) |
| 4 | proctor-exam-mvp-8kd | Lockdown Browser (Windows/macOS) |
| 5 | proctor-exam-mvp-edr | Enterprise Features & Compliance |
| 6 | proctor-exam-mvp-995 | Automated AI Identity Verification |
| 7 | proctor-exam-mvp-bqn | Automated AI Monitoring & Flagging |
| 8 | proctor-exam-mvp-c9e | Explainable AI Features |

---

## Verification Approach

**After Phase 2 (Manual Identity Verification):**
1. Database migration: `npm run db:migrate`
2. Create test exam session
3. Complete identity verification flow as candidate (capture photos)
4. Complete exam
5. Verify identity verification moves to staff queue (status: IN_REVIEW)
6. As PROCTOR_REVIEWER, review and approve/reject
7. Verify candidate sees verification status in results

**After Phase 3 (Appeals System):**
1. Create exam session with flags or rejected identity verification
2. As candidate, submit appeal
3. Verify appeal appears in staff queue
4. As reviewer, make decision
5. Verify candidate receives notification and sees decision

---

## Next Steps After Plan Approval

1. **Update Beads structure:** ✅ DONE
   - Modified Phase 2, 3, 4, 5 epic descriptions
   - Created new Phase 6, 7, 8 epics
   - Updated all dependencies

2. **Break down Phase 2 tasks:**
   - Photo capture UI (candidate)
   - Verification queue UI (staff)
   - Manual review workflow
   - Database migration

3. **Break down Phase 3 tasks:**
   - Appeal submission UI
   - Appeal queue UI
   - Evidence viewer for candidates
   - Appeal escalation workflow

4. **Update project documentation:**
   - This file created: `docs/plans/2026-02-10-prd-implementation-roadmap-restructured.md`
   - Add decision record for manual-first approach

---

## Decision Record: Manual-First Approach

**Date:** 2026-02-10
**Context:** Original PRD implementation plan assumed AI-first approach for identity verification and monitoring.
**Decision:** Restructure roadmap to prioritize manual workflows before AI automation.

**Rationale:**
1. **Faster time-to-market:** Core platform ready 2-4 months earlier
2. **Cost validation:** Prove business model without ongoing AI costs
3. **Quality baseline:** Manual processes establish accuracy benchmarks for future AI
4. **Risk mitigation:** Avoid AI false positives during early adoption
5. **Flexibility:** Can add AI as optional premium features based on customer demand

**Consequences:**
- Manual verification staff hiring required at scale
- Must design UIs for efficient manual review (not just AI oversight)
- Appeals system critical for candidate trust (no AI explanations initially)
- Can charge premium for AI-powered features later

**Status:** APPROVED
