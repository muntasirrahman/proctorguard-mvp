'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@proctorguard/ui';
import { QuestionBankStatus } from '@proctorguard/database';
import { createQuestionBank, updateQuestionBank } from '../actions/question-banks';

interface BankDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  bank?: {
    id: string;
    title: string;
    description: string | null;
    tags: string[];
    status: QuestionBankStatus;
  };
}

export function BankDialog({ open, onOpenChange, organizationId, bank }: BankDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: bank?.title || '',
    description: bank?.description || '',
    tags: bank?.tags.join(', ') || '',
    status: bank?.status || QuestionBankStatus.DRAFT
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = {
        title: formData.title,
        description: formData.description || null,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        status: formData.status,
        organizationId
      };

      if (bank) {
        await updateQuestionBank(bank.id, data);
      } else {
        await createQuestionBank(data);
      }

      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{bank ? 'Edit Question Bank' : 'Create Question Bank'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={e => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="e.g. math, algebra, advanced"
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={value => setFormData(prev => ({ ...prev, status: value as QuestionBankStatus }))}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={QuestionBankStatus.DRAFT}>Draft</SelectItem>
                <SelectItem value={QuestionBankStatus.IN_REVIEW}>In Review</SelectItem>
                <SelectItem value={QuestionBankStatus.APPROVED}>Approved</SelectItem>
                <SelectItem value={QuestionBankStatus.ARCHIVED}>Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : bank ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
