'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Card,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@proctorguard/ui';
import { QuestionBankStatus } from '@proctorguard/database';
import { BankDialog } from './bank-dialog';
import { deleteQuestionBank } from '../../actions/questions/questionBanks';

interface Bank {
  id: string;
  title: string;
  description: string | null;
  status: QuestionBankStatus;
  tags: string[];
  questionCount: number;
  createdAt: Date;
}

interface QuestionBankListProps {
  banks: Bank[];
  organizationId: string;
}

export function QuestionBankList({ banks, organizationId }: QuestionBankListProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredBanks = banks.filter(bank => {
    const matchesSearch = bank.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || bank.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleEdit = (bank: Bank) => {
    setEditingBank(bank);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingBank(null);
    setDialogOpen(true);
  };

  const handleDelete = async (bankId: string) => {
    // TODO: Replace browser confirm/alert with inline error handling (Dialog + toast) for consistency
    if (!confirm('Are you sure you want to delete this question bank?')) return;

    setDeletingId(bankId);
    try {
      await deleteQuestionBank(bankId);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete question bank');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: QuestionBankStatus) => {
    const colors: Record<QuestionBankStatus, string> = {
      [QuestionBankStatus.DRAFT]: 'bg-gray-100 text-gray-800',
      [QuestionBankStatus.IN_REVIEW]: 'bg-yellow-100 text-yellow-800',
      [QuestionBankStatus.APPROVED]: 'bg-green-100 text-green-800',
      [QuestionBankStatus.ARCHIVED]: 'bg-gray-100 text-gray-600'
    };

    return (
      <Badge className={colors[status]}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Question Banks</h1>
        <Button onClick={handleCreate}>Create Question Bank</Button>
      </div>

      <Card className="p-4">
        <div className="flex gap-4 mb-4">
          <Input
            placeholder="Search by name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value={QuestionBankStatus.DRAFT}>Draft</SelectItem>
              <SelectItem value={QuestionBankStatus.IN_REVIEW}>In Review</SelectItem>
              <SelectItem value={QuestionBankStatus.APPROVED}>Approved</SelectItem>
              <SelectItem value={QuestionBankStatus.ARCHIVED}>Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredBanks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {banks.length === 0 ? (
              <>
                <p className="text-lg font-medium mb-2">No question banks yet</p>
                <p className="text-sm">Create your first question bank to get started</p>
              </>
            ) : (
              <p>No question banks match your filters</p>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Questions</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBanks.map(bank => (
                <TableRow
                  key={bank.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/dashboard/banks/${bank.id}`)}
                >
                  <TableCell className="font-medium">{bank.title}</TableCell>
                  <TableCell>{getStatusBadge(bank.status)}</TableCell>
                  <TableCell>{bank.questionCount}</TableCell>
                  <TableCell>{new Date(bank.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end" onClick={e => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(bank)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(bank.id)}
                        disabled={deletingId === bank.id}
                      >
                        {deletingId === bank.id ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <BankDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        organizationId={organizationId}
        bank={editingBank || undefined}
      />
    </div>
  );
}
