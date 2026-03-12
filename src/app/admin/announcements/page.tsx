import { revalidatePath } from 'next/cache';
import { createAnnouncement, deleteAnnouncement, getAllAnnouncements, updateAnnouncement } from '@/lib/announcements';
import { logAuditEvent } from '@/lib/audit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { requireAdminServerContext } from '@/lib/server-auth';

async function createAnnouncementAction(formData: FormData) {
  'use server';
  const auth = await requireAdminServerContext();
  const audience = String(formData.get('audience') ?? 'all') as 'public' | 'member' | 'admin' | 'all';
  const id = await createAnnouncement({
    title: String(formData.get('title') ?? ''),
    message: String(formData.get('message') ?? ''),
    audience,
    active: formData.get('active') === 'on',
    dismissible: formData.get('dismissible') === 'on',
    startAt: String(formData.get('startAt') ?? '') || undefined,
    endAt: String(formData.get('endAt') ?? '') || undefined,
  });

  await logAuditEvent({
    actorUserId: auth.userId,
    actorRole: 'admin',
    actionType: 'announcement_create',
    targetId: id,
    targetType: 'announcement',
  });

  revalidatePath('/admin/announcements');
}

async function toggleAnnouncementAction(formData: FormData) {
  'use server';
  const auth = await requireAdminServerContext();
  const id = String(formData.get('id'));
  const active = formData.get('active') === 'true';
  await updateAnnouncement(id, { active: !active });
  await logAuditEvent({ actorUserId: auth.userId, actorRole: 'admin', actionType: 'announcement_update', targetId: id, targetType: 'announcement', metadata: { active: !active } });
  revalidatePath('/admin/announcements');
}

async function deleteAnnouncementAction(formData: FormData) {
  'use server';
  const auth = await requireAdminServerContext();
  const id = String(formData.get('id'));
  await deleteAnnouncement(id);
  await logAuditEvent({ actorUserId: auth.userId, actorRole: 'admin', actionType: 'announcement_delete', targetId: id, targetType: 'announcement' });
  revalidatePath('/admin/announcements');
}

export default async function AdminAnnouncementsPage() {
  const announcements = await getAllAnnouncements();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Announcements</h2>
      <form action={createAnnouncementAction} className="grid gap-3 rounded-lg border p-4 md:grid-cols-2">
        <Input name="title" placeholder="Title" required />
        <Input name="message" placeholder="Message" required />
        <Input name="audience" placeholder="Audience: public|member|admin|all" defaultValue="all" required />
        <Input name="startAt" type="datetime-local" />
        <Input name="endAt" type="datetime-local" />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked />Active</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="dismissible" defaultChecked />Dismissible</label>
        <Button type="submit" className="md:col-span-2">Create announcement</Button>
      </form>

      <div className="space-y-2">
        {announcements.map((item) => (
          <div key={item.id} className="rounded-md border p-3">
            <p className="font-medium">{item.title}</p>
            <p className="text-sm text-muted-foreground">{item.message}</p>
            <p className="text-xs text-muted-foreground">Audience: {item.audience} | Active: {String(item.active)}</p>
            <div className="mt-2 flex gap-2">
              <form action={toggleAnnouncementAction}><input type="hidden" name="id" value={item.id} /><input type="hidden" name="active" value={String(item.active)} /><Button size="sm" variant="outline">Toggle active</Button></form>
              <form action={deleteAnnouncementAction}><input type="hidden" name="id" value={item.id} /><Button size="sm" variant="destructive">Delete</Button></form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
