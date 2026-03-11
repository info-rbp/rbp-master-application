'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { DocumentSuite } from '@/lib/definitions';
import { addSuite, deleteSuite, updateSuite } from '@/app/actions';

export default function DocushareTypeManager({ initial, type }: { initial: Array<Omit<DocumentSuite, 'documents'>>; type: NonNullable<DocumentSuite['contentType']> }) {
  const [items, setItems] = useState(initial.filter((x) => x.contentType === type));
  const [editing, setEditing] = useState<Omit<DocumentSuite, 'documents'> | null>(null);
  const [open, setOpen] = useState(false);

  async function submit(formData: FormData) {
    const payload = { name: String(formData.get('name')), description: String(formData.get('description')), contentType: type };
    if (editing) {
      const updated = await updateSuite(editing.id, payload);
      if (updated) setItems((p) => [updated, ...p.filter((x) => x.id !== updated.id)]);
    } else {
      const created = await addSuite(payload);
      setItems((p) => [created, ...p]);
    }
    setOpen(false);
    setEditing(null);
  }

  return <div className="space-y-3"><Button onClick={() => { setEditing(null); setOpen(true); }}>Create</Button>{items.map((item) => <Card key={item.id}><CardContent className="p-4 flex justify-between"><div><p className="font-semibold">{item.name}</p><p className="text-sm text-muted-foreground">{item.description}</p></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => { setEditing(item); setOpen(true); }}>Edit</Button><Button variant="destructive" size="sm" onClick={async () => { await deleteSuite(item.id); setItems((p) => p.filter((x) => x.id !== item.id)); }}>Delete</Button></div></CardContent></Card>)}<Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{editing ? 'Edit' : 'Create'} {type}</DialogTitle></DialogHeader><form action={submit} className="space-y-2"><Input name="name" defaultValue={editing?.name} required /><Textarea name="description" defaultValue={editing?.description} required /><Button type="submit">Save</Button></form></DialogContent></Dialog></div>;
}
