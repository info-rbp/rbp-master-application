'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AdminServiceRequestRow } from '@/lib/admin-operations';
import { updateServiceRequestStatusAction } from './server-actions';

const STATUS_OPTIONS = ['submitted', 'in_review', 'scheduled', 'in_progress', 'resolved', 'completed', 'cancelled'] as const;

export function RequestQueue({ title, collectionName, rows }: { title: string; collectionName: 'discovery_calls' | 'support_requests' | 'customisation_requests'; rows: AdminServiceRequestRow[] }) {
  const [items, setItems] = useState(rows);
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? <p className="text-sm text-muted-foreground">No requests found.</p> : items.map((row) => (
          <div key={row.id} className="grid gap-2 rounded border p-3 md:grid-cols-12">
            <div className="md:col-span-2 text-xs"><strong>Member:</strong> {row.memberId}</div>
            <div className="md:col-span-2 text-xs"><strong>Status:</strong> {row.status}</div>
            <div className="md:col-span-2 text-xs"><strong>Assigned:</strong> {row.assignedAdmin ?? '—'}</div>
            <div className="md:col-span-2 text-xs"><strong>Type:</strong> {row.callType ?? row.requestType ?? '—'}</div>
            <div className="md:col-span-4 text-xs"><strong>Description:</strong> {row.description ?? row.notes ?? '—'}</div>
            <div className="md:col-span-3"><select className="h-9 w-full rounded-md border px-2" defaultValue={row.status} id={`status-${row.id}`}>{STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}</select></div>
            <div className="md:col-span-7"><Input id={`note-${row.id}`} defaultValue={row.notes ?? ''} placeholder="Ops note (optional)" /></div>
            <div className="md:col-span-2"><Button size="sm" disabled={pending} onClick={() => {
              const status = (document.getElementById(`status-${row.id}`) as HTMLSelectElement)?.value;
              const note = (document.getElementById(`note-${row.id}`) as HTMLInputElement)?.value;
              startTransition(async () => {
                await updateServiceRequestStatusAction(collectionName, row.id, status, note);
                setItems((prev) => prev.map((x) => (x.id === row.id ? { ...x, status, notes: note } : x)));
              });
            }}>Update</Button></div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
