'use client';

import { useEffect, useMemo, useState } from 'react';
import type { KnowledgeArticle } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus } from 'lucide-react';
import { useUser } from '@/firebase/auth/use-user';
import { normalizeKnowledgeSlug, parseTagInput, type KnowledgeContentType } from '@/lib/knowledge-center';

const INITIAL_FORM = {
  title: '', slug: '', excerpt: '', content: '', tags: '', published: false, featured: false,
  imageUrl: '', seoTitle: '', seoDescription: '', externalLink: '', ctaLabel: '', authorName: '',
};

type Props = { title: string; type: KnowledgeContentType };

export default function KnowledgeContentManager({ title, type }: Props) {
  const { user } = useUser();
  const { toast } = useToast();
  const [rows, setRows] = useState<KnowledgeArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<KnowledgeArticle | null>(null);
  const [search, setSearch] = useState('');
  const [publishedFilter, setPublishedFilter] = useState('all');
  const [featuredFilter, setFeaturedFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'updatedAt' | 'createdAt' | 'publishedAt'>('updatedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [form, setForm] = useState(INITIAL_FORM);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const token = await user.getIdToken();
    const params = new URLSearchParams({ type, search, sortBy, sortDirection });
    if (publishedFilter !== 'all') params.set('published', publishedFilter);
    if (featuredFilter !== 'all') params.set('featured', featuredFilter);
    const res = await fetch(`/api/admin/knowledge-center?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    setRows(json.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user, type, search, publishedFilter, featuredFilter, sortBy, sortDirection]);

  const startCreate = () => { setEditing(null); setForm(INITIAL_FORM); setFormOpen(true); };
  const startEdit = (item: KnowledgeArticle) => {
    setEditing(item);
    setForm({
      title: item.title, slug: item.slug, excerpt: item.excerpt ?? '', content: item.content ?? '', tags: (item.tags ?? []).join(', '),
      published: item.published, featured: Boolean(item.featured), imageUrl: item.imageUrl ?? '', seoTitle: item.seoTitle ?? '',
      seoDescription: item.seoDescription ?? '', externalLink: item.externalLink ?? '', ctaLabel: item.ctaLabel ?? '', authorName: item.authorName ?? '',
    });
    setFormOpen(true);
  };

  const save = async () => {
    if (!user) return;
    if (!form.title.trim() || !form.content.trim()) {
      toast({ variant: 'destructive', title: 'Validation error', description: 'Title and content are required.' });
      return;
    }
    const token = await user.getIdToken();
    const payload = { ...form, slug: normalizeKnowledgeSlug(form.slug || form.title), type, tags: parseTagInput(form.tags) };
    const res = await fetch(editing ? `/api/admin/knowledge-center/${editing.id}` : '/api/admin/knowledge-center', {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const json = await res.json();
      toast({ variant: 'destructive', title: 'Save failed', description: json.error ?? 'Unable to save content.' });
      return;
    }
    toast({ title: editing ? 'Content updated' : 'Content created' });
    setFormOpen(false);
    await load();
  };

  const remove = async (id: string) => {
    if (!user) return;
    const token = await user.getIdToken();
    const res = await fetch(`/api/admin/knowledge-center/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      toast({ variant: 'destructive', title: 'Delete failed' });
      return;
    }
    toast({ title: 'Content deleted' });
    await load();
  };

  const togglePublish = async (id: string, publish: boolean) => {
    if (!user) return;
    const token = await user.getIdToken();
    await fetch(`/api/admin/knowledge-center/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: publish ? 'publish' : 'unpublish' }),
    });
    await load();
  };

  const empty = useMemo(() => !loading && rows.length === 0, [loading, rows.length]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Input placeholder="Search by title or slug" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        <Select value={publishedFilter} onValueChange={setPublishedFilter}><SelectTrigger className="w-40"><SelectValue placeholder="Published" /></SelectTrigger><SelectContent><SelectItem value="all">All status</SelectItem><SelectItem value="true">Published</SelectItem><SelectItem value="false">Draft</SelectItem></SelectContent></Select>
        <Select value={featuredFilter} onValueChange={setFeaturedFilter}><SelectTrigger className="w-40"><SelectValue placeholder="Featured" /></SelectTrigger><SelectContent><SelectItem value="all">All featured</SelectItem><SelectItem value="true">Featured</SelectItem><SelectItem value="false">Not featured</SelectItem></SelectContent></Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="updatedAt">Sort: Updated</SelectItem><SelectItem value="createdAt">Sort: Created</SelectItem><SelectItem value="publishedAt">Sort: Published</SelectItem></SelectContent></Select>
        <Select value={sortDirection} onValueChange={(v) => setSortDirection(v as any)}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="desc">Newest</SelectItem><SelectItem value="asc">Oldest</SelectItem></SelectContent></Select>

        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogTrigger asChild><Button onClick={startCreate}><Plus className="mr-2 h-4 w-4" />New {title.slice(0, -1)}</Button></DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Create'} {title.slice(0, -1)}</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <Label>Title</Label><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              <Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
              <Label>Excerpt</Label><Textarea value={form.excerpt} onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))} />
              <Label>Content</Label><Textarea rows={10} value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} />
              <Label>Tags (comma separated)</Label><Input value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} />
              <Label>Author name</Label><Input value={form.authorName} onChange={(e) => setForm((f) => ({ ...f, authorName: e.target.value }))} />
              <Label>Image URL</Label><Input value={form.imageUrl} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))} />
              {type === 'tool' && <><Label>External Link</Label><Input value={form.externalLink} onChange={(e) => setForm((f) => ({ ...f, externalLink: e.target.value }))} /><Label>CTA Label</Label><Input value={form.ctaLabel} onChange={(e) => setForm((f) => ({ ...f, ctaLabel: e.target.value }))} /></>}
              <Label>SEO Title</Label><Input value={form.seoTitle} onChange={(e) => setForm((f) => ({ ...f, seoTitle: e.target.value }))} />
              <Label>SEO Description</Label><Textarea value={form.seoDescription} onChange={(e) => setForm((f) => ({ ...f, seoDescription: e.target.value }))} />
              <div className="flex gap-6"><div className="flex items-center gap-2"><Switch checked={form.published} onCheckedChange={(v) => setForm((f) => ({ ...f, published: v }))} /><Label>Published</Label></div><div className="flex items-center gap-2"><Switch checked={form.featured} onCheckedChange={(v) => setForm((f) => ({ ...f, featured: v }))} /><Label>Featured</Label></div></div>
              <Button onClick={save}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading {title.toLowerCase()}...</p>}
      {empty && <div className="rounded-lg border p-8 text-center text-muted-foreground">No {title.toLowerCase()} found for current filters.</div>}

      {rows.length > 0 && (
        <div className="rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50"><tr><th className="text-left p-3">Title</th><th className="text-left p-3">Slug</th><th className="text-left p-3">Status</th><th className="text-left p-3">Updated</th><th className="text-left p-3">Tags</th><th className="text-right p-3">Actions</th></tr></thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="p-3 font-medium">{item.title}</td>
                  <td className="p-3">{item.slug}</td>
                  <td className="p-3"><div className="flex gap-2"><Badge variant={item.published ? 'default' : 'secondary'}>{item.published ? 'Published' : 'Draft'}</Badge>{item.featured && <Badge variant="outline">Featured</Badge>}</div></td>
                  <td className="p-3">{new Date(item.updatedAt).toLocaleDateString()}</td>
                  <td className="p-3">{(item.tags ?? []).slice(0, 3).join(', ') || '-'}</td>
                  <td className="p-3 text-right space-x-2">
                    <Button size="sm" variant="outline" onClick={() => startEdit(item)}>Edit</Button>
                    <Button size="sm" variant="outline" onClick={() => togglePublish(item.id, !item.published)}>{item.published ? 'Unpublish' : 'Publish'}</Button>
                    <AlertDialog><AlertDialogTrigger asChild><Button size="sm" variant="destructive">Delete</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete content?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => remove(item.id)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
