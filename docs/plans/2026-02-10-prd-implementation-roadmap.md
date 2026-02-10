# ProctorGuard PRD Implementation Roadmap

**Created:** 2026-02-10
**Status:** Planning Complete - Ready for Execution
**Timeline:** 8-14 months (8-10 months optimized with parallel execution)
**Root Epic:** `proctor-exam-mvp-rsk`

## Executive Summary

This roadmap transforms the ProctorGuard MVP into an enterprise-grade proctoring platform by implementing 6 phases of enhancements. The plan addresses the gap between current MVP capabilities and PRD requirements for high-stakes corporate certification exams.

### Current MVP Status ✅
- Browser-based exam delivery with webcam access
- Manual flag creation and review workflow (database schema ready)
- 9-role RBAC system
- Question banks, exams, enrollment management
- Objective question auto-scoring
- Session tracking with resume capability

### PRD Requirements (Missing) ❌
- Advanced identity verification (biometrics, liveness detection)
- Native lockdown browser (Windows/macOS)
- Real-time AI monitoring with automated flag generation
- Explainable AI with candidate appeals system
- HRIS integration for employee sync
- GDPR/CCPA compliance features
- WCAG 2.1 Level AA accessibility

---

## Implementation Phases

### Phase 1: Staff Review Infrastructure & Basic Monitoring
**Epic:** `proctor-exam-mvp-6xf`
**Timeline:** 4-6 weeks
**Priority:** CRITICAL (P0)
**Team:** Core MVP team (Team A)
**Status:** 15 tasks created and ready

**Why Critical:** Foundation for all future proctoring features. All AI monitoring depends on this.

**Key Deliverables:**
1. Session Review Dashboard (`/apps/staff/app/dashboard/sessions/`)
2. Video Playback System (HTML5 player with flag timeline)
3. Flag Management UI (`/apps/staff/app/dashboard/sessions/flagged/`)
4. Review Workflow (PENDING → IN_REVIEW → CLEARED/VIOLATION)

**Database Changes:**
- `ExamSession`: Add review assignment fields (`reviewAssignedTo`, `reviewDecision`, `reviewRationale`)
- `Flag`: Add evidence tracking (`videoTimestamp`, `screenshotUrl`, `aiConfidence`)
- New models: `SessionRecording`, `RecordingChunk`

**Tasks Breakdown (15 total):**

**Wave 1 - Database (3 tasks):**
- `proctor-exam-mvp-dmn` [P0] - Add review assignment fields to ExamSession
- `proctor-exam-mvp-cj5` [P0] - Add evidence tracking to Flag model
- `proctor-exam-mvp-0a1` [P1] - Create SessionRecording and RecordingChunk models

**Wave 2 - Core Infrastructure (2 tasks):**
- `proctor-exam-mvp-e51` [P0] - Create Sessions page layout
- `proctor-exam-mvp-d8x` [P0] - Implement review workflow state machine

**Wave 3 - Session Management (4 tasks):**
- `proctor-exam-mvp-37r` [P0] - Create session detail page with tabs
- `proctor-exam-mvp-9qa` [P0] - Create Flagged Sessions queue page
- `proctor-exam-mvp-wi8` [P1] - Build session statistics widget
- `proctor-exam-mvp-b8h` [P1] - Add recording status badges

**Wave 4 - Detail Views (4 tasks):**
- `proctor-exam-mvp-0q5` [P0] - Build Recording tab with video player
- `proctor-exam-mvp-kx1` [P0] - Build Flags tab with evidence viewer
- `proctor-exam-mvp-7rb` [P1] - Build Timeline tab with activity visualization
- `proctor-exam-mvp-bek` [P1] - Create manual flag creation UI

**Wave 5 - Enhancements (2 tasks):**
- `proctor-exam-mvp-cza` [P1] - Add bulk review actions
- `proctor-exam-mvp-jbs` [P2] - Implement advanced search and filtering

**Success Metrics:**
- Reviewers can view and resolve flags within 5 minutes of exam completion
- Video playback loads in <3 seconds
- Zero permission bypass vulnerabilities

**Risks & Mitigation:**
- **Risk:** Large video files may load slowly
  - **Mitigation:** Use Vercel Blob CDN, progressive loading, adaptive bitrate
- **Risk:** Browser video codec compatibility
  - **Mitigation:** Test on Chrome, Firefox, Safari; use H.264 (universal support)

---

### Phase 2: Pre-Exam Identity Verification
**Epic:** `proctor-exam-mvp-5vh`
**Timeline:** 6-8 weeks
**Priority:** HIGH (P1)
**Team:** Core MVP team (Team A)
**Dependencies:** Phase 1 must complete first
**Status:** Epic created, tasks TBD

**Why High Priority:** Prevents impersonation attacks (TH-003 threat from PRD)

**Key Deliverables:**
1. Document Capture & Validation (ID photo, OCR extraction)
2. Facial Biometric Capture (live selfie with positioning guidance)
3. Liveness Detection (via third-party API)
4. Face Matching (selfie vs ID photo, 85% similarity threshold)
5. Verification Dashboard (`/apps/staff/app/dashboard/verifications/`)

**Database Changes:**
- New `IdentityVerification` model
  - Document details: `documentType`, `documentImageFrontUrl`, `extractedName`, `extractedDOB`, `ocrConfidence`
  - Biometric data: `liveSelfieUrl`, `livenessScore`, `faceMatchScore`, `faceMatchPassed`
  - Verification status: `status`, `verifiedAt`, `verifiedBy`, `rejectionReason`

**Third-Party Service (Required):**
- **Provider:** Onfido, Jumio, or Persona
- **Cost:** ~$2-5 per verification
- **Features:** Document verification, liveness detection, face matching
- **Integration:** Abstract provider interface to avoid vendor lock-in

**New Packages:**
- `@proctorguard/identity-verification` (provider abstraction layer)

**Implementation Approach:**
1. Create provider interface with pluggable implementations
2. Store raw images independently (Vercel Blob)
3. Cache verifications (30-day reuse for same candidate)
4. Implement manual review queue for borderline cases (75-84% match)

**Success Metrics:**
- False rejection rate <5%
- Average verification time <3 minutes
- Manual review required for <10% of verifications

**Risks & Mitigation:**
- **Risk:** Vendor lock-in
  - **Mitigation:** Abstract provider interface, store raw images independently
- **Risk:** Cost scaling ($2-5 per verification)
  - **Mitigation:** Cache verifications (30-day reuse), organization-level budgets
- **Risk:** False rejections impact candidate experience
  - **Mitigation:** Manual review queue, adjustable thresholds, clear rejection reasons
- **Risk:** Privacy compliance (biometric data storage)
  - **Mitigation:** Implement consent flow, 30-day retention policy, BIPA compliance

---

### Phase 3: Automated AI Monitoring & Flagging
**Epic:** `proctor-exam-mvp-bqn`
**Timeline:** 8-10 weeks
**Priority:** HIGH (P1)
**Team:** Team B (AI/ML expertise)
**Dependencies:** Phase 1 must complete first
**Status:** Epic created, tasks TBD
**Can Run In Parallel With:** Phase 2

**Why High Priority:** Core security automation for threat detection (TH-001, TH-002, TH-004)

**Key Deliverables:**
1. Real-Time Video Streaming (WebRTC, 1-2 FPS frame extraction)
2. AI Behavior Analysis
   - Face detection: `NO_FACE_DETECTED` flag if absent >5 seconds
   - Multiple face detection: `MULTIPLE_FACES` flag with screenshot
   - Gaze tracking: `LOOKING_AWAY` flag if off-screen >10 seconds
   - Object detection: `PHONE_DETECTED`, `PERSON_DETECTED` flags
   - Audio monitoring: `AUDIO_DETECTED` flag for voice activity
3. Browser Behavior Monitoring
   - Focus loss detection: `BROWSER_SWITCH` flag
   - Copy/paste detection: `COPY_PASTE` flag
4. Automated Flag Generation (with confidence scores, evidence)

**Database Changes:**
- `Flag`: Enhanced for AI
  - `aiConfidence` (0-100%)
  - `aiModel` (model version)
  - `detectionMethod` (face_detection, object_detection)
  - `frameNumber`, `audioClipUrl`, `rawMetadata`, `autoResolved`
- `ExamSession`: Streaming metadata
  - `streamSessionId`, `streamStartedAt`, `framesProcessed`
  - `flagsGenerated`, `aiSummary`, `riskScore` (0-100)
- New `FrameAnalysis` model (detailed analysis logs)

**Third-Party Services (Hybrid Approach):**

**Browser-side (FREE):**
- TensorFlow.js + MediaPipe Face Detection
- COCO-SSD for basic object detection
- Runs in candidate's browser
- Use for: Basic face presence detection

**Server-side ($):**
- **Vision AI:** AWS Rekognition or Google Cloud Vision AI
  - Complex analysis (multiple faces, object detection, face comparison)
  - Cost: ~$0.001 per frame → ~$0.50 per hour-long exam (at 1-2 FPS)
- **Audio:** AssemblyAI or AWS Transcribe
  - Voice activity detection
  - Cost: ~$0.00025 per second → ~$0.90 per hour
- **Total AI cost per exam:** ~$1.40-2.00 per hour-long exam

**Cost Optimization Strategy:**
- Sample frames at 1-2 FPS (not full 30 FPS)
- Use browser-side TensorFlow.js for basic checks (FREE)
- Only send suspicious frames to server for deep analysis
- Batch processing for non-real-time analysis
- Set per-exam budget caps

**New Packages:**
- `@proctorguard/ai-monitoring` (AI provider abstraction)
- `@proctorguard/streaming` (WebRTC infrastructure)

**Implementation Approach:**
1. Build WebRTC streaming infrastructure
2. Implement browser-side TensorFlow.js detection (Milestone 1)
3. Add server-side AI analysis for complex cases (Milestone 2)
4. Implement automated flag generation with confidence scores
5. Build flag review UI (already done in Phase 1)
6. Tune confidence thresholds based on false positive rates

**Success Metrics:**
- False positive rate <15%
- AI cost per exam <$1 (target), <$2 (acceptable)
- Flag generation latency <30 seconds
- 95% uptime for streaming infrastructure

**Risks & Mitigation:**
- **Risk:** AI cost overruns
  - **Mitigation:** Sample frames (1-2 FPS), batch processing, budget caps
- **Risk:** False positives annoy candidates
  - **Mitigation:** Confidence thresholds, require human review for low confidence
- **Risk:** Real-time analysis latency
  - **Mitigation:** Async processing, prioritize critical detections
- **Risk:** Video streaming bandwidth
  - **Mitigation:** Adaptive bitrate, fallback to post-exam analysis
- **Risk:** Accuracy bias across demographics
  - **Mitigation:** Test diverse populations, bias monitoring dashboards (Phase 6)

---

### Phase 4: Explainable AI & Appeals System
**Epic:** `proctor-exam-mvp-ao6`
**Timeline:** 6-8 weeks
**Priority:** MEDIUM (P2)
**Team:** Core MVP team (Team A)
**Dependencies:** Phase 2 AND Phase 3 must complete first
**Status:** Epic created, tasks TBD

**Why Medium Priority:** Required for transparency and candidate rights (PRD: XAI-001 to XAI-007, APP-001 to APP-007)

**Key Deliverables:**
1. Explainable Flag Generation (natural language explanations, evidence linking)
2. Candidate Evidence Viewer (`/apps/candidate/app/dashboard/results/[sessionId]/`)
3. Appeal Submission Workflow (text explanation, optional evidence upload)
4. Appeal Review Dashboard (`/apps/staff/app/dashboard/appeals/`)
5. Three-Level Escalation System
   - Level 1: Initial reviewer (48-hour SLA)
   - Level 2: Senior reviewer (72-hour SLA)
   - Level 3: QA team (1-week SLA)
6. Appeal Communication (email notifications, in-app threaded messaging)

**Database Changes:**
- New `Appeal` model
  - `appealText`, `evidenceUrls`, `status`, `level`
  - `assignedTo`, `decision`, `decisionRationale`
  - `slaDueAt`, `slaBreached`
- New `AppealMessage` model (threaded messaging)
- `Flag`: Add explainability
  - `explanation` (natural language)
  - `evidenceClipUrl` (10-second clip around flag)
  - `appealed` (boolean)

**New Packages:**
- `@proctorguard/appeals` (appeal workflow service)

**Implementation Approach:**
1. Generate natural language explanations for flags using templates
   - Example: "Multiple faces detected at 14:32 - Another person appeared behind you for 8 seconds"
2. Create evidence clips (5 seconds before/after flag timestamp)
3. Build candidate evidence viewer with watermarked video playback
4. Implement 3-level escalation workflow with SLA tracking
5. Add email notifications for appeal lifecycle
6. Build in-app threaded messaging

**Success Metrics:**
- Appeal overturn rate <20% (higher indicates AI tuning issues)
- 95% of appeals resolved within SLA
- Candidate satisfaction score >4.0/5.0 for appeal process
- Average appeal processing time: L1 <36h, L2 <60h, L3 <5 days

**Risks & Mitigation:**
- **Risk:** High appeal volume indicates AI tuning issues
  - **Mitigation:** Monitor overturn rates, adjust confidence thresholds
- **Risk:** Evidence preservation costs (Vercel Blob storage)
  - **Mitigation:** 1-year retention per PRD, lifecycle policies, compression
- **Risk:** Candidates sharing recordings externally
  - **Mitigation:** Watermark videos, terms of service prohibiting sharing

---

### Phase 5: Lockdown Browser (Windows/macOS)
**Epic:** `proctor-exam-mvp-8kd`
**Timeline:** 12-16 weeks
**Priority:** MEDIUM (P2)
**Team:** Team C (Electron/native app expertise, can be consultant)
**Dependencies:** None (CAN RUN IN PARALLEL with all other phases)
**Status:** Epic created, tasks TBD

**Why Independent:** Native application development is completely separate from web app. Can start immediately.

**Key Deliverables:**
1. Native Application (Electron v28+)
   - Cross-platform: Windows x64, macOS x64/ARM64
   - Auto-update mechanism (electron-updater)
2. Browser Restrictions
   - Full-screen kiosk mode (no title bar, no resize)
   - Disabled F11, Escape, Alt+Tab, Cmd+Tab
   - Blocked right-click, developer tools
   - Disabled address bar, navigation controls
3. System Restrictions
   - Application switching blocked (hook system APIs)
   - Task manager prevented
   - Screen capture blocked (Windows: `SetWindowDisplayAffinity`)
   - Clipboard isolation
4. Process Monitoring
   - Scan running processes every 5 seconds
   - Blocklist: Slack, Discord, Zoom, TeamViewer, ChatGPT, Claude, Copilot, etc.
   - Alert user to close prohibited apps before exam
   - Generate flag if detected during exam
5. Network Controls
   - DNS filtering via local proxy
   - Block unauthorized domains (social media, AI services)
   - Allowlist: Exam server only
   - VPN/proxy detection
6. VM & Remote Desktop Detection
   - Check for hypervisor signatures (VMware, VirtualBox, Hyper-V)
   - Detect RDP sessions
   - Generate flag if detected

**Database Changes:**
- `ExamSession`: Lockdown tracking
  - `lockdownBrowserUsed`, `lockdownBrowserVersion`
  - `systemInfo` (OS, RAM, CPU)
  - `processViolations`, `networkViolations`
  - `vmDetected`, `remoteDesktopDetected`
- New `LockdownBrowserRelease` model
  - `version`, `platform`, `architecture`
  - `downloadUrl`, `checksumSHA256`, `releaseNotes`
  - `isRequired`, `releasedAt`

**New Repository:**
- `proctor-exam-lockdown-browser` (separate from monorepo)
- Electron application with TypeScript
- Build pipeline for Windows and macOS installers
- Auto-update server

**Technology Stack:**
- Electron v28+
- electron-builder (packaging)
- electron-updater (auto-updates)
- Native modules: node-process-list, dns-proxy
- TypeScript, React (for UI)

**Code Signing (CRITICAL - Required for distribution):**
- **Windows:** EV Code Signing Certificate (~$300-500/year)
  - Required to avoid Windows SmartScreen warnings
  - Purchase from: DigiCert, Sectigo
  - Lead time: 3-5 days for EV certificate verification
- **macOS:** Apple Developer Program (~$99/year)
  - Developer ID certificate + notarization
  - Required to avoid Gatekeeper warnings

**Distribution:**
- Host installers on Vercel Blob or S3 + CloudFront
- Update server for electron-updater
- Download page: `/apps/candidate/app/dashboard/exams/[id]/download-lockdown-browser`

**Implementation Approach:**
1. **Sprint 1-2:** Electron scaffold, basic kiosk mode
2. **Sprint 3-4:** System restrictions (app switching, screen capture)
3. **Sprint 5-6:** Process monitoring, blocklist
4. **Sprint 7-8:** Network controls, DNS filtering
5. **Sprint 9-10:** VM/RDP detection
6. **Sprint 11-12:** Code signing, distribution, auto-update
7. **Sprint 13-14:** Testing on Windows 10/11, macOS 13/14/15
8. **Sprint 15-16:** Security hardening, tamper detection

**Success Metrics:**
- Installation success rate >95%
- Crashes <1%
- Circumvention attempts detected >90%
- Code signing warnings: 0

**Risks & Mitigation:**
- **Risk:** OS updates breaking restrictions
  - **Mitigation:** Test on OS betas, graceful degradation, quick patch releases
- **Risk:** User permissions denied (camera, screen recording on macOS)
  - **Mitigation:** Clear onboarding, detect missing permissions, block exam start
- **Risk:** False positives (legitimate apps flagged)
  - **Mitigation:** Configurable allowlist per organization
- **Risk:** Advanced users circumventing restrictions
  - **Mitigation:** Obfuscate code, tamper detection, server-side validation
- **Risk:** Code signing certificate loss/expiration
  - **Mitigation:** Backup securely, set renewal reminders, document process
- **Risk:** Development complexity (requires native app expertise)
  - **Mitigation:** Hire experienced Electron developer or consultant

---

### Phase 6: Enterprise Features & Compliance
**Epic:** `proctor-exam-mvp-edr`
**Timeline:** 8-10 weeks
**Priority:** LOW (P3) - Enterprise sales enablers
**Team:** Core MVP team (Team A)
**Dependencies:** Phase 4 must complete first
**Status:** Epic created, tasks TBD

**Why Low Priority:** Required for enterprise sales (Fortune 500, government), but not critical for MVP validation.

**Key Deliverables:**

#### 6.1 HRIS Integration
- Native connectors: Workday, SAP SuccessFactors, Oracle HCM, BambooHR
- Bi-directional sync:
  - **Inbound:** Import employees, departments, org hierarchy, profile photos
  - **Outbound:** Export exam results, certifications, expiration dates
- Automated exam assignment based on role/department
- Identity verification enhancement (compare against HRIS photo)
- Configuration UI (`/apps/staff/app/dashboard/admin/hris/`)

#### 6.2 Metrics & Analytics Dashboards
- **Executive Dashboard:** Completion rate, success rate, appeal metrics, tech dropout analysis
- **Operations Dashboard:** Active sessions, review queue, exam health monitoring
- **Integrity Dashboard:** Flag analytics by type/severity, AI confidence distribution, bias monitoring
- **Automated Alerting:** Email/Slack when metrics breach thresholds

#### 6.3 Accessibility (WCAG 2.1 Level AA)
- Complete keyboard navigation (Tab, Enter, Space)
- Screen reader optimization (ARIA labels, semantic HTML)
- High contrast mode, font scaling up to 200%
- Accommodation management system:
  - Request extended time (1.5x, 2x)
  - Request breaks, screen reader mode
  - Approval workflow for ORG_ADMIN

#### 6.4 Compliance & Privacy
- **GDPR/CCPA Consent Management:**
  - Consent flows for biometric data, video recording, HRIS sync
  - Consent versioning and audit trail
- **Data Subject Rights Portal (`/apps/candidate/app/privacy/`):**
  - View all personal data
  - Download personal data (JSON/PDF export)
  - Request deletion (with retention policy enforcement)
- **Data Retention Policies:**
  - Configurable per organization (videos: 1 year, biometrics: 30 days)
  - Automated deletion background jobs
- **Biometric Data Policies (BIPA compliance):**
  - Published retention policy
  - Written consent requirement
  - No sale of biometric data

**Database Changes:**
- New `HRISIntegration` model
  - `provider`, `credentials` (encrypted), `syncSchedule`, `fieldMappings`
- New `HRISSyncLog` model (audit trail)
- New `Accommodation` model
  - `type`, `timeMultiplier`, `status`, `approvedBy`
- New `Consent` model
  - `consentType`, `consentVersion`, `granted`, `revokedAt`
- New `DataRetentionPolicy` model
  - `dataType`, `retentionDays`

**Third-Party Services:**
- **HRIS APIs:** Direct integration (OAuth/API keys)
- **Email:** SendGrid, Postmark, AWS SES (already needed for auth)
- **Compliance (optional):** OneTrust, TrustArc ($10K-50K/year for enterprise features)

**New Packages:**
- `@proctorguard/hris` (HRIS provider abstraction)
- `@proctorguard/analytics` (metrics calculation service)
- `@proctorguard/compliance` (consent and data rights management)

**Implementation Approach:**
1. **Weeks 1-2:** HRIS provider interfaces
2. **Weeks 3-4:** Analytics dashboards
3. **Weeks 5-6:** Accessibility compliance
4. **Weeks 7-8:** GDPR/CCPA compliance features
5. **Weeks 9-10:** Testing, third-party audits

**Success Metrics:**
- HRIS sync success >99%
- WCAG 2.1 AA audit pass: 100%
- Data subject request processing time <7 days
- Zero compliance violations

**Risks & Mitigation:**
- **Risk:** HRIS API changes without notice
  - **Mitigation:** Monitor vendor changelogs, graceful degradation, error logging
- **Risk:** Compliance liability (GDPR fines up to 4% revenue)
  - **Mitigation:** Legal review, third-party audit, consult privacy attorney
- **Risk:** Accessibility claims
  - **Mitigation:** Don't claim WCAG compliance until third-party certified

---

## Timeline & Execution Strategy

### Optimized Parallel Execution (8-10 months)

```
Months 1-2:  Phase 1 (Staff Review Infrastructure)
Months 2-4:  Phase 2 (Identity Verification) + Phase 3 (AI Monitoring) + Phase 5 (Lockdown Browser - START)
Months 4-6:  Phase 4 (Appeals System) + Phase 5 (Lockdown Browser - CONTINUE)
Months 6-8:  Phase 5 (Lockdown Browser - COMPLETE) + Phase 6 (Enterprise Features)
Months 8-10: Phase 6 (Enterprise Features - COMPLETE), Testing, Audits
```

### Team Allocation

**Team A (Core MVP team - 2-3 developers):**
- Phase 1: Months 1-2
- Phase 2: Months 2-4
- Phase 4: Months 4-6
- Phase 6: Months 6-10

**Team B (AI/ML specialist - 1-2 developers):**
- Phase 3: Months 2-4

**Team C (Electron consultant - 1 developer):**
- Phase 5: Months 2-6 (can start immediately in parallel)

---

## Cost Estimates

### Third-Party Services (Recurring)
- Identity Verification (Onfido/Jumio): $2-5 per verification
- AI Vision APIs (AWS/Google): ~$0.50 per exam hour
- Audio Analysis: ~$0.90 per exam hour
- **Total AI cost per exam:** ~$1.40-2.00 per hour-long exam
- **Estimated monthly cost (1,000 exams/month):** $1,400-2,000

### One-Time Costs
- Code signing certificates: $300-500/year (Windows) + $99/year (macOS)
- Accessibility audit: $5K-15K (one-time)
- Legal compliance review: $5K-10K (one-time)
- Electron consultant: $80-150/hour × 480-640 hours = $38K-96K (Phase 5)

### Optional Enterprise Tools
- Compliance management (OneTrust): $10K-50K/year

### Total Estimated Budget
- **Development (Team A + Team B):** $300K-500K (8-10 months, 3-5 developers)
- **Electron Consultant (Team C):** $38K-96K
- **Third-party services (first year):** $20K-30K (assuming 1,000 exams/month)
- **One-time costs:** $15K-25K
- **Total:** $373K-651K

---

## Success Metrics (Overall)

### Phase 1
- ✅ Reviewers can view and resolve flags within 5 minutes of exam completion

### Phase 2
- ✅ False rejection rate <5%
- ✅ Average verification time <3 minutes

### Phase 3
- ✅ False positive rate <15%
- ✅ AI cost per exam <$1

### Phase 4
- ✅ Appeal overturn rate <20%
- ✅ 95% of appeals resolved within SLA

### Phase 5
- ✅ Installation success rate >95%
- ✅ Crashes <1%

### Phase 6
- ✅ HRIS sync success >99%
- ✅ WCAG 2.1 AA audit pass 100%

---

## Verification Approach

After each phase:

1. **Database Migrations:** Run `npm run db:migrate`, verify schema changes in Prisma Studio
2. **Functional Testing:**
   - Phase 1: Create test session with flags, verify review workflow
   - Phase 2: Complete identity verification flow as candidate, verify in review queue
   - Phase 3: Start exam with video streaming, verify frames processed and flags generated
   - Phase 4: Submit appeal, verify escalation workflow and evidence viewer
   - Phase 5: Install lockdown browser, verify restrictions (try Alt+Tab, Task Manager)
   - Phase 6: Configure HRIS sync, verify employee import; test data deletion request
3. **Integration Testing:** End-to-end exam flow from enrollment → verification → exam → review → appeal
4. **Performance Testing:** Load test with 100+ concurrent exam sessions
5. **Security Testing:** Penetration testing on lockdown browser, API authentication, data encryption

---

## Critical Risks & Mitigation

| Risk | Impact | Phase | Mitigation |
|------|--------|-------|------------|
| AI cost overruns | High | 3 | Sample frames at 1-2 FPS, set budget caps per exam |
| False positive backlash | High | 3, 4 | Confidence thresholds, easy appeals, bias monitoring |
| Lockdown browser circumvention | Critical | 5 | Obfuscate code, tamper detection, server-side validation |
| Vendor lock-in (identity verification) | Medium | 2 | Abstract provider interface, store raw data independently |
| GDPR non-compliance | Critical | 6 | Legal review, third-party audit, conservative interpretation |
| Code signing certificate loss | Medium | 5 | Backup securely, document renewal process |
| OS updates breaking lockdown | Medium | 5 | Test on OS betas, graceful degradation |

---

## Out of Scope (Future Considerations)

- Mobile lockdown browser (iOS/Android) - PRD only specifies Windows/macOS
- Live human proctors - PRD emphasizes fully automated operation
- Integration with LMS (Canvas, Blackboard) - Not mentioned in PRD
- Multi-language support - PRD doesn't specify, assume English for MVP

---

## Next Steps

1. ✅ **Complete:** Create Phase 1 implementation plan with detailed tasks (15 tasks created)
2. ⏭️ **Next:** Unblock root epic (`proctor-exam-mvp-rsk`) to start Phase 1 execution
3. ⏭️ **Next:** Set up third-party service accounts (Onfido/Jumio evaluation)
4. ⏭️ **Next:** Hire Electron developer for Phase 5 (long lead time)
5. ⏭️ **Next:** Purchase code signing certificates (3-5 day lead time for EV cert)
6. ⏭️ **Next:** Begin database schema design for Phase 1 review workflow

---

## Beads Issue Tracking

### Created Epics
- `proctor-exam-mvp-rsk` - [EPIC] PRD Gap Implementation: MVP to Enterprise Platform
- `proctor-exam-mvp-6xf` - [EPIC] Phase 1: Staff Review Infrastructure & Basic Monitoring
- `proctor-exam-mvp-5vh` - [EPIC] Phase 2: Pre-Exam Identity Verification
- `proctor-exam-mvp-bqn` - [EPIC] Phase 3: Automated AI Monitoring & Flagging
- `proctor-exam-mvp-ao6` - [EPIC] Phase 4: Explainable AI & Appeals System
- `proctor-exam-mvp-8kd` - [EPIC] Phase 5: Lockdown Browser (Windows/macOS)
- `proctor-exam-mvp-edr` - [EPIC] Phase 6: Enterprise Features & Compliance

### Phase 1 Tasks (15 created)
See "Phase 1: Staff Review Infrastructure & Basic Monitoring" section above for complete list.

### Commands
```bash
# View all epics
bd epic status

# View ready work
bd ready

# View all open issues
bd list --status=open

# View Phase 1 tasks
bd list | grep "Phase 1"

# Start work on a task
bd update <issue-id> --status=in_progress
```

---

**Last Updated:** 2026-02-10
**Document Owner:** ProctorGuard Engineering Team
