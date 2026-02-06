# Author Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the author dashboard with question bank management and question editor supporting MCQ, true/false, and essay questions.

**Architecture:** Server Components for data fetching, Server Actions for mutations, separate pages for question editing, permission checks ensuring authors only access their own content.

**Tech Stack:** Next.js 16, React 19, Prisma, Better Auth, shadcn/ui (Radix), Tailwind CSS

**Note:** No test infrastructure exists in this project. Steps focus on implementation with manual verification.

---

## Task 1: Add Missing UI Components

We need Select, Textarea, and RadioGroup components.

**Files:**
- Create: `packages/ui/components/select.tsx`
- Create: `packages/ui/components/textarea.tsx`
- Create: `packages/ui/components/radio-group.tsx`
- Modify: `packages/ui/index.tsx`

**Step 1: Create Select component**

Create `packages/ui/components/select.tsx`:

```tsx
'use client';

import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../lib/utils';

const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn('flex cursor-default items-center justify-center py-1', className)}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn('flex cursor-default items-center justify-center py-1', className)}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        'relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        position === 'popper' &&
          'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          'p-1',
          position === 'popper' &&
            'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]'
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn('py-1.5 pl-8 pr-2 text-sm font-semibold', className)}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-muted', className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
```

**Step 2: Create Textarea component**

Create `packages/ui/components/textarea.tsx`:

```tsx
import * as React from 'react';
import { cn } from '../lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
```

**Step 3: Create RadioGroup component**

Create `packages/ui/components/radio-group.tsx`:

```tsx
'use client';

import * as React from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { Circle } from 'lucide-react';
import { cn } from '../lib/utils';

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return <RadioGroupPrimitive.Root className={cn('grid gap-2', className)} {...props} ref={ref} />;
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        'aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle className="h-2.5 w-2.5 fill-current text-current" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export { RadioGroup, RadioGroupItem };
```

**Step 4: Update UI package exports**

Modify `packages/ui/index.tsx` to add new exports after line 10:

```tsx
export * from './components/select';
export * from './components/textarea';
export * from './components/radio-group';
```

**Step 5: Verify build**

Run: `npm run build --filter=@proctorguard/ui`
Expected: Build succeeds

**Step 6: Commit**

```bash
git add packages/ui/
git commit -m "feat(ui): add Select, Textarea, RadioGroup components

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Create Server Actions for Question Banks

**Files:**
- Create: `apps/author/app/actions/question-banks.ts`

**Step 1: Create question bank actions**

Create `apps/author/app/actions/question-banks.ts`:

```typescript
'use server';

import { auth } from '@proctorguard/auth';
import { prisma, QuestionBankStatus } from '@proctorguard/database';
import { requirePermission, Permission } from '@proctorguard/permissions';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function getQuestionBanks() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  const banks = await prisma.questionBank.findMany({
    where: { authorId: session.user.id },
    include: {
      _count: {
        select: { questions: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return banks.map((bank) => ({
    id: bank.id,
    title: bank.title,
    description: bank.description,
    status: bank.status,
    tags: bank.tags,
    questionCount: bank._count.questions,
    createdAt: bank.createdAt,
    updatedAt: bank.updatedAt,
  }));
}

export async function getQuestionBank(bankId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  const bank = await prisma.questionBank.findUnique({
    where: { id: bankId },
  });

  if (!bank) throw new Error('Question bank not found');
  if (bank.authorId !== session.user.id) throw new Error('Access denied');

  return bank;
}

export async function createQuestionBank(data: {
  title: string;
  description?: string;
  tags?: string[];
  status: QuestionBankStatus;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  const membership = await prisma.organizationMember.findFirst({
    where: { userId: session.user.id },
  });

  if (!membership) throw new Error('No organization found');

  await requirePermission(
    { userId: session.user.id, organizationId: membership.organizationId },
    Permission.CREATE_QUESTION_BANK
  );

  if (!data.title.trim()) {
    throw new Error('Title is required');
  }

  const bank = await prisma.questionBank.create({
    data: {
      title: data.title.trim(),
      description: data.description?.trim() || null,
      tags: data.tags || [],
      status: data.status,
      authorId: session.user.id,
      organizationId: membership.organizationId,
    },
  });

  revalidatePath('/dashboard');
  return bank;
}

export async function updateQuestionBank(
  bankId: string,
  data: {
    title?: string;
    description?: string;
    tags?: string[];
    status?: QuestionBankStatus;
  }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  const bank = await prisma.questionBank.findUnique({
    where: { id: bankId },
  });

  if (!bank) throw new Error('Question bank not found');
  if (bank.authorId !== session.user.id) throw new Error('Access denied');

  await requirePermission(
    { userId: session.user.id, organizationId: bank.organizationId },
    Permission.EDIT_QUESTION_BANK
  );

  if (data.title !== undefined && !data.title.trim()) {
    throw new Error('Title cannot be empty');
  }

  const updated = await prisma.questionBank.update({
    where: { id: bankId },
    data: {
      ...(data.title !== undefined && { title: data.title.trim() }),
      ...(data.description !== undefined && { description: data.description.trim() || null }),
      ...(data.tags !== undefined && { tags: data.tags }),
      ...(data.status !== undefined && { status: data.status }),
    },
  });

  revalidatePath('/dashboard');
  revalidatePath(`/dashboard/banks/${bankId}`);
  return updated;
}

export async function deleteQuestionBank(bankId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  const bank = await prisma.questionBank.findUnique({
    where: { id: bankId },
    include: {
      _count: {
        select: { questions: true },
      },
    },
  });

  if (!bank) throw new Error('Question bank not found');
  if (bank.authorId !== session.user.id) throw new Error('Access denied');

  if (bank._count.questions > 0) {
    throw new Error(`Cannot delete question bank with ${bank._count.questions} questions`);
  }

  await requirePermission(
    { userId: session.user.id, organizationId: bank.organizationId },
    Permission.DELETE_QUESTION_BANK
  );

  await prisma.questionBank.delete({
    where: { id: bankId },
  });

  revalidatePath('/dashboard');
  return { success: true };
}
```

**Step 2: Commit**

```bash
git add apps/author/app/actions/question-banks.ts
git commit -m "feat(author): add question bank server actions

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Build Question Bank List Page

**Files:**
- Modify: `apps/author/app/dashboard/page.tsx`
- Create: `apps/author/app/dashboard/bank-dialog.tsx`

**Step 1: Create bank dialog component**

Create `apps/author/app/dashboard/bank-dialog.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { QuestionBankStatus } from '@proctorguard/database';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  Button,
  Input,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@proctorguard/ui';
import { createQuestionBank, updateQuestionBank, deleteQuestionBank } from '../actions/question-banks';

interface CreateBankDialogProps {
  onSuccess?: () => void;
}

export function CreateBankDialog({ onSuccess }: CreateBankDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState<QuestionBankStatus>('DRAFT');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await createQuestionBank({
        title,
        description: description || undefined,
        tags: tags ? tags.split(',').map((t) => t.trim()) : undefined,
        status,
      });
      setOpen(false);
      setTitle('');
      setDescription('');
      setTags('');
      setStatus('DRAFT');
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create question bank');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Question Bank</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Question Bank</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated, optional)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="math, algebra, calculus"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as QuestionBankStatus)}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="IN_REVIEW">In Review</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface EditBankDialogProps {
  bank: {
    id: string;
    title: string;
    description: string | null;
    tags: string[];
    status: QuestionBankStatus;
    questionCount: number;
  };
  onSuccess?: () => void;
}

export function EditBankDialog({ bank, onSuccess }: EditBankDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(bank.title);
  const [description, setDescription] = useState(bank.description || '');
  const [tags, setTags] = useState(bank.tags.join(', '));
  const [status, setStatus] = useState<QuestionBankStatus>(bank.status);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await updateQuestionBank(bank.id, {
        title,
        description,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        status,
      });
      setOpen(false);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update question bank');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${bank.title}"?`)) return;
    setError('');
    setDeleting(true);

    try {
      await deleteQuestionBank(bank.id);
      setOpen(false);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete question bank');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Question Bank</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description (optional)</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-tags">Tags (comma-separated, optional)</Label>
            <Input
              id="edit-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="math, algebra, calculus"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as QuestionBankStatus)}>
              <SelectTrigger id="edit-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="IN_REVIEW">In Review</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting || bank.questionCount > 0}
              title={bank.questionCount > 0 ? 'Cannot delete bank with questions' : undefined}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !title.trim()}>
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 2: Create question bank list page**

Replace `apps/author/app/dashboard/page.tsx`:

```tsx
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
} from '@proctorguard/ui';
import Link from 'next/link';
import { getQuestionBanks } from '../actions/question-banks';
import { CreateBankDialog, EditBankDialog } from './bank-dialog';
import { QuestionBankStatus } from '@proctorguard/database';

const STATUS_COLORS: Record<QuestionBankStatus, 'default' | 'secondary' | 'outline'> = {
  DRAFT: 'outline',
  IN_REVIEW: 'secondary',
  APPROVED: 'default',
  ARCHIVED: 'outline',
};

export default async function DashboardPage() {
  const banks = await getQuestionBanks();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Question Banks</h1>
          <p className="text-muted-foreground">Manage your question banks and questions</p>
        </div>
        <CreateBankDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Question Banks</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Questions</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {banks.map((bank) => (
                <TableRow key={bank.id} className="cursor-pointer">
                  <TableCell className="font-medium">
                    <Link href={`/dashboard/banks/${bank.id}`} className="hover:underline">
                      {bank.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_COLORS[bank.status]}>
                      {bank.status.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>{bank.questionCount}</TableCell>
                  <TableCell>{new Date(bank.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <EditBankDialog bank={bank} />
                  </TableCell>
                </TableRow>
              ))}
              {banks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No question banks yet. Create your first one to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add apps/author/app/dashboard/
git commit -m "feat(author): add question bank list page with CRUD dialogs

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Create Server Actions for Questions

**Files:**
- Create: `apps/author/app/actions/questions.ts`

**Step 1: Create question actions**

Create `apps/author/app/actions/questions.ts`:

```typescript
'use server';

import { auth } from '@proctorguard/auth';
import { prisma, Difficulty, QuestionStatus } from '@proctorguard/database';
import { requirePermission, Permission } from '@proctorguard/permissions';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function getQuestions(bankId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  const bank = await prisma.questionBank.findUnique({
    where: { id: bankId },
  });

  if (!bank) throw new Error('Question bank not found');
  if (bank.authorId !== session.user.id) throw new Error('Access denied');

  const questions = await prisma.question.findMany({
    where: { questionBankId: bankId },
    orderBy: { createdAt: 'desc' },
  });

  return questions;
}

export async function getQuestion(questionId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: { questionBank: true },
  });

  if (!question) throw new Error('Question not found');
  if (question.questionBank.authorId !== session.user.id) throw new Error('Access denied');

  return question;
}

export async function createQuestion(
  bankId: string,
  data: {
    type: string;
    text: string;
    difficulty: Difficulty;
    points: number;
    timeLimit?: number;
    explanation?: string;
    status: QuestionStatus;
    tags?: string[];
    options?: Record<string, string>;
    correctAnswer?: string | boolean;
  }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  const bank = await prisma.questionBank.findUnique({
    where: { id: bankId },
  });

  if (!bank) throw new Error('Question bank not found');
  if (bank.authorId !== session.user.id) throw new Error('Access denied');

  await requirePermission(
    { userId: session.user.id, organizationId: bank.organizationId },
    Permission.CREATE_QUESTION
  );

  if (!data.text.trim()) {
    throw new Error('Question text is required');
  }

  if (data.points < 1) {
    throw new Error('Points must be at least 1');
  }

  // Validate type-specific data
  if (data.type === 'multiple_choice') {
    if (!data.options || Object.keys(data.options).length !== 5) {
      throw new Error('Multiple choice questions must have exactly 5 options (A-E)');
    }
    if (!data.correctAnswer || !['A', 'B', 'C', 'D', 'E'].includes(data.correctAnswer as string)) {
      throw new Error('Multiple choice questions must have a correct answer (A-E)');
    }
  }

  if (data.type === 'true_false') {
    if (typeof data.correctAnswer !== 'boolean') {
      throw new Error('True/false questions must have a boolean correct answer');
    }
  }

  const question = await prisma.question.create({
    data: {
      questionBankId: bankId,
      type: data.type,
      text: data.text.trim(),
      difficulty: data.difficulty,
      points: data.points,
      timeLimit: data.timeLimit || null,
      explanation: data.explanation?.trim() || null,
      status: data.status,
      tags: data.tags || [],
      options: data.options || null,
      correctAnswer: data.correctAnswer !== undefined ? data.correctAnswer : null,
    },
  });

  revalidatePath(`/dashboard/banks/${bankId}`);
  return question;
}

export async function updateQuestion(
  questionId: string,
  data: {
    type?: string;
    text?: string;
    difficulty?: Difficulty;
    points?: number;
    timeLimit?: number | null;
    explanation?: string | null;
    status?: QuestionStatus;
    tags?: string[];
    options?: Record<string, string> | null;
    correctAnswer?: string | boolean | null;
  }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: { questionBank: true },
  });

  if (!question) throw new Error('Question not found');
  if (question.questionBank.authorId !== session.user.id) throw new Error('Access denied');

  await requirePermission(
    { userId: session.user.id, organizationId: question.questionBank.organizationId },
    Permission.EDIT_QUESTION
  );

  if (data.text !== undefined && !data.text.trim()) {
    throw new Error('Question text cannot be empty');
  }

  if (data.points !== undefined && data.points < 1) {
    throw new Error('Points must be at least 1');
  }

  const updated = await prisma.question.update({
    where: { id: questionId },
    data: {
      ...(data.type !== undefined && { type: data.type }),
      ...(data.text !== undefined && { text: data.text.trim() }),
      ...(data.difficulty !== undefined && { difficulty: data.difficulty }),
      ...(data.points !== undefined && { points: data.points }),
      ...(data.timeLimit !== undefined && { timeLimit: data.timeLimit }),
      ...(data.explanation !== undefined && { explanation: data.explanation?.trim() || null }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.tags !== undefined && { tags: data.tags }),
      ...(data.options !== undefined && { options: data.options }),
      ...(data.correctAnswer !== undefined && { correctAnswer: data.correctAnswer }),
    },
  });

  revalidatePath(`/dashboard/banks/${question.questionBankId}`);
  revalidatePath(`/dashboard/banks/${question.questionBankId}/questions/${questionId}`);
  return updated;
}

export async function deleteQuestion(questionId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: { questionBank: true },
  });

  if (!question) throw new Error('Question not found');
  if (question.questionBank.authorId !== session.user.id) throw new Error('Access denied');

  await requirePermission(
    { userId: session.user.id, organizationId: question.questionBank.organizationId },
    Permission.DELETE_QUESTION
  );

  await prisma.question.delete({
    where: { id: questionId },
  });

  revalidatePath(`/dashboard/banks/${question.questionBankId}`);
  return { success: true };
}
```

**Step 2: Commit**

```bash
git add apps/author/app/actions/questions.ts
git commit -m "feat(author): add question management server actions

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Build Question List Page

**Files:**
- Create: `apps/author/app/dashboard/banks/[id]/page.tsx`

**Step 1: Create question list page**

Create `apps/author/app/dashboard/banks/[id]/page.tsx`:

```tsx
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Button,
} from '@proctorguard/ui';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getQuestionBank } from '../../../actions/question-banks';
import { getQuestions, deleteQuestion } from '../../../actions/questions';
import { Difficulty, QuestionStatus } from '@proctorguard/database';

const STATUS_COLORS: Record<QuestionStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  DRAFT: 'outline',
  IN_REVIEW: 'secondary',
  APPROVED: 'default',
  REJECTED: 'destructive',
  ARCHIVED: 'outline',
};

const DIFFICULTY_COLORS: Record<Difficulty, 'default' | 'secondary' | 'destructive'> = {
  EASY: 'secondary',
  MEDIUM: 'default',
  HARD: 'destructive',
};

const QUESTION_TYPE_LABELS: Record<string, string> = {
  multiple_choice: 'MCQ',
  true_false: 'True/False',
  essay: 'Essay',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function QuestionListPage({ params }: PageProps) {
  const { id } = await params;
  const bank = await getQuestionBank(id);
  const questions = await getQuestions(id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{bank.title}</h1>
            <Badge variant={STATUS_COLORS[bank.status]}>
              {bank.status.replace(/_/g, ' ')}
            </Badge>
          </div>
          {bank.description && (
            <p className="text-muted-foreground">{bank.description}</p>
          )}
        </div>
        <Link href={`/dashboard/banks/${id}/questions/new`}>
          <Button>Create Question</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Question</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.map((question) => (
                <TableRow key={question.id}>
                  <TableCell>
                    <Badge variant="outline">
                      {QUESTION_TYPE_LABELS[question.type] || question.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-md truncate">
                    {question.text}
                  </TableCell>
                  <TableCell>
                    <Badge variant={DIFFICULTY_COLORS[question.difficulty]}>
                      {question.difficulty}
                    </Badge>
                  </TableCell>
                  <TableCell>{question.points}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_COLORS[question.status]}>
                      {question.status.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Link href={`/dashboard/banks/${id}/questions/${question.id}`}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {questions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No questions yet. Create your first question to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/author/app/dashboard/banks/
git commit -m "feat(author): add question list page

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Build Question Editor Page

**Files:**
- Create: `apps/author/app/dashboard/banks/[id]/questions/[qid]/page.tsx`
- Create: `apps/author/app/dashboard/banks/[id]/questions/new/page.tsx`
- Create: `apps/author/app/dashboard/banks/[id]/questions/question-form.tsx`

**Step 1: Create question form component**

Create `apps/author/app/dashboard/banks/[id]/questions/question-form.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Difficulty, QuestionStatus } from '@proctorguard/database';
import {
  Button,
  Input,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  RadioGroup,
  RadioGroupItem,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@proctorguard/ui';
import { createQuestion, updateQuestion, deleteQuestion } from '../../../../actions/questions';

interface QuestionFormProps {
  bankId: string;
  question?: {
    id: string;
    type: string;
    text: string;
    difficulty: Difficulty;
    points: number;
    timeLimit: number | null;
    explanation: string | null;
    status: QuestionStatus;
    tags: string[];
    options: any;
    correctAnswer: any;
  };
  mode: 'create' | 'edit';
}

export function QuestionForm({ bankId, question, mode }: QuestionFormProps) {
  const router = useRouter();
  const [type, setType] = useState(question?.type || 'multiple_choice');
  const [text, setText] = useState(question?.text || '');
  const [difficulty, setDifficulty] = useState<Difficulty>(question?.difficulty || 'MEDIUM');
  const [points, setPoints] = useState(question?.points || 1);
  const [timeLimit, setTimeLimit] = useState(question?.timeLimit?.toString() || '');
  const [explanation, setExplanation] = useState(question?.explanation || '');
  const [status, setStatus] = useState<QuestionStatus>(question?.status || 'DRAFT');
  const [tags, setTags] = useState(question?.tags?.join(', ') || '');

  // MCQ fields
  const [optionA, setOptionA] = useState(question?.options?.A || '');
  const [optionB, setOptionB] = useState(question?.options?.B || '');
  const [optionC, setOptionC] = useState(question?.options?.C || '');
  const [optionD, setOptionD] = useState(question?.options?.D || '');
  const [optionE, setOptionE] = useState(question?.options?.E || '');
  const [mcqAnswer, setMcqAnswer] = useState(question?.correctAnswer || 'A');

  // True/False field
  const [tfAnswer, setTfAnswer] = useState(
    question?.correctAnswer !== undefined ? String(question.correctAnswer) : 'true'
  );

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSubmit = async (action: 'save' | 'save-close') => {
    setError('');
    setLoading(true);

    try {
      const data = {
        type,
        text,
        difficulty,
        points,
        timeLimit: timeLimit ? parseInt(timeLimit) : undefined,
        explanation: explanation || undefined,
        status,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        options:
          type === 'multiple_choice'
            ? { A: optionA, B: optionB, C: optionC, D: optionD, E: optionE }
            : undefined,
        correctAnswer:
          type === 'multiple_choice'
            ? mcqAnswer
            : type === 'true_false'
              ? tfAnswer === 'true'
              : undefined,
      };

      if (mode === 'create') {
        await createQuestion(bankId, data);
      } else {
        await updateQuestion(question!.id, data);
      }

      if (action === 'save-close') {
        router.push(`/dashboard/banks/${bankId}`);
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save question');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!question) return;
    if (!confirm('Are you sure you want to delete this question?')) return;

    setError('');
    setDeleting(true);

    try {
      await deleteQuestion(question.id);
      router.push(`/dashboard/banks/${bankId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete question');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-destructive/15 text-destructive px-4 py-3 rounded">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Question Type</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={type} onValueChange={setType}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="multiple_choice" id="type-mcq" />
              <Label htmlFor="type-mcq">Multiple Choice</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true_false" id="type-tf" />
              <Label htmlFor="type-tf">True/False</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="essay" id="type-essay" />
              <Label htmlFor="type-essay">Essay</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Question Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="text">Question Text</Label>
            <Textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
                <SelectTrigger id="difficulty">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EASY">Easy</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HARD">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="points">Points</Label>
              <Input
                id="points"
                type="number"
                value={points}
                onChange={(e) => setPoints(parseInt(e.target.value))}
                min={1}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeLimit">Time Limit (seconds, optional)</Label>
            <Input
              id="timeLimit"
              type="number"
              value={timeLimit}
              onChange={(e) => setTimeLimit(e.target.value)}
              placeholder="Leave empty for no limit"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="explanation">Explanation (optional)</Label>
            <Textarea
              id="explanation"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows={3}
              placeholder="Shown to students after answering"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as QuestionStatus)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="IN_REVIEW">In Review</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated, optional)</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="algebra, equations"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {type === 'multiple_choice' && (
        <Card>
          <CardHeader>
            <CardTitle>Multiple Choice Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="optionA">Option A</Label>
              <Input
                id="optionA"
                value={optionA}
                onChange={(e) => setOptionA(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="optionB">Option B</Label>
              <Input
                id="optionB"
                value={optionB}
                onChange={(e) => setOptionB(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="optionC">Option C</Label>
              <Input
                id="optionC"
                value={optionC}
                onChange={(e) => setOptionC(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="optionD">Option D</Label>
              <Input
                id="optionD"
                value={optionD}
                onChange={(e) => setOptionD(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="optionE">Option E</Label>
              <Input
                id="optionE"
                value={optionE}
                onChange={(e) => setOptionE(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Correct Answer</Label>
              <RadioGroup value={mcqAnswer} onValueChange={setMcqAnswer}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="A" id="answer-a" />
                  <Label htmlFor="answer-a">A</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="B" id="answer-b" />
                  <Label htmlFor="answer-b">B</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="C" id="answer-c" />
                  <Label htmlFor="answer-c">C</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="D" id="answer-d" />
                  <Label htmlFor="answer-d">D</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="E" id="answer-e" />
                  <Label htmlFor="answer-e">E</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>
      )}

      {type === 'true_false' && (
        <Card>
          <CardHeader>
            <CardTitle>Correct Answer</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={tfAnswer} onValueChange={setTfAnswer}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id="answer-true" />
                <Label htmlFor="answer-true">True</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="answer-false" />
                <Label htmlFor="answer-false">False</Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/dashboard/banks/${bankId}`)}>
            Cancel
          </Button>
          {mode === 'edit' && (
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleSubmit('save')} disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
          <Button onClick={() => handleSubmit('save-close')} disabled={loading}>
            {loading ? 'Saving...' : 'Save & Close'}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Create new question page**

Create `apps/author/app/dashboard/banks/[id]/questions/new/page.tsx`:

```tsx
import { Button } from '@proctorguard/ui';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getQuestionBank } from '../../../../../actions/question-banks';
import { QuestionForm } from '../question-form';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function NewQuestionPage({ params }: PageProps) {
  const { id } = await params;
  const bank = await getQuestionBank(id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/banks/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Create Question</h1>
          <p className="text-muted-foreground">in {bank.title}</p>
        </div>
      </div>

      <QuestionForm bankId={id} mode="create" />
    </div>
  );
}
```

**Step 3: Create edit question page**

Create `apps/author/app/dashboard/banks/[id]/questions/[qid]/page.tsx`:

```tsx
import { Button } from '@proctorguard/ui';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getQuestion } from '../../../../../actions/questions';
import { QuestionForm } from '../question-form';

interface PageProps {
  params: Promise<{ id: string; qid: string }>;
}

export default async function EditQuestionPage({ params }: PageProps) {
  const { id, qid } = await params;
  const question = await getQuestion(qid);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/banks/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Question</h1>
          <p className="text-muted-foreground">in {question.questionBank.title}</p>
        </div>
      </div>

      <QuestionForm bankId={id} question={question} mode="edit" />
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add apps/author/app/dashboard/banks/
git commit -m "feat(author): add question editor with MCQ, true/false, essay support

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Update Navigation

**Files:**
- Modify: `apps/author/app/dashboard/layout.tsx`

**Step 1: Simplify nav items**

Update `apps/author/app/dashboard/layout.tsx`:

```tsx
import { auth } from '@proctorguard/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@proctorguard/ui';

const navItems = [
  { label: 'Question Banks', href: '/dashboard', icon: 'Library' },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/auth/signin');

  return (
    <DashboardShell appName="Author" navItems={navItems}>
      {children}
    </DashboardShell>
  );
}
```

**Step 2: Commit**

```bash
git add apps/author/app/dashboard/layout.tsx
git commit -m "feat(author): simplify navigation

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Final Verification

**Step 1: Run full build**

Run: `npm run build`
Expected: All apps build successfully

**Step 2: Manual testing on port 4000+**

Run: `PORT=4003 npm run dev:author`
Navigate to: http://localhost:4003/dashboard

Test each feature:
- [ ] Question banks list displays
- [ ] Create question bank works
- [ ] Edit/delete question bank works
- [ ] Click bank navigates to question list
- [ ] Create question (MCQ with 5 options) works
- [ ] Create true/false question works
- [ ] Create essay question works
- [ ] Edit question works
- [ ] Save & Close returns to list
- [ ] Delete question works

**Step 3: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix(author): address any issues from testing"
```

---

## Summary

8 main implementation tasks:
1. Add UI components (Select, Textarea, RadioGroup)
2. Question bank server actions
3. Question bank list page with CRUD dialogs
4. Question server actions
5. Question list page
6. Question editor with type-specific fields
7. Update navigation
8. Final verification

Total estimated time: 3-4 hours of focused implementation.
