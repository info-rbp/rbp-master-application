import { firestore } from '@/firebase/server';

export type AnnouncementAudience = 'public' | 'member' | 'admin' | 'all';

export type Announcement = {
  id: string;
  title: string;
  message: string;
  audience: AnnouncementAudience;
  active: boolean;
  startAt?: string;
  endAt?: string;
  dismissible: boolean;
  createdAt: string;
  updatedAt: string;
};

const toIso = (value: unknown) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object' && value && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return '';
};

export async function getAllAnnouncements() {
  const snap = await firestore.collection('announcements').orderBy('createdAt', 'desc').get();
  return snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      title: d.title,
      message: d.message,
      audience: d.audience,
      active: Boolean(d.active),
      startAt: toIso(d.startAt),
      endAt: toIso(d.endAt),
      dismissible: Boolean(d.dismissible),
      createdAt: toIso(d.createdAt),
      updatedAt: toIso(d.updatedAt),
    } as Announcement;
  });
}

export async function getActiveAnnouncements(audience: AnnouncementAudience) {
  const all = await getAllAnnouncements();
  const now = Date.now();
  return all.filter((item) => {
    const inAudience = item.audience === 'all' || item.audience === audience;
    const starts = item.startAt ? new Date(item.startAt).getTime() <= now : true;
    const ends = item.endAt ? new Date(item.endAt).getTime() >= now : true;
    return item.active && inAudience && starts && ends;
  });
}

export async function createAnnouncement(input: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = new Date();
  const ref = await firestore.collection('announcements').add({
    ...input,
    startAt: input.startAt ? new Date(input.startAt) : null,
    endAt: input.endAt ? new Date(input.endAt) : null,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateAnnouncement(id: string, input: Partial<Omit<Announcement, 'id' | 'createdAt'>>) {
  await firestore.doc(`announcements/${id}`).update({
    ...input,
    updatedAt: new Date(),
    ...(input.startAt !== undefined ? { startAt: input.startAt ? new Date(input.startAt) : null } : {}),
    ...(input.endAt !== undefined ? { endAt: input.endAt ? new Date(input.endAt) : null } : {}),
  });
}

export async function deleteAnnouncement(id: string) {
  await firestore.doc(`announcements/${id}`).delete();
}
