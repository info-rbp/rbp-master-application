'use client';

import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { KnowledgeArticle, PartnerOffer, PastProject, Testimonial } from '@/lib/definitions';
import { removeKnowledgeArticle, removePartnerOffer, removePastProject, removeTestimonial, saveKnowledgeArticle, savePartnerOffer, savePastProject, saveTestimonial } from '../content-actions';

const formatDate = (value?: string) => (value ? new Date(value).toLocaleString() : '—');

function ContentListShell({ title, onAdd, children, isEmpty }: { title: string; onAdd: () => void; children: ReactNode; isEmpty: boolean; }) {
  return <div className="space-y-4"><div className="flex justify-between"><h3 className="text-xl font-semibold capitalize">{title}</h3><Button onClick={onAdd}>Create</Button></div>{isEmpty ? <Card><CardContent className="p-6 text-muted-foreground">No records yet.</CardContent></Card> : <div className="space-y-2">{children}</div>}</div>;
}

export function PartnerOffersManager({ initial }: { initial: PartnerOffer[] }) {
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<PartnerOffer | null>(null);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  async function submit(formData: FormData) {
    const title = String(formData.get('title') ?? '').trim();
    const description = String(formData.get('description') ?? '').trim();
    const link = String(formData.get('link') ?? '').trim();
    if (!title || !description || !link) {
      toast({ title: 'Missing fields', description: 'Title, description and link are required.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    const saved = await savePartnerOffer({
      id: editing?.id,
      title,
      description,
      link,
      slug: String(formData.get('slug') ?? '').trim() || undefined,
      summary: String(formData.get('summary') ?? '').trim() || undefined,
      partnerName: String(formData.get('partnerName') ?? '').trim() || undefined,
      offerValue: String(formData.get('offerValue') ?? '').trim() || undefined,
      offerDetails: String(formData.get('offerDetails') ?? '').trim() || undefined,
      claimInstructions: String(formData.get('claimInstructions') ?? '').trim() || undefined,
      partnerOverview: String(formData.get('partnerOverview') ?? '').trim() || undefined,
      partnerServices: String(formData.get('partnerServices') ?? '').split(',').map((x) => x.trim()).filter(Boolean),
      whyWeRecommend: String(formData.get('whyWeRecommend') ?? '').trim() || undefined,
      redemptionCode: String(formData.get('redemptionCode') ?? '').trim() || undefined,
      termsAndConditions: String(formData.get('termsAndConditions') ?? '').trim() || undefined,
      seoTitle: String(formData.get('seoTitle') ?? '').trim() || undefined,
      seoDescription: String(formData.get('seoDescription') ?? '').trim() || undefined,
      imageUrl: String(formData.get('imageUrl') ?? '').trim() || undefined,
      active: formData.get('active') === 'on',
      displayOrder: Number(formData.get('displayOrder') ?? 0),
      expiresAt: String(formData.get('expiresAt') ?? '').trim() || null,
    });
    setSubmitting(false);

    if (!saved) {
      toast({ title: 'Save failed', description: 'Unable to save partner offer.', variant: 'destructive' });
      return;
    }

    setItems((prev) => [saved, ...prev.filter((x) => x.id !== saved.id)]);
    setOpen(false);
    setEditing(null);
    toast({ title: 'Saved', description: 'Partner offer saved.' });
  }

  async function onDelete(id: string) {
    if (!window.confirm('Delete this partner offer? This cannot be undone.')) return;
    await removePartnerOffer(id);
    setItems((p) => p.filter((x) => x.id !== id));
    toast({ title: 'Deleted', description: 'Partner offer removed.' });
  }

  return <ContentListShell title="Partner offers" onAdd={() => { setEditing(null); setOpen(true); }} isEmpty={items.length === 0}>{items.map((item) => <Card key={item.id}><CardContent className="p-4 flex items-start justify-between gap-4"><div><p className="font-semibold">{item.title}</p><p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p><p className="text-xs">Public URL: /partner-offers/{item.slug ?? item.id}</p><p className="text-xs">Redeem URL: {item.link}</p><p className="text-xs text-muted-foreground">Active: {String(item.active)} • Order: {item.displayOrder ?? 0}</p><p className="text-xs text-muted-foreground">Created: {formatDate(item.createdAt)} • Updated: {formatDate(item.updatedAt)}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => { setEditing(item); setOpen(true); }}>Edit</Button><Button size="sm" variant="outline" onClick={async () => { const saved = await savePartnerOffer({ id: item.id, title: item.title, description: item.description, link: item.link, active: !item.active, displayOrder: item.displayOrder ?? 0, imageUrl: item.imageUrl, expiresAt: item.expiresAt ?? null }); if (saved) { setItems((p) => [saved, ...p.filter((x) => x.id !== saved.id)]); toast({ title: saved.active ? 'Offer activated' : 'Offer deactivated' }); } }}>Toggle</Button><Button size="sm" variant="destructive" onClick={() => onDelete(item.id)}>Delete</Button></div></CardContent></Card>)}<Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{editing ? 'Edit offer' : 'Create offer'}</DialogTitle></DialogHeader><form action={submit} className="space-y-3"><Input name="title" defaultValue={editing?.title} placeholder="Title" required /><Textarea name="description" defaultValue={editing?.description} placeholder="Description" required /><Input name="link" defaultValue={editing?.link} placeholder="https://" required /><Input name="slug" defaultValue={editing?.slug} placeholder="slug (auto if blank)" /><Input name="summary" defaultValue={editing?.summary} placeholder="Summary" /><Input name="partnerName" defaultValue={editing?.partnerName} placeholder="Partner name" /><Input name="offerValue" defaultValue={editing?.offerValue} placeholder="Offer value" /><Textarea name="offerDetails" defaultValue={editing?.offerDetails} placeholder="Offer details" /><Textarea name="partnerOverview" defaultValue={editing?.partnerOverview} placeholder="Partner overview" /><Input name="partnerServices" defaultValue={editing?.partnerServices?.join(', ')} placeholder="Partner services (comma separated)" /><Textarea name="whyWeRecommend" defaultValue={editing?.whyWeRecommend} placeholder="Why we recommend it" /><Textarea name="claimInstructions" defaultValue={editing?.claimInstructions} placeholder="Claim instructions" /><Input name="redemptionCode" defaultValue={editing?.redemptionCode} placeholder="Redemption code" /><Textarea name="termsAndConditions" defaultValue={editing?.termsAndConditions} placeholder="Terms and conditions" /><Input name="seoTitle" defaultValue={editing?.seoTitle} placeholder="SEO title" /><Textarea name="seoDescription" defaultValue={editing?.seoDescription} placeholder="SEO description" /><Input name="imageUrl" defaultValue={editing?.imageUrl} placeholder="Image URL (optional)" /><Input name="displayOrder" defaultValue={editing?.displayOrder ?? 0} type="number" min={0} /><Input name="expiresAt" defaultValue={editing?.expiresAt ?? ''} type="datetime-local" /><label className="flex items-center gap-2"><input name="active" type="checkbox" defaultChecked={editing?.active ?? true} />Active</label><Button disabled={submitting} type="submit">{submitting ? 'Saving...' : 'Save'}</Button></form></DialogContent></Dialog></ContentListShell>;
}

export function TestimonialsManager({ initial }: { initial: Testimonial[] }) {
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  async function submit(formData: FormData) {
    const clientName = String(formData.get('clientName') ?? '').trim();
    const content = String(formData.get('content') ?? '').trim();
    if (!clientName || !content) {
      toast({ title: 'Missing fields', description: 'Client name and content are required.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    const saved = await saveTestimonial({ id: editing?.id, clientName, content, company: String(formData.get('company') || ''), role: String(formData.get('role') || ''), imageUrl: String(formData.get('imageUrl') || ''), displayOrder: Number(formData.get('displayOrder') ?? 0), active: formData.get('active') === 'on' });
    setSubmitting(false);
    if (!saved) { toast({ title: 'Save failed', variant: 'destructive' }); return; }
    setItems((p) => [saved, ...p.filter((x) => x.id !== saved.id)]); setOpen(false); setEditing(null); toast({ title: 'Saved' });
  }

  return <ContentListShell title="Testimonials" onAdd={() => { setEditing(null); setOpen(true); }} isEmpty={items.length===0}>{items.map((item) => <Card key={item.id}><CardContent className="p-4 flex items-start justify-between"><div><p className="font-semibold">{item.clientName}</p><p className="text-sm text-muted-foreground line-clamp-2">{item.content}</p><p className="text-xs text-muted-foreground">{[item.role, item.company].filter(Boolean).join(', ') || '—'}</p><p className="text-xs text-muted-foreground">Created: {formatDate(item.createdAt)} • Updated: {formatDate(item.updatedAt)}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => { setEditing(item); setOpen(true); }}>Edit</Button><Button size="sm" variant="outline" onClick={async () => { const saved = await saveTestimonial({ id: item.id, clientName: item.clientName, content: item.content, company: item.company, role: item.role, imageUrl: item.imageUrl, displayOrder: item.displayOrder ?? 0, active: !item.active }); if (saved) { setItems((p)=>[saved,...p.filter((x)=>x.id!==saved.id)]); toast({ title: saved.active ? 'Published' : 'Unpublished' }); } }}>Toggle</Button><Button size="sm" variant="destructive" onClick={async () => { if (!window.confirm('Delete this testimonial?')) return; await removeTestimonial(item.id); setItems((p)=>p.filter((x)=>x.id!==item.id)); toast({ title: 'Deleted' }); }}>Delete</Button></div></CardContent></Card>)}<Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{editing ? 'Edit testimonial' : 'Create testimonial'}</DialogTitle></DialogHeader><form action={submit} className="space-y-3"><Input name="clientName" defaultValue={editing?.clientName} required /><Textarea name="content" defaultValue={editing?.content} required /><Input name="company" defaultValue={editing?.company} placeholder="Company" /><Input name="role" defaultValue={editing?.role} placeholder="Role" /><Input name="imageUrl" defaultValue={editing?.imageUrl} placeholder="Avatar/image URL (optional)" /><Input name="displayOrder" type="number" min={0} defaultValue={editing?.displayOrder ?? 0} /><label className="flex items-center gap-2"><input name="active" type="checkbox" defaultChecked={editing?.active ?? true} />Published</label><Button disabled={submitting} type="submit">{submitting ? 'Saving...' : 'Save'}</Button></form></DialogContent></Dialog></ContentListShell>;
}

export function PastProjectsManager({ initial }: { initial: PastProject[] }) {
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<PastProject | null>(null);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  async function submit(formData: FormData) {
    const name = String(formData.get('name') ?? '').trim();
    const description = String(formData.get('description') ?? '').trim();
    if (!name || !description) {
      toast({ title: 'Missing fields', description: 'Name and description are required.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    const saved = await savePastProject({ id: editing?.id, name, description, link: String(formData.get('link') || ''), imageUrl: String(formData.get('imageUrl') || ''), displayOrder: Number(formData.get('displayOrder') ?? 0), active: formData.get('active') === 'on' });
    setSubmitting(false);
    if (!saved) { toast({ title: 'Save failed', variant: 'destructive' }); return; }
    setItems((p) => [saved, ...p.filter((x) => x.id !== saved.id)]); setOpen(false); setEditing(null); toast({ title: 'Saved' });
  }

  return <ContentListShell title="Past projects" onAdd={() => { setEditing(null); setOpen(true); }} isEmpty={items.length===0}>{items.map((item) => <Card key={item.id}><CardContent className="p-4 flex items-start justify-between"><div><p className="font-semibold">{item.name}</p><p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p><p className="text-xs text-muted-foreground">{item.link || 'No link'}</p><p className="text-xs text-muted-foreground">Created: {formatDate(item.createdAt)} • Updated: {formatDate(item.updatedAt)}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => { setEditing(item); setOpen(true); }}>Edit</Button><Button size="sm" variant="outline" onClick={async () => { const saved = await savePastProject({ id: item.id, name: item.name, description: item.description, link: item.link, imageUrl: item.imageUrl, displayOrder: item.displayOrder ?? 0, active: !item.active }); if (saved) { setItems((p)=>[saved,...p.filter((x)=>x.id!==saved.id)]); toast({ title: saved.active ? 'Published' : 'Unpublished' }); } }}>Toggle</Button><Button size="sm" variant="destructive" onClick={async () => { if (!window.confirm('Delete this project?')) return; await removePastProject(item.id); setItems((p)=>p.filter((x)=>x.id!==item.id)); toast({ title: 'Deleted' }); }}>Delete</Button></div></CardContent></Card>)}<Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{editing ? 'Edit project' : 'Create project'}</DialogTitle></DialogHeader><form action={submit} className="space-y-3"><Input name="name" defaultValue={editing?.name} required /><Textarea name="description" defaultValue={editing?.description} required /><Input name="link" defaultValue={editing?.link} placeholder="https://" /><Input name="imageUrl" defaultValue={editing?.imageUrl} placeholder="Image URL (optional)" /><Input name="displayOrder" type="number" min={0} defaultValue={editing?.displayOrder ?? 0} /><label className="flex items-center gap-2"><input name="active" type="checkbox" defaultChecked={editing?.active ?? true} />Published</label><Button disabled={submitting} type="submit">{submitting ? 'Saving...' : 'Save'}</Button></form></DialogContent></Dialog></ContentListShell>;
}

export function KnowledgeManager({ initial, type }: { initial: KnowledgeArticle[]; type: Exclude<KnowledgeArticle['contentType'], undefined> }) {
  const [items, setItems] = useState(initial.filter((x) => (x.contentType ?? 'article') === type));
  const [editing, setEditing] = useState<KnowledgeArticle | null>(null);
  const [open, setOpen] = useState(false);
  async function submit(formData: FormData) {
    const saved = await saveKnowledgeArticle({ id: editing?.id, title: String(formData.get('title')), slug: String(formData.get('slug')), excerpt: String(formData.get('excerpt') || ''), summary: String(formData.get('summary') || ''), content: String(formData.get('content')), category: String(formData.get('category') || ''), tags: String(formData.get('tags') || '').split(',').map((x) => x.trim()).filter(Boolean), keyTakeaways: String(formData.get('keyTakeaways') || '').split('\n').map((x) => x.trim()).filter(Boolean), guideSections: String(formData.get('guideSections') || '').split('\n').map((x) => x.trim()).filter(Boolean), downloadableResources: String(formData.get('downloadableResources') || '').split('\n').map((x) => x.trim()).filter(Boolean), toolComponents: String(formData.get('toolComponents') || '').split('\n').map((x) => x.trim()).filter(Boolean), howItWorks: String(formData.get('howItWorks') || ''), howItWorksSteps: String(formData.get('howItWorksSteps') || '').split('\n').map((x) => x.trim()).filter(Boolean), whenToUse: String(formData.get('whenToUse') || '').split('\n').map((x) => x.trim()).filter(Boolean), exampleApplication: String(formData.get('exampleApplication') || ''), exampleSteps: String(formData.get('exampleSteps') || '').split('\n').map((x) => x.trim()).filter(Boolean), embeddedResources: String(formData.get('embeddedResources') || '').split('\n').map((x) => x.trim()).filter(Boolean), relatedResources: String(formData.get('relatedResources') || '').split('\n').map((x) => x.trim()).filter(Boolean), published: formData.get('published') === 'on', contentType: type });
    if (!saved) return;
    setItems((p) => [saved, ...p.filter((x) => x.id !== saved.id)]); setOpen(false); setEditing(null);
  }
  return <div className="space-y-4"><div className="flex justify-between"><h3 className="text-xl font-semibold capitalize">{type}</h3><Button onClick={() => { setEditing(null); setOpen(true); }}>Create</Button></div><div className="space-y-2">{items.map((item) => <Card key={item.id}><CardContent className="p-4 flex items-start justify-between"><div><p className="font-semibold">{item.title}</p><p className="text-sm text-muted-foreground">/{item.slug}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => { setEditing(item); setOpen(true); }}>Edit</Button><Button size="sm" variant="destructive" onClick={async () => { await removeKnowledgeArticle(item.id); setItems((p)=>p.filter((x)=>x.id!==item.id)); }}>Delete</Button></div></CardContent></Card>)}</div><Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{editing ? 'Edit entry' : 'Create entry'}</DialogTitle></DialogHeader><form action={submit} className="space-y-2"><Input name="title" defaultValue={editing?.title} required /><Input name="slug" defaultValue={editing?.slug} required /><Input name="excerpt" defaultValue={editing?.excerpt} placeholder="Summary" /><Textarea name="summary" defaultValue={editing?.summary} placeholder="Public summary" /><Textarea name="content" defaultValue={editing?.content} required className="min-h-40" /><Textarea name="keyTakeaways" defaultValue={editing?.keyTakeaways?.join('\n')} placeholder="Key takeaways (one per line)" /><Textarea name="guideSections" defaultValue={editing?.guideSections?.join('\n')} placeholder="Guide sections (one per line)" /><Textarea name="downloadableResources" defaultValue={editing?.downloadableResources?.join('\n')} placeholder="Downloadable resources (one per line)" /><Textarea name="toolComponents" defaultValue={editing?.toolComponents?.join('\n')} placeholder="Tool components (one per line)" /><Textarea name="howItWorks" defaultValue={editing?.howItWorks} placeholder="How it works" /><Textarea name="howItWorksSteps" defaultValue={editing?.howItWorksSteps?.join('\n')} placeholder="How it works steps (one per line)" /><Textarea name="whenToUse" defaultValue={editing?.whenToUse?.join('\n')} placeholder="When to use (one per line)" /><Textarea name="exampleApplication" defaultValue={editing?.exampleApplication} placeholder="Example application" /><Textarea name="exampleSteps" defaultValue={editing?.exampleSteps?.join('\n')} placeholder="Example steps (one per line)" /><Textarea name="embeddedResources" defaultValue={editing?.embeddedResources?.join('\n')} placeholder="Embedded resources (one per line)" /><Textarea name="relatedResources" defaultValue={editing?.relatedResources?.join('\n')} placeholder="Related resources (one per line)" /><Input name="category" defaultValue={editing?.category} /><Input name="tags" defaultValue={editing?.tags?.join(',')} placeholder="tag1, tag2" /><label className="flex items-center gap-2"><input type="checkbox" name="published" defaultChecked={editing?.published ?? false}/>Published</label><Button type="submit">Save</Button></form></DialogContent></Dialog></div>;
}
