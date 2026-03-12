import { getServerAuthContext } from '@/lib/server-auth';
import { redirect } from 'next/navigation';

export async function requireMemberAuth() {
  const auth = await getServerAuthContext();
  if (!auth) redirect('/login');
  return auth;
}
