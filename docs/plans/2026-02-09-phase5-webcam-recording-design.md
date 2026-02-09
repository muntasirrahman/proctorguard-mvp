# Phase 5: Webcam Recording and Proctoring - Design Document

**Date**: 2026-02-09
**Issue**: proctor-exam-mvp-3bf
**Status**: Approved
**Dependencies**: Phase 4 (proctor-exam-mvp-1vr) ✓ Complete

---

## Overview

Phase 5 implements continuous webcam recording during exams using chunked video capture with the MediaRecorder API. Recordings upload to Vercel Blob storage in 2-3 minute segments with retry logic for failed uploads. Reviewers can access uploaded chunks while exams are in progress, providing near-real-time review capability without live streaming complexity.

This phase focuses on reliable recording infrastructure and lays the foundation for future AI monitoring without implementing detection itself.

---

## Design Decisions Summary

**Key Choices:**
1. **Recording Strategy**: Chunked recording (2-3 minute segments) with immediate upload
2. **Upload Failure Handling**: Queue failed chunks in IndexedDB, retry with exponential backoff
3. **Metadata Level**: Standard (timestamps + exam context: questions viewed, answers submitted, flags)
4. **Database Schema**: Two-table hierarchy (SessionRecording + RecordingChunk)
5. **Reviewer Access**: Hybrid - chunks available as uploaded (not live streaming)
6. **AI Monitoring**: Foundation only - database fields prepared, no detection implemented
7. **Recording Start**: Begin when exam timer starts (after pre-exam checks complete)
8. **Failure Enforcement**: Conditional on `exam.enableRecording` flag
9. **Retention Policy**: Time-based (add field, defer cleanup job to future phase)
10. **Error Visibility**: Session-level flags in reviewer dashboard

---

## Architecture

### Overall Approach

**Flow:**
1. PreExamChecks grants camera permission and shows preview (Phase 4, unchanged)
2. User clicks "Begin Exam" → startExamSession() → timer starts
3. ExamInterface mounts, detects `exam.enableRecording === true`
4. Recording starts using MediaRecorder with timeslice of 2-3 minutes
5. Each chunk uploads immediately to Vercel Blob
6. Failed uploads queue in IndexedDB, retry with exponential backoff
7. Chunk metadata (questions viewed, answers submitted, flags) stored in database
8. On exam submission, recording stops, final flush of pending chunks
9. Reviewers access uploaded chunks via session detail page

**Components:**
- **useRecordingManager** - Custom React hook managing MediaRecorder lifecycle
- **Upload Handler** - Manages Vercel Blob uploads with retry queue
- **Server Actions** - Initialize, upload chunk, report failure, finalize
- **IndexedDB Store** - Queue for failed chunks
- **Reviewer UI** - Recording tab with video player and metadata

**Technology Stack:**
- MediaRecorder API (browser native)
- IndexedDB (client-side persistence)
- Vercel Blob (cloud storage)
- React hooks (state management)
- Server Actions (Next.js 15)

---

## Database Schema

### New Models

```prisma
model SessionRecording {
  id              String   @id @default(cuid())
  sessionId       String   @unique
  recordingStatus String   // 'not_started', 'in_progress', 'completed', 'partial', 'failed'
  totalChunks     Int      @default(0)
  uploadedChunks  Int      @default(0)
  failedChunks    Int      @default(0)
  totalDuration   Int?     // seconds
  startedAt       DateTime?
  completedAt     DateTime?

  session ExamSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  chunks  RecordingChunk[]

  @@index([sessionId])
  @@index([recordingStatus])
}

model RecordingChunk {
  id                  String   @id @default(cuid())
  sessionRecordingId  String
  chunkNumber         Int
  blobUrl             String?  // Vercel Blob URL
  blobKey             String?  // For deletion
  uploadStatus        String   // 'pending', 'uploading', 'uploaded', 'failed'
  duration            Int      // seconds
  startTime           DateTime
  endTime             DateTime
  fileSize            Int?     // bytes

  // Standard metadata
  metadata            Json?    // { questionsViewed: [1,2,3], answersSubmitted: [1], flagsCreated: [] }

  retryCount          Int      @default(0)
  lastError           String?
  uploadedAt          DateTime?

  sessionRecording SessionRecording @relation(fields: [sessionRecordingId], references: [id], onDelete: Cascade)

  @@unique([sessionRecordingId, chunkNumber])
  @@index([sessionRecordingId])
  @@index([uploadStatus])
}
```

### Schema Modifications

**Add to Organization:**
```prisma
recordingRetentionDays Int @default(90) // Time-based retention policy
```

**Add to ExamSession:**
```prisma
recording SessionRecording?
```

### Status Values

**recordingStatus:**
- `not_started` - Recording not yet initialized
- `in_progress` - Actively recording
- `completed` - All chunks uploaded successfully
- `partial` - Recording finished but some chunks missing
- `failed` - Recording never started or all chunks failed

**uploadStatus:**
- `pending` - Chunk generated, waiting for upload
- `uploading` - Upload in progress
- `uploaded` - Successfully uploaded to Vercel Blob
- `failed` - Upload failed after retries exhausted

---

## Client-Side Implementation

### Recording Manager Hook

**File**: `apps/candidate/app/dashboard/exams/[id]/take/use-recording-manager.ts`

```typescript
type UseRecordingManagerOptions = {
  sessionId: string;
  videoStream: MediaStream | null;
  examDuration: number;
  onChunkReady: (blob: Blob, metadata: ChunkMetadata) => Promise<void>;
  onError: (error: RecordingError) => void;
};

export function useRecordingManager(options: UseRecordingManagerOptions) {
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>('idle');
  const [currentChunk, setCurrentChunk] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const startRecording = async () => {
    // Initialize MediaRecorder with videoStream
    // Set timeslice to 150000ms (2.5 minutes)
    // Listen to 'dataavailable' event
    // Start recording
  };

  const stopRecording = async () => {
    // Stop MediaRecorder
    // Flush final chunk
    // Finalize recording session
  };

  return {
    recordingStatus,
    currentChunk,
    startRecording,
    stopRecording,
  };
}
```

**Key Features:**
- Reuses video stream from PreExamChecks (no re-request camera)
- Generates chunks every 2-3 minutes via timeslice
- Tracks current chunk number for metadata
- Handles MediaRecorder errors
- Cleanup on unmount

### Upload Queue with IndexedDB

**File**: `apps/candidate/app/lib/recording-queue.ts`

```typescript
// IndexedDB store: 'failedChunks'
type QueuedChunk = {
  id: string;
  sessionId: string;
  chunkNumber: number;
  blob: Blob;
  metadata: ChunkMetadata;
  timestamp: number;
  retryCount: number;
};

export class RecordingQueue {
  async add(chunk: QueuedChunk): Promise<void>;
  async getAll(sessionId: string): Promise<QueuedChunk[]>;
  async remove(id: string): Promise<void>;
  async clear(sessionId: string): Promise<void>;
  async updateRetryCount(id: string, count: number): Promise<void>;
}
```

**Retry Logic:**
```typescript
// Exponential backoff
// Attempt 1: Wait 2s, retry
// Attempt 2: Wait 4s, retry
// Attempt 3: Wait 8s, retry
// After 3 attempts: Queue in IndexedDB
// Background retry loop every 30s
// On exam submit: Final retry burst (5 attempts)
// If still failing: Report as permanently failed
```

### Integration with ExamInterface

**Modifications to**: `apps/candidate/app/dashboard/exams/[id]/take/exam-interface.tsx`

```typescript
export function ExamInterface({ session, exam, ... }) {
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

  const { recordingStatus, startRecording, stopRecording } = useRecordingManager({
    sessionId: session.id,
    videoStream,
    examDuration: exam.duration,
    onChunkReady: handleChunkUpload,
    onError: handleRecordingError,
  });

  useEffect(() => {
    // Start recording when component mounts if required
    if (exam.enableRecording && videoStream) {
      initializeAndStartRecording();
    }
  }, [exam.enableRecording, videoStream]);

  const handleSubmit = async () => {
    await stopRecording(); // Flush final chunks
    await submitExam(session.id);
    onSubmit();
  };
}
```

**Recording Status UI:**
```typescript
// Show recording indicator
{recordingStatus === 'recording' && (
  <div className="flex items-center gap-2 text-red-600">
    <div className="animate-pulse h-3 w-3 bg-red-600 rounded-full" />
    <span className="text-sm">Recording</span>
  </div>
)}

// Show warning if recording failed (optional recording)
{recordingStatus === 'failed' && !exam.requireRecording && (
  <Alert variant="warning">
    Recording unavailable. Exam will continue without video.
  </Alert>
)}

// Block if recording failed (required recording)
{recordingStatus === 'failed' && exam.requireRecording && (
  <Modal>
    <p>Recording is required but failed to start.</p>
    <Button onClick={retryRecording}>Retry</Button>
    <Button onClick={exitExam}>Exit Exam</Button>
  </Modal>
)}
```

### Chunk Metadata Collection

**Track during exam:**
```typescript
type ChunkMetadata = {
  chunkNumber: number;
  startTime: Date;
  endTime: Date;
  duration: number; // seconds
  questionsViewed: number[]; // Question indices seen during chunk
  answersSubmitted: number[]; // Question indices answered during chunk
  flagsCreated: string[]; // Flag IDs created during chunk
};

// Collect as exam progresses
const currentChunkMetadata = useRef<ChunkMetadata>({
  questionsViewed: [],
  answersSubmitted: [],
  flagsCreated: [],
});

// On question navigation
const goToQuestion = (index: number) => {
  if (!currentChunkMetadata.current.questionsViewed.includes(index)) {
    currentChunkMetadata.current.questionsViewed.push(index);
  }
  setCurrentIndex(index);
};

// On answer save
const handleAnswerChange = (data) => {
  // ... existing save logic ...
  if (!currentChunkMetadata.current.answersSubmitted.includes(currentIndex)) {
    currentChunkMetadata.current.answersSubmitted.push(currentIndex);
  }
};

// On chunk complete
const onChunkReady = (blob: Blob) => {
  const metadata = {
    ...currentChunkMetadata.current,
    endTime: new Date(),
  };
  uploadChunk(blob, metadata);
  // Reset for next chunk
  currentChunkMetadata.current = {
    questionsViewed: [],
    answersSubmitted: [],
    flagsCreated: [],
  };
};
```

---

## Server-Side Implementation

### Server Actions

**File**: `apps/candidate/app/actions/recordings.ts`

```typescript
'use server';

import { auth } from '@proctorguard/auth';
import { prisma } from '@proctorguard/database';
import { put } from '@vercel/blob';
import { headers } from 'next/headers';

/**
 * Initialize recording session when exam starts
 */
export async function initializeRecording(sessionId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  // Validate session ownership
  const examSession = await prisma.examSession.findUnique({
    where: { id: sessionId },
    select: { id: true, candidateId: true, status: true },
  });

  if (!examSession || examSession.candidateId !== session.user.id) {
    throw new Error('Unauthorized');
  }

  if (examSession.status !== 'IN_PROGRESS') {
    throw new Error('Session is not in progress');
  }

  // Create SessionRecording
  const recording = await prisma.sessionRecording.create({
    data: {
      sessionId,
      recordingStatus: 'in_progress',
      startedAt: new Date(),
    },
  });

  return { recordingId: recording.id };
}

/**
 * Upload recording chunk to Vercel Blob
 */
export async function uploadRecordingChunk(
  sessionId: string,
  chunkNumber: number,
  formData: FormData,
  metadata: ChunkMetadata
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  // Validate ownership
  const examSession = await prisma.examSession.findUnique({
    where: { id: sessionId },
    select: { id: true, candidateId: true },
  });

  if (!examSession || examSession.candidateId !== session.user.id) {
    throw new Error('Unauthorized');
  }

  // Get file from FormData
  const file = formData.get('chunk') as File;
  if (!file) throw new Error('No file provided');

  // Enforce file size limit (50MB)
  if (file.size > 50 * 1024 * 1024) {
    throw new Error('Chunk too large');
  }

  // Upload to Vercel Blob
  const blob = await put(
    `recordings/${sessionId}/chunk-${chunkNumber}.webm`,
    file,
    { access: 'public', addRandomSuffix: false }
  );

  // Get SessionRecording
  const sessionRecording = await prisma.sessionRecording.findUnique({
    where: { sessionId },
  });

  if (!sessionRecording) {
    throw new Error('Recording session not found');
  }

  // Create or update RecordingChunk
  await prisma.recordingChunk.upsert({
    where: {
      sessionRecordingId_chunkNumber: {
        sessionRecordingId: sessionRecording.id,
        chunkNumber,
      },
    },
    create: {
      sessionRecordingId: sessionRecording.id,
      chunkNumber,
      blobUrl: blob.url,
      blobKey: blob.pathname,
      uploadStatus: 'uploaded',
      duration: metadata.duration,
      startTime: metadata.startTime,
      endTime: metadata.endTime,
      fileSize: file.size,
      metadata: metadata,
      uploadedAt: new Date(),
    },
    update: {
      blobUrl: blob.url,
      blobKey: blob.pathname,
      uploadStatus: 'uploaded',
      uploadedAt: new Date(),
    },
  });

  // Update SessionRecording counts
  await prisma.sessionRecording.update({
    where: { id: sessionRecording.id },
    data: {
      uploadedChunks: { increment: 1 },
      totalChunks: Math.max(sessionRecording.totalChunks, chunkNumber + 1),
    },
  });

  return { success: true, url: blob.url };
}

/**
 * Report chunk upload failure
 */
export async function reportChunkFailure(
  sessionId: string,
  chunkNumber: number,
  error: string
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  // Validate ownership
  const examSession = await prisma.examSession.findUnique({
    where: { id: sessionId },
    select: { candidateId: true },
  });

  if (!examSession || examSession.candidateId !== session.user.id) {
    throw new Error('Unauthorized');
  }

  const sessionRecording = await prisma.sessionRecording.findUnique({
    where: { sessionId },
  });

  if (!sessionRecording) return;

  // Create failed chunk record
  await prisma.recordingChunk.upsert({
    where: {
      sessionRecordingId_chunkNumber: {
        sessionRecordingId: sessionRecording.id,
        chunkNumber,
      },
    },
    create: {
      sessionRecordingId: sessionRecording.id,
      chunkNumber,
      uploadStatus: 'failed',
      lastError: error,
      duration: 0,
      startTime: new Date(),
      endTime: new Date(),
    },
    update: {
      uploadStatus: 'failed',
      lastError: error,
    },
  });

  // Increment failed count
  await prisma.sessionRecording.update({
    where: { id: sessionRecording.id },
    data: {
      failedChunks: { increment: 1 },
    },
  });

  return { success: true };
}

/**
 * Finalize recording when exam completes
 */
export async function finalizeRecording(sessionId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  // Validate ownership
  const examSession = await prisma.examSession.findUnique({
    where: { id: sessionId },
    select: { candidateId: true },
  });

  if (!examSession || examSession.candidateId !== session.user.id) {
    throw new Error('Unauthorized');
  }

  const sessionRecording = await prisma.sessionRecording.findUnique({
    where: { sessionId },
    include: { chunks: true },
  });

  if (!sessionRecording) return;

  // Calculate total duration
  const totalDuration = sessionRecording.chunks.reduce(
    (sum, chunk) => sum + chunk.duration,
    0
  );

  // Determine final status
  const allUploaded = sessionRecording.uploadedChunks === sessionRecording.totalChunks;
  const recordingStatus = allUploaded ? 'completed' : 'partial';

  // Update recording
  await prisma.sessionRecording.update({
    where: { id: sessionRecording.id },
    data: {
      recordingStatus,
      completedAt: new Date(),
      totalDuration,
    },
  });

  return { success: true, status: recordingStatus };
}
```

### Vercel Blob Configuration

**Environment Variables Required:**
```env
BLOB_READ_WRITE_TOKEN="vercel_blob_..." # From Vercel dashboard
```

**Blob Storage Structure:**
```
recordings/
  {sessionId}/
    chunk-0.webm
    chunk-1.webm
    chunk-2.webm
    ...
```

**File Naming Convention:**
- Format: `chunk-{number}.webm`
- No random suffix (deterministic URLs)
- Sequential numbering (0-indexed)

---

## Reviewer Integration

### Session List Enhancements

**File**: `apps/reviewer/app/dashboard/sessions/page.tsx`

Add recording status badge to session list:

```typescript
<Badge variant={getRecordingBadgeVariant(session.recording?.recordingStatus)}>
  {session.recording ? (
    <>
      {session.recording.uploadedChunks} / {session.recording.totalChunks} chunks
    </>
  ) : (
    'No recording'
  )}
</Badge>

// Badge variants:
// - completed (green): All chunks uploaded
// - partial (yellow): Some chunks missing
// - in_progress (blue): Exam still running
// - failed (red): Recording failed
```

### Session Detail - Recording Tab

**File**: `apps/reviewer/app/dashboard/sessions/[id]/recording-tab.tsx`

New tab in session detail view:

```typescript
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@proctorguard/ui';
import { Badge } from '@proctorguard/ui';
import { Button } from '@proctorguard/ui';
import { PlayCircle, AlertCircle, CheckCircle2 } from 'lucide-react';

type RecordingTabProps = {
  sessionRecording: {
    id: string;
    recordingStatus: string;
    totalChunks: number;
    uploadedChunks: number;
    failedChunks: number;
    totalDuration: number | null;
    chunks: Array<{
      id: string;
      chunkNumber: number;
      blobUrl: string | null;
      uploadStatus: string;
      duration: number;
      startTime: Date;
      endTime: Date;
      metadata: any;
    }>;
  };
};

export function RecordingTab({ sessionRecording }: RecordingTabProps) {
  const [selectedChunk, setSelectedChunk] = useState<number | null>(null);

  const currentChunk = selectedChunk !== null
    ? sessionRecording.chunks.find(c => c.chunkNumber === selectedChunk)
    : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Chunk List */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Recording Chunks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sessionRecording.chunks.map((chunk) => (
                <button
                  key={chunk.id}
                  onClick={() => setSelectedChunk(chunk.chunkNumber)}
                  className={`w-full text-left p-3 rounded-lg border ${
                    selectedChunk === chunk.chunkNumber
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      Chunk {chunk.chunkNumber + 1}
                    </span>
                    {chunk.uploadStatus === 'uploaded' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {chunk.duration}s • {new Date(chunk.startTime).toLocaleTimeString()}
                  </p>
                </button>
              ))}
            </div>

            {/* Missing chunks warning */}
            {sessionRecording.failedChunks > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ {sessionRecording.failedChunks} chunk(s) failed to upload
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right: Video Player + Metadata */}
      <div className="lg:col-span-2 space-y-6">
        {currentChunk ? (
          <>
            {/* Video Player */}
            <Card>
              <CardHeader>
                <CardTitle>Chunk {currentChunk.chunkNumber + 1}</CardTitle>
              </CardHeader>
              <CardContent>
                {currentChunk.blobUrl ? (
                  <video
                    controls
                    src={currentChunk.blobUrl}
                    className="w-full rounded-lg"
                  >
                    Your browser does not support video playback
                  </video>
                ) : (
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                    <p className="text-gray-600">Chunk not available</p>
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(currentChunk.blobUrl!, '_blank')}
                    disabled={!currentChunk.blobUrl}
                  >
                    Download Chunk
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Chunk Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Activity During Chunk</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Timeline</h4>
                    <p className="text-sm text-gray-600">
                      Start: {new Date(currentChunk.startTime).toLocaleTimeString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      End: {new Date(currentChunk.endTime).toLocaleTimeString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      Duration: {currentChunk.duration} seconds
                    </p>
                  </div>

                  {currentChunk.metadata && (
                    <>
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Questions Viewed</h4>
                        <div className="flex flex-wrap gap-2">
                          {currentChunk.metadata.questionsViewed?.map((q: number) => (
                            <Badge key={q} variant="secondary">
                              Question {q + 1}
                            </Badge>
                          ))}
                          {(!currentChunk.metadata.questionsViewed ||
                            currentChunk.metadata.questionsViewed.length === 0) && (
                            <p className="text-sm text-gray-500">None</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-sm mb-2">Answers Submitted</h4>
                        <div className="flex flex-wrap gap-2">
                          {currentChunk.metadata.answersSubmitted?.map((q: number) => (
                            <Badge key={q} variant="default">
                              Question {q + 1}
                            </Badge>
                          ))}
                          {(!currentChunk.metadata.answersSubmitted ||
                            currentChunk.metadata.answersSubmitted.length === 0) && (
                            <p className="text-sm text-gray-500">None</p>
                          )}
                        </div>
                      </div>

                      {currentChunk.metadata.flagsCreated &&
                       currentChunk.metadata.flagsCreated.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-sm mb-2">Flags Created</h4>
                          <div className="flex flex-wrap gap-2">
                            {currentChunk.metadata.flagsCreated.map((flagId: string) => (
                              <Badge key={flagId} variant="destructive">
                                Flag {flagId}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <PlayCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Select a chunk to view recording</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
```

**Access Control:**
```typescript
// In page.tsx
const session = await auth.api.getSession({ headers: await headers() });
if (!session) redirect('/auth/signin');

await requirePermission(
  { userId: session.user.id, organizationId: examSession.organizationId },
  Permission.REVIEW_EXAM_SESSIONS
);
```

---

## Error Handling and Edge Cases

### Recording Initialization Failures

**Scenario**: Camera permission denied, MediaRecorder error, device busy

**Handling:**
```typescript
// Required recording (exam.enableRecording && exam.requireRecording)
if (recordingInitError && exam.requireRecording) {
  return (
    <Dialog open={true}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Recording Required</DialogTitle>
          <DialogDescription>
            This exam requires video recording. Recording failed to start:
            {recordingInitError.message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={retryRecording}>Retry Camera</Button>
          <Button variant="outline" onClick={exitExam}>Exit Exam</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Optional recording
if (recordingInitError && !exam.requireRecording) {
  // Show warning banner, allow exam to continue
  // Flag session with recordingStatus: 'failed'
}
```

### Chunk Upload Failures

**Retry Strategy:**
```typescript
async function uploadWithRetry(
  blob: Blob,
  metadata: ChunkMetadata,
  attempt: number = 1
): Promise<void> {
  try {
    await uploadRecordingChunk(sessionId, chunkNumber, formData, metadata);
  } catch (error) {
    if (attempt < 3) {
      // Exponential backoff: 2s, 4s, 8s
      await sleep(Math.pow(2, attempt) * 1000);
      return uploadWithRetry(blob, metadata, attempt + 1);
    } else {
      // Queue in IndexedDB
      await recordingQueue.add({
        id: generateId(),
        sessionId,
        chunkNumber,
        blob,
        metadata,
        timestamp: Date.now(),
        retryCount: 0,
      });
    }
  }
}

// Background retry loop
setInterval(async () => {
  const queuedChunks = await recordingQueue.getAll(sessionId);
  for (const chunk of queuedChunks) {
    if (navigator.onLine) {
      try {
        await uploadRecordingChunk(/* ... */);
        await recordingQueue.remove(chunk.id);
      } catch (error) {
        await recordingQueue.updateRetryCount(chunk.id, chunk.retryCount + 1);
        if (chunk.retryCount >= 10) {
          // Report permanent failure
          await reportChunkFailure(sessionId, chunk.chunkNumber, error.message);
          await recordingQueue.remove(chunk.id);
        }
      }
    }
  }
}, 30000); // Every 30 seconds
```

### Browser/Tab Close During Exam

**beforeunload Handler:**
```typescript
useEffect(() => {
  const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
    const queuedChunks = await recordingQueue.getAll(sessionId);

    if (queuedChunks.length > 0) {
      e.preventDefault();
      e.returnValue = 'You have unsaved recording chunks. Are you sure you want to leave?';

      // Attempt final flush (browser gives limited time)
      await Promise.race([
        flushAllChunks(queuedChunks),
        sleep(3000), // Max 3 seconds
      ]);
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [sessionId]);
```

### Permission Revocation Mid-Exam

**MediaRecorder Error Handler:**
```typescript
mediaRecorder.addEventListener('error', (event) => {
  const error = event.error;

  if (error.name === 'NotAllowedError') {
    // Camera permission revoked
    setRecordingStatus('permission_revoked');

    if (exam.requireRecording) {
      // Pause exam, show modal
      pauseExam();
      showPermissionModal({
        title: 'Camera Permission Lost',
        message: 'Please re-enable camera access to continue.',
        actions: [
          { label: 'Retry', onClick: retryCamera },
          { label: 'Exit', onClick: exitExam },
        ],
      });
    } else {
      // Show warning banner, continue exam
      showWarningBanner('Recording stopped - camera permission revoked');
    }
  }
});
```

### Network Offline Detection

**Online/Offline Handlers:**
```typescript
useEffect(() => {
  const handleOffline = () => {
    setNetworkStatus('offline');
    pauseUploadAttempts();
    showNotification('Offline - recordings will upload when reconnected');
  };

  const handleOnline = () => {
    setNetworkStatus('online');
    resumeUploadAttempts();
    retryQueuedChunks();
    showNotification('Back online - resuming uploads');
  };

  window.addEventListener('offline', handleOffline);
  window.addEventListener('online', handleOnline);

  return () => {
    window.removeEventListener('offline', handleOffline);
    window.removeEventListener('online', handleOnline);
  };
}, []);
```

### Corrupted Chunk Detection

**Validation Before Upload:**
```typescript
mediaRecorder.addEventListener('dataavailable', async (event) => {
  const blob = event.data;

  // Validation checks
  if (blob.size === 0) {
    console.error('Empty chunk generated');
    // Don't upload, but don't block exam
    return;
  }

  if (blob.size < 10000) { // Less than 10KB for 2-3 min video = suspicious
    console.warn('Unusually small chunk:', blob.size);
    // Still attempt upload, let reviewer decide
  }

  // Proceed with upload
  await handleChunkUpload(blob, metadata);
});
```

---

## Implementation Steps

### Phase 5.1: Database and Server Actions (Foundation)

**Files to Create:**
1. Migration: `packages/database/prisma/migrations/YYYYMMDDHHMMSS_add_recording_tables/migration.sql`
2. Server actions: `apps/candidate/app/actions/recordings.ts`

**Files to Modify:**
1. `packages/database/prisma/schema.prisma` - Add SessionRecording, RecordingChunk, modify Organization and ExamSession
2. `apps/reviewer/app/actions/sessions.ts` - Add functions to fetch recording data

**Steps:**
1. Update Prisma schema with new models and fields
2. Run `npm run db:migrate` to create migration
3. Install Vercel Blob: `npm install @vercel/blob`
4. Create recording server actions (initialize, upload, report failure, finalize)
5. Test server actions with mock data
6. Commit: "feat(database): add recording tables and retention policy"

**Estimated**: 2-3 hours

---

### Phase 5.2: Client-Side Recording (Core Functionality)

**Files to Create:**
1. `apps/candidate/app/dashboard/exams/[id]/take/use-recording-manager.ts`
2. `apps/candidate/app/lib/recording-queue.ts`
3. `apps/candidate/app/lib/recording-metadata.ts`

**Files to Modify:**
1. `apps/candidate/app/dashboard/exams/[id]/take/exam-interface.tsx` - Integrate recording
2. `apps/candidate/app/dashboard/exams/[id]/take/page.tsx` - Pass recording props

**Steps:**
1. Create IndexedDB wrapper for failed chunk queue
2. Create useRecordingManager hook with MediaRecorder
3. Implement chunk upload handler with retry logic
4. Integrate recording manager with ExamInterface
5. Add recording status UI (indicator, warnings, modals)
6. Test recording lifecycle (start, chunks, stop, errors)
7. Test retry queue (simulate failures, verify recovery)
8. Commit: "feat(candidate): implement chunked video recording"

**Estimated**: 6-8 hours

---

### Phase 5.3: Reviewer Integration (Visibility)

**Files to Create:**
1. `apps/reviewer/app/dashboard/sessions/[id]/recording-tab.tsx`
2. `apps/reviewer/app/components/recording-status-badge.tsx`

**Files to Modify:**
1. `apps/reviewer/app/dashboard/sessions/page.tsx` - Add recording badges
2. `apps/reviewer/app/dashboard/sessions/[id]/page.tsx` - Add Recording tab

**Steps:**
1. Create recording status badge component
2. Add badges to session list view
3. Create Recording tab component with chunk list
4. Add video player for chunk playback
5. Display chunk metadata (questions, answers, flags)
6. Add missing chunks warnings
7. Test reviewer access to in-progress and completed recordings
8. Commit: "feat(reviewer): add recording playback interface"

**Estimated**: 4-5 hours

---

### Phase 5.4: Error Handling and Polish (Robustness)

**Files to Modify:**
1. `apps/candidate/app/dashboard/exams/[id]/take/use-recording-manager.ts` - Add error handlers
2. `apps/candidate/app/dashboard/exams/[id]/take/exam-interface.tsx` - Add error UI

**Steps:**
1. Implement beforeunload warning for unsaved chunks
2. Add online/offline detection and handling
3. Add permission revocation detection
4. Implement conditional enforcement (required vs optional)
5. Add recording initialization retry flow
6. Test all error scenarios from Section 6
7. Add loading states and user feedback
8. Polish UI/UX (animations, transitions, messaging)
9. Commit: "feat(candidate): add recording error handling"

**Estimated**: 3-4 hours

---

### Total Estimated Time: 15-20 hours

---

## Testing Approach

**Manual Testing Checklist:**

### Happy Path
- [ ] Start exam with recording enabled
- [ ] Verify recording indicator shows "Recording"
- [ ] Navigate through questions, answer some
- [ ] Wait for at least 3 chunks to generate (6-9 minutes)
- [ ] Submit exam
- [ ] Verify all chunks uploaded to Vercel Blob
- [ ] Check database: SessionRecording status = 'completed'
- [ ] View recording as reviewer
- [ ] Play each chunk, verify video quality
- [ ] Check chunk metadata shows correct questions

### Error Scenarios
- [ ] Deny camera permission during pre-exam checks
- [ ] Start exam with required recording, verify blocks
- [ ] Start exam with optional recording, verify warning
- [ ] Disable network mid-exam, verify chunks queue
- [ ] Re-enable network, verify chunks upload
- [ ] Revoke camera permission mid-exam, verify handling
- [ ] Close browser mid-exam, verify beforeunload warning
- [ ] Reopen exam, verify retry of queued chunks
- [ ] Test slow network (Chrome DevTools throttling)
- [ ] Test with multiple browser tabs open (camera busy)

### Edge Cases
- [ ] Very short exam (< 2 minutes, single chunk)
- [ ] Exam exactly 2 minutes (boundary case)
- [ ] Long exam (60+ minutes, many chunks)
- [ ] Switch tabs during exam (camera stays active?)
- [ ] Computer sleep/wake during exam
- [ ] Browser back button during exam
- [ ] Direct URL access to in-progress exam

### Reviewer Experience
- [ ] View session with completed recording
- [ ] View session with in-progress recording (chunks appearing)
- [ ] View session with partial recording (missing chunks)
- [ ] View session with failed recording (all chunks missing)
- [ ] Play video chunks in different browsers
- [ ] Download individual chunks
- [ ] Verify metadata shows correct questions/answers

### Performance
- [ ] Check browser memory usage during 30-min exam
- [ ] Verify IndexedDB doesn't grow indefinitely
- [ ] Test with 10+ concurrent exams (different students)
- [ ] Check Vercel Blob upload speed on slow connection
- [ ] Monitor database query performance with many chunks

---

## Success Criteria

**Phase 5 is complete when:**

✅ Recording starts automatically when exam begins (if enabled)
✅ Video chunks generate every 2-3 minutes
✅ Chunks upload immediately to Vercel Blob
✅ Failed uploads queue in IndexedDB with retry logic
✅ SessionRecording table tracks upload progress accurately
✅ Chunk metadata captures questions viewed and answers submitted
✅ Reviewers can view uploaded chunks while exam in progress
✅ Video player works in reviewer dashboard
✅ Recording gracefully handles all error scenarios:
  - Network failures
  - Camera permission issues
  - Browser close/refresh
  - Device busy errors
✅ Required recording blocks exam start if fails (with retry option)
✅ Optional recording shows warning but allows exam
✅ beforeunload warning prevents accidental data loss
✅ Recording status visible in session list (badges)
✅ No data loss for successfully uploaded chunks
✅ Build completes without errors

---

## Out of Scope for Phase 5

**Explicitly NOT included:**

❌ AI detection or monitoring (foundation only)
❌ Automated flag generation from video
❌ Automated cleanup job for old recordings (field added, job deferred)
❌ Live streaming to reviewers (chunks only)
❌ Real-time alerts for recording failures (session flags only)
❌ Video analytics or statistics
❌ Bandwidth optimization (adaptive bitrate)
❌ Recording compression settings
❌ Multiple camera angles
❌ Screen recording
❌ Audio transcription
❌ Playback speed controls (use browser native)
❌ Video annotations by reviewers

**Future Phases:**
- **Phase 6**: AI monitoring and automated flag generation
- **Phase 7**: Automated cleanup job for retention policy
- **Phase 8**: Advanced proctoring features (screen recording, etc.)

---

## Dependencies and Prerequisites

**Required Before Phase 5:**
- ✅ Phase 4 complete (exam-taking flow with camera preview)
- ✅ Vercel Blob storage configured
- ✅ ExamInterface component exists with timer and navigation
- ✅ PreExamChecks component grants camera permission

**Environment Variables:**
```env
BLOB_READ_WRITE_TOKEN="vercel_blob_..." # Required
```

**npm Packages:**
```json
{
  "@vercel/blob": "^0.15.0"  // Add to apps/candidate and apps/reviewer
}
```

---

## Security Considerations

**Recording Security:**
- Recordings are public on Vercel Blob (URLs are unguessable but not authenticated)
- Consider adding signed URLs for production (future enhancement)
- Chunks use sequential naming for integrity verification

**Access Control:**
- Only candidate can upload their own recordings
- Only reviewers with PROCTOR_REVIEWER role can view recordings
- All server actions validate session ownership
- Chunk sequence numbers prevent replay attacks

**Privacy:**
- Recordings only capture camera (no screen, no audio transcription)
- Metadata limited to exam events (questions, answers)
- No keystroke logging or mouse tracking
- Retention policy enforces data lifecycle

**Data Integrity:**
- Chunk numbers sequential and unique (detect missing chunks)
- Upload status tracked per chunk (visibility into gaps)
- Failed chunks explicitly marked (not silently ignored)
- IndexedDB queue prevents silent data loss

---

## Performance Considerations

**Client-Side:**
- MediaRecorder chunks to prevent memory issues
- IndexedDB for persistent queue (not localStorage)
- Single MediaStream reused (not re-requested)
- Background retry loop throttled (30s interval)

**Server-Side:**
- Vercel Blob handles CDN and storage scaling
- File size limits enforced (50MB per chunk)
- Database indexes on recordingStatus and uploadStatus
- Chunk uploads are independent (parallelizable)

**Storage:**
- 2-3 minute chunks at 720p ≈ 5-15MB per chunk
- 60-minute exam ≈ 20-25 chunks ≈ 100-375MB total
- Retention policy prevents unbounded growth
- Consider video quality settings (future optimization)

**Costs:**
- Vercel Blob storage: ~$0.15/GB/month
- Vercel Blob bandwidth: ~$0.10/GB egress
- Typical 60-min exam: ~$0.02 storage + $0.01 bandwidth = $0.03 total
- 1000 exams/month: ~$30/month (very manageable)

---

## Known Limitations

**Phase 5 Limitations:**
1. No AI detection yet (foundation only)
2. No automated cleanup (manual deletion only)
3. No live streaming (chunks with 2-3 min delay)
4. No recording quality settings (uses browser default)
5. No bandwidth adaptation (fixed bitrate)
6. No screen recording (camera only)
7. Vercel Blob URLs are public (consider signed URLs for production)
8. beforeunload warning can be bypassed (browser limitation)
9. IndexedDB has size limits (~50MB typical, varies by browser)
10. Recording stops if computer sleeps (can't prevent)

**Browser Compatibility:**
- MediaRecorder API: Chrome 49+, Firefox 29+, Safari 14.1+, Edge 79+
- IndexedDB: All modern browsers
- Requires HTTPS (camera access restricted on HTTP)

**Mobile Considerations:**
- Mobile browsers may have stricter camera access policies
- Background recording may be interrupted by OS
- Battery drain from camera + upload
- Consider mobile bandwidth costs for uploads
- May need mobile-specific testing and UX adjustments

---

## Documentation

**Additional docs to create:**
- `docs/recording-architecture.md` - Technical deep dive
- `docs/recording-troubleshooting.md` - Common issues and fixes
- `README-recording.md` - Setup instructions for Vercel Blob

**Code comments:**
- Inline comments for complex retry logic
- JSDoc for useRecordingManager hook
- Server action comments for validation rules

---

## Deployment Notes

**Vercel Blob Setup:**
1. Enable Vercel Blob in project settings
2. Generate read/write token
3. Add token to environment variables
4. Test upload in development first

**Database Migration:**
```bash
npm run db:migrate
# Apply migration: add_recording_tables
```

**Environment Variables:**
```env
# Add to .env and Vercel
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
```

**Monitoring:**
- Monitor Vercel Blob usage dashboard
- Track failed chunk counts in database
- Watch for sessions with recordingStatus: 'partial' or 'failed'
- Set up alerts for high failure rates (future)

---

## Future Enhancements (Post-Phase 5)

**Phase 6 - AI Monitoring:**
- Integrate OpenAI Vision API or AWS Rekognition
- Auto-generate flags for suspicious behavior
- Process chunks as they upload
- Populate metadata with AI detections

**Phase 7 - Cleanup Job:**
- Implement cron job to delete old recordings
- Respect recordingRetentionDays policy
- Protect sessions under review from deletion
- Send warnings before deletion (optional)

**Phase 8 - Advanced Features:**
- Screen recording (separate stream)
- Audio transcription
- Bandwidth adaptation
- Multiple camera angles
- Playback speed controls
- Video annotations

---

## Conclusion

Phase 5 delivers a production-ready chunked recording system that balances reliability, cost, and user experience. By focusing on robust infrastructure over advanced features, it provides a solid foundation for future AI monitoring and proctoring enhancements.

The design prioritizes data integrity (queue and retry), ethical proctoring (standard metadata only), and reviewer efficiency (hybrid access to chunks). All major error scenarios are handled gracefully, and the system degrades appropriately when recording fails.

**Next Steps:**
1. Review and approve this design
2. Set up isolated worktree for Phase 5 development
3. Create detailed implementation plan
4. Execute in 4 sub-phases (5.1 → 5.4)
5. Manual testing against checklist
6. Deploy and monitor
