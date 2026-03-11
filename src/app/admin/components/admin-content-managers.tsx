'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { KnowledgeArticle, PartnerOffer, PastProject, Testimonial, UserProfile } from '@/lib/definitions';
import { removeKnowledgeArticle, removePartnerOffer, removePastProject, removeTestimonial, saveKnowledgeArticle, savePartnerOffer, savePastProject, saveTestimonial, saveUserAdminChanges } from '../content-actions';

export function PartnerOffersManager({ initial }: { initial: PartnerOffer[] }) {
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<PartnerOffer | null>(null);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  async function submit(formData: FormData) {
    const payload = {
      id: editing?.id,
      title: String(formData.get('title') ?? ''),
      description: String(formData.get('description') ?? ''),
      link: String(formData.get('link') ?? ''),
      active: formData.get('active') === 'on',
    };
    const saved = await savePartnerOffer(payload);
    if (!saved) return;
    setItems((prev) => [saved, ...prev.filter((x) => x.id !== saved.id)]);
    setOpen(false);
    setEditing(null);
    toast({ title: 'Saved', description: 'Partner offer updated.' });
  }

  return <CrudShell title="Partner offers" onAdd={() => { setEditing(null); setOpen(true); }}>
    {items.map((item) => <Card key={item.id}><CardContent className="p-4 flex items-start justify-between"><div><p className="font-semibold">{item.title}</p><p className="text-sm text-muted-foreground">{item.description}</p><p className="text-xs">{item.link}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => { setEditing(item); setOpen(true); }}>Edit</Button><Button size="sm" variant="destructive" onClick={async () => { await removePartnerOffer(item.id); setItems((p)=>p.filter((x)=>x.id!==item.id)); toast({title:'Deleted'}); }}>Delete</Button></div></CardContent></Card>)}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{editing ? 'Edit offer' : 'Create offer'}</DialogTitle></DialogHeader><form action={submit} className="space-y-3"><Input name="title" defaultValue={editing?.title} placeholder="Title" required /><Textarea name="description" defaultValue={editing?.description} placeholder="Description" required /><Input name="link" defaultValue={editing?.link} placeholder="https://" required /><label className="flex items-center gap-2"><input name="active" type="checkbox" defaultChecked={editing?.active ?? true} />Active</label><Button type="submit">Save</Button></form></DialogContent></Dialog>
  </CrudShell>;
}

export function TestimonialsManager({ initial }: { initial: Testimonial[] }) {
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  async function submit(formData: FormData) {
    const saved = await saveTestimonial({ id: editing?.id, clientName: String(formData.get('clientName')), content: String(formData.get('content')), company: String(formData.get('company') || ''), role: String(formData.get('role') || ''), active: formData.get('active') === 'on' });
    if (!saved) return;
    setItems((p) => [saved, ...p.filter((x) => x.id !== saved.id)]); setOpen(false); setEditing(null); toast({ title: 'Saved' });
  }
  return <CrudShell title="Testimonials" onAdd={() => { setEditing(null); setOpen(true); }}>{items.map((item) => <Card key={item.id}><CardContent className="p-4 flex items-start justify-between"><div><p className="font-semibold">{item.clientName}</p><p className="text-sm text-muted-foreground">{item.content}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => { setEditing(item); setOpen(true); }}>Edit</Button><Button size="sm" variant="destructive" onClick={async () => { await removeTestimonial(item.id); setItems((p)=>p.filter((x)=>x.id!==item.id)); }}>Delete</Button></div></CardContent></Card>)}<Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{editing ? 'Edit testimonial' : 'Create testimonial'}</DialogTitle></DialogHeader><form action={submit} className="space-y-3"><Input name="clientName" defaultValue={editing?.clientName} required /><Textarea name="content" defaultValue={editing?.content} required /><Input name="company" defaultValue={editing?.company} placeholder="Company" /><Input name="role" defaultValue={editing?.role} placeholder="Role" /><label className="flex items-center gap-2"><input name="active" type="checkbox" defaultChecked={editing?.active ?? true} />Published</label><Button type="submit">Save</Button></form></DialogContent></Dialog></CrudShell>;
}

export function PastProjectsManager({ initial }: { initial: PastProject[] }) {
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<PastProject | null>(null);
  const [open, setOpen] = useState(false);
  async function submit(formData: FormData) {
    const saved = await savePastProject({ id: editing?.id, name: String(formData.get('name')), description: String(formData.get('description')), link: String(formData.get('link') || ''), active: formData.get('active') === 'on' });
    if (!saved) return;
    setItems((p) => [saved, ...p.filter((x) => x.id !== saved.id)]); setOpen(false); setEditing(null);
  }
  return <CrudShell title="Past projects" onAdd={() => { setEditing(null); setOpen(true); }}>{items.map((item) => <Card key={item.id}><CardContent className="p-4 flex items-start justify-between"><div><p className="font-semibold">{item.name}</p><p className="text-sm text-muted-foreground">{item.description}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => { setEditing(item); setOpen(true); }}>Edit</Button><Button size="sm" variant="destructive" onClick={async () => { await removePastProject(item.id); setItems((p)=>p.filter((x)=>x.id!==item.id)); }}>Delete</Button></div></CardContent></Card>)}<Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{editing ? 'Edit project' : 'Create project'}</DialogTitle></DialogHeader><form action={submit} className="space-y-3"><Input name="name" defaultValue={editing?.name} required /><Textarea name="description" defaultValue={editing?.description} required /><Input name="link" defaultValue={editing?.link} placeholder="https://" /><label className="flex items-center gap-2"><input name="active" type="checkbox" defaultChecked={editing?.active ?? true} />Published</label><Button type="submit">Save</Button></form></DialogContent></Dialog></CrudShell>;
}

export function KnowledgeManager({ initial, type }: { initial: KnowledgeArticle[]; type: NonNullable<KnowledgeArticle['contentType']> }) {
  const [items, setItems] = useState(initial.filter((x) => (x.contentType ?? 'article') === type));
  const [editing, setEditing] = useState<KnowledgeArticle | null>(null);
  const [open, setOpen] = useState(false);
  async function submit(formData: FormData) {
    const saved = await saveKnowledgeArticle({ id: editing?.id, title: String(formData.get('title')), slug: String(formData.get('slug')), excerpt: String(formData.get('excerpt') || ''), content: String(formData.get('content')), category: String(formData.get('category') || ''), tags: String(formData.get('tags') || '').split(',').map((x) => x.trim()).filter(Boolean), published: formData.get('published') === 'on', contentType: type });
    if (!saved) return;
    setItems((p) => [saved, ...p.filter((x) => x.id !== saved.id)]); setOpen(false); setEditing(null);
  }
  return <CrudShell title={type} onAdd={() => { setEditing(null); setOpen(true); }}>{items.map((item) => <Card key={item.id}><CardContent className="p-4 flex items-start justify-between"><div><p className="font-semibold">{item.title}</p><p className="text-sm text-muted-foreground">/{item.slug}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => { setEditing(item); setOpen(true); }}>Edit</Button><Button size="sm" variant="destructive" onClick={async () => { await removeKnowledgeArticle(item.id); setItems((p)=>p.filter((x)=>x.id!==item.id)); }}>Delete</Button></div></CardContent></Card>)}<Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{editing ? 'Edit entry' : 'Create entry'}</DialogTitle></DialogHeader><form action={submit} className="space-y-2"><Input name="title" defaultValue={editing?.title} required /><Input name="slug" defaultValue={editing?.slug} required /><Input name="excerpt" defaultValue={editing?.excerpt} placeholder="Summary" /><Textarea name="content" defaultValue={editing?.content} required className="min-h-40" /><Input name="category" defaultValue={editing?.category} /><Input name="tags" defaultValue={editing?.tags?.join(',')} placeholder="tag1, tag2" /><label className="flex items-center gap-2"><input type="checkbox" name="published" defaultChecked={editing?.published ?? false}/>Published</label><Button type="submit">Save</Button></form></DialogContent></Dialog></CrudShell>;
}

export function UsersAdminManager({ initial }: { initial: UserProfile[] }) {
  const [users, setUsers] = useState(initial);
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => users.filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(query.toLowerCase())), [users, query]);
  return <Card><CardHeader><CardTitle>Users administration</CardTitle><Input placeholder="Search by name or email" value={query} onChange={(e) => setQuery(e.target.value)} /></CardHeader><CardContent className="space-y-2">{filtered.map((u) => <div key={u.uid} className="border rounded p-3"><div className="font-medium">{u.name} <span className="text-xs text-muted-foreground">{u.email}</span></div><form action={async (fd: FormData) => { const updated = await saveUserAdminChanges(u.uid, { role: String(fd.get('role')), membershipTier: String(fd.get('tier')), membershipStatus: String(fd.get('status')), accountStatus: String(fd.get('accountStatus')) as UserProfile['accountStatus'] }); if (updated) setUsers((prev) => prev.map((x) => x.uid === u.uid ? updated : x)); }} className="mt-2 grid md:grid-cols-4 gap-2"><Input name="role" defaultValue={u.role} /><Input name="tier" defaultValue={u.membershipTier ?? ''} /><Input name="status" defaultValue={u.membershipStatus ?? ''} /><Input name="accountStatus" defaultValue={u.accountStatus ?? 'active'} /><Button type="submit" className="md:col-span-4">Save</Button></form></div>)}</CardContent></Card>;
}

function CrudShell({ title, onAdd, children }: { title: string; onAdd: () => void; children: ReactNode }) {
  return <div className="space-y-4"><div className="flex justify-between"><h3 className="text-xl font-semibold capitalize">{title}</h3><Button onClick={onAdd}>Create</Button></div><div className="space-y-2">{children}</div></div>;
}
