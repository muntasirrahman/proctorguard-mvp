'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@proctorguard/ui';
import { Button } from '@proctorguard/ui';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { startExamSession } from '@/app/actions/sessions';

type PreExamChecksProps = {
  exam: {
    title: string;
    instructions: string | null;
    duration: number;
    enableRecording: boolean;
    organization: {
      name: string;
    };
  };
  questionCount: number;
  attemptNumber: number;
  enrollmentId: string;
};

export function PreExamChecks({
  exam,
  questionCount,
  attemptNumber,
  enrollmentId,
}: PreExamChecksProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');
  const [browserCheck, setBrowserCheck] = useState<{
    passed: boolean;
    message: string;
  } | null>(null);
  const [agreedToInstructions, setAgreedToInstructions] = useState(false);
  const [agreedToPolicies, setAgreedToPolicies] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<
    'checking' | 'active' | 'denied' | 'not-required'
  >(exam.enableRecording ? 'checking' : 'not-required');
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

  // Check browser compatibility on mount
  useEffect(() => {
    const userAgent = navigator.userAgent;
    let browser = 'Unknown';
    let version = 0;
    let passed = false;

    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      browser = 'Chrome';
      const match = userAgent.match(/Chrome\/(\d+)/);
      version = match ? parseInt(match[1]) : 0;
      passed = version >= 90;
    } else if (userAgent.includes('Firefox')) {
      browser = 'Firefox';
      const match = userAgent.match(/Firefox\/(\d+)/);
      version = match ? parseInt(match[1]) : 0;
      passed = version >= 88;
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      browser = 'Safari';
      const match = userAgent.match(/Version\/(\d+)/);
      version = match ? parseInt(match[1]) : 0;
      passed = version >= 14;
    } else if (userAgent.includes('Edg')) {
      browser = 'Edge';
      const match = userAgent.match(/Edg\/(\d+)/);
      version = match ? parseInt(match[1]) : 0;
      passed = version >= 90;
    }

    setBrowserCheck({
      passed,
      message: passed
        ? `${browser} ${version} detected`
        : `${browser} ${version} is not supported. Please use Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+`,
    });
  }, []);

  // Request camera access if recording enabled
  useEffect(() => {
    if (!exam.enableRecording) return;

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        setVideoStream(stream);
        setCameraStatus('active');
      })
      .catch(() => {
        setCameraStatus('denied');
      });

    // Cleanup: stop camera when component unmounts
    return () => {
      if (videoStream) {
        videoStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [exam.enableRecording]);

  const canBegin =
    browserCheck?.passed &&
    agreedToInstructions &&
    agreedToPolicies &&
    (cameraStatus === 'active' || cameraStatus === 'not-required');

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>{exam.title}</CardTitle>
          <p className="text-sm text-gray-600">{exam.organization.name}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Browser Check */}
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              {browserCheck?.passed ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              Browser Compatibility
            </h3>
            <p className="text-sm text-gray-600">{browserCheck?.message}</p>
          </div>

          {/* Instructions */}
          <div>
            <h3 className="font-semibold mb-2">Exam Instructions</h3>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm mb-2">
                <strong>Duration:</strong> {exam.duration} minutes
              </p>
              <p className="text-sm mb-2">
                <strong>Questions:</strong> {questionCount}
              </p>
              <p className="text-sm mb-2">
                <strong>Attempt:</strong> {attemptNumber}
              </p>
              {exam.enableRecording && (
                <p className="text-sm mb-2">
                  <strong>Proctoring:</strong> Camera recording enabled
                </p>
              )}
              {exam.instructions && (
                <div className="mt-4 text-sm whitespace-pre-wrap">
                  {exam.instructions}
                </div>
              )}
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToInstructions}
                onChange={(e) => setAgreedToInstructions(e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-sm">
                I have read and understood the exam instructions
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer mt-2">
              <input
                type="checkbox"
                checked={agreedToPolicies}
                onChange={(e) => setAgreedToPolicies(e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-sm">
                I agree to the exam policies and academic integrity guidelines
              </span>
            </label>
          </div>

          {/* Camera Check */}
          {exam.enableRecording && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                {cameraStatus === 'active' && (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                )}
                {cameraStatus === 'denied' && (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                Camera Check
              </h3>
              {cameraStatus === 'checking' && (
                <p className="text-sm text-gray-600">Requesting camera access...</p>
              )}
              {cameraStatus === 'active' && (
                <div>
                  <video
                    ref={(video) => {
                      if (video && videoStream) {
                        video.srcObject = videoStream;
                        video.play();
                      }
                    }}
                    className="w-48 h-36 bg-black rounded-lg mb-2"
                    muted
                  />
                  <p className="text-sm text-green-600">Camera is active ✓</p>
                </div>
              )}
              {cameraStatus === 'denied' && (
                <p className="text-sm text-red-600">
                  Camera access required. Please enable in browser settings.
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button
              onClick={async () => {
                if (sessionId) {
                  await startExamSession(sessionId);
                  router.push(`/dashboard/exams/${enrollmentId}/take?session=${sessionId}`);
                  router.refresh();
                }
              }}
              disabled={!canBegin}
              size="lg"
              className="flex-1"
            >
              Begin Exam
            </Button>
            <Button onClick={() => router.push('/dashboard/exams')} variant="outline" size="lg">
              Exit to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
