'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
} from '@proctorguard/ui';
import { createExam, updateExam, type CreateExamInput } from '../../actions/exams/exams';
import { Loader2 } from 'lucide-react';

type ExamFormProps = {
  questionBanks: Array<{
    id: string;
    title: string;
    description: string | null;
    _count: { questions: number };
  }>;
  departments: Array<{
    id: string;
    name: string;
  }>;
  initialData?: CreateExamInput & { id: string };
  mode: 'create' | 'edit';
};

export function ExamForm({ questionBanks, departments, initialData, mode }: ExamFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateExamInput>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    departmentId: initialData?.departmentId || undefined,
    questionBankId: initialData?.questionBankId || '',
    duration: initialData?.duration || 60,
    passingScore: initialData?.passingScore || 70,
    allowedAttempts: initialData?.allowedAttempts || 1,
    scheduledStart: initialData?.scheduledStart,
    scheduledEnd: initialData?.scheduledEnd,
    enableRecording: initialData?.enableRecording ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (mode === 'create') {
        await createExam(formData);
      } else if (initialData) {
        await updateExam({ ...formData, id: initialData.id });
      }
      // Redirect handled by server action
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save exam');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        {error && (
          <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>General exam details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="e.g., Mid-Term Assessment"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select
                value={formData.departmentId || 'none'}
                onValueChange={(value) =>
                  setFormData({ ...formData, departmentId: value === 'none' ? undefined : value })
                }
              >
                <SelectTrigger id="department">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No department</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="questionBank">Question Bank *</Label>
              <Select
                value={formData.questionBankId}
                onValueChange={(value) => setFormData({ ...formData, questionBankId: value })}
                required
              >
                <SelectTrigger id="questionBank">
                  <SelectValue placeholder="Select question bank" />
                </SelectTrigger>
                <SelectContent>
                  {questionBanks.map((bank) => (
                    <SelectItem key={bank.id} value={bank.id}>
                      {bank.title} ({bank._count.questions} questions)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Exam parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes) *</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="passingScore">Passing Score (%) *</Label>
                <Input
                  id="passingScore"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.passingScore}
                  onChange={(e) =>
                    setFormData({ ...formData, passingScore: parseInt(e.target.value) })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="allowedAttempts">Allowed Attempts *</Label>
                <Input
                  id="allowedAttempts"
                  type="number"
                  min="1"
                  value={formData.allowedAttempts}
                  onChange={(e) =>
                    setFormData({ ...formData, allowedAttempts: parseInt(e.target.value) })
                  }
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Schedule</CardTitle>
            <CardDescription>When the exam will be available</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduledStart">Start Date & Time</Label>
                <Input
                  id="scheduledStart"
                  type="datetime-local"
                  value={
                    formData.scheduledStart
                      ? new Date(formData.scheduledStart).toISOString().slice(0, 16)
                      : ''
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      scheduledStart: e.target.value ? new Date(e.target.value) : undefined,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduledEnd">End Date & Time</Label>
                <Input
                  id="scheduledEnd"
                  type="datetime-local"
                  value={
                    formData.scheduledEnd
                      ? new Date(formData.scheduledEnd).toISOString().slice(0, 16)
                      : ''
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      scheduledEnd: e.target.value ? new Date(e.target.value) : undefined,
                    })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Proctoring</CardTitle>
            <CardDescription>Recording and monitoring settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enableRecording">Enable Recording</Label>
                <p className="text-sm text-muted-foreground">
                  Record candidate via webcam during exam
                </p>
              </div>
              <Checkbox
                id="enableRecording"
                checked={formData.enableRecording}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, enableRecording: !!checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'create' ? 'Create Exam' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </form>
  );
}
