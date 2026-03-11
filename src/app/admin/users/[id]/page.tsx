import { notFound } from 'next/navigation';
import { getUserAdminActivity, getUserById } from '@/lib/data';
import { UserDetailClient } from './detail-client';

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUserById(id);
  if (!user) notFound();
  const activity = await getUserAdminActivity(id);

  return <UserDetailClient initialUser={user} activity={activity} />;
}
