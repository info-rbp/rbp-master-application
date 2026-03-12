'use client';

import { useMemo, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AdminServiceRequestRow } from '@/lib/admin-operations';
import type { ServiceWorkflowType, WorkflowPriority, WorkflowStatus } from '@/lib/service-workflows';
import { updateServiceRequestStatusAction } from './server-actions';

const STATUS_OPTIONS: WorkflowStatus[] = ['submitted', 'under_review', 'assigned', 'in_progress', 'awaiting_member', 'completed', 'cancelled'];
const PRIORITY_OPTIONS: WorkflowPriority[] = ['low', 'normal', 'high', 'urgent'];

export function RequestQueue({ title, workflowType, rows }: { title: string; workflowType: ServiceWorkflowType; rows: AdminServiceRequestRow[] }) {
  const [items, setItems] = useState(rows);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | WorkflowStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | WorkflowPriority>('all');
  const [pending, startTransition] = useTransition();

  const visibleItems = useMemo(() => items.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false;
    if (!query) return true;
    const haystack = `${item.memberId} ${item.memberName ?? ''} ${item.description ?? ''}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  }), [items, priorityFilter, query, statusFilter]);

  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 md:grid-cols-3">
          <Input placeholder="Search member or request" value={query} onChange={(event) => setQuery(event.target.value)} />
          <select className="h-9 rounded-md border px-2" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | WorkflowStatus)}>
            <option value="all">All statuses</option>
            {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <select className="h-9 rounded-md border px-2" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as 'all' | WorkflowPriority)}>
            <option value="all">All priorities</option>
            {PRIORITY_OPTIONS.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
          </select>
        </div>

        {visibleItems.length === 0 ? <p className="text-sm text-muted-foreground">No requests found.</p> : visibleItems.map((row) => (
          <div key={row.id} className="grid gap-2 rounded border p-3 md:grid-cols-12">
            <div className="md:col-span-4 text-xs">
              <strong>Member:</strong> {row.memberName ?? row.memberId}<br />
              <strong>Status:</strong> {row.status} · <strong>Priority:</strong> {row.priority ?? 'normal'}
            </div>
            <div className="md:col-span-8 text-xs"><strong>Description:</strong> {row.description ?? '—'}</div>
            <div className="md:col-span-3"><select className="h-9 w-full rounded-md border px-2" defaultValue={row.status} id={`status-${row.id}`}>{STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}</select></div>
            <div className="md:col-span-3"><select className="h-9 w-full rounded-md border px-2" defaultValue={row.priority ?? 'normal'} id={`priority-${row.id}`}>{PRIORITY_OPTIONS.map((priority) => <option key={priority} value={priority}>{priority}</option>)}</select></div>
            <div className="md:col-span-6"><Input id={`member-visible-${row.id}`} defaultValue={row.memberVisibleUpdate ?? ''} placeholder="Member-visible update" /></div>
            <div className="md:col-span-10"><Input id={`internal-${row.id}`} defaultValue={row.internalNotes ?? ''} placeholder="Internal admin note" /></div>
            <div className="md:col-span-2"><Button size="sm" disabled={pending} onClick={() => {
              const status = (document.getElementById(`status-${row.id}`) as HTMLSelectElement)?.value as WorkflowStatus;
              const priority = (document.getElementById(`priority-${row.id}`) as HTMLSelectElement)?.value as WorkflowPriority;
              const memberVisibleUpdate = (document.getElementById(`member-visible-${row.id}`) as HTMLInputElement)?.value;
              const internalNotes = (document.getElementById(`internal-${row.id}`) as HTMLInputElement)?.value;
              startTransition(async () => {
                await updateServiceRequestStatusAction({ workflowType, id: row.id, status, priority, memberVisibleUpdate, internalNotes });
                setItems((prev) => prev.map((item) => (item.id === row.id ? { ...item, status, priority, memberVisibleUpdate, internalNotes } : item)));
              });
            }}>Update</Button></div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
