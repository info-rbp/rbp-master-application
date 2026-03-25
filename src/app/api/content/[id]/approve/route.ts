
import { NextRequest, NextResponse } from 'next/server';
import { approveContent } from '@/lib/content-service';
import { getServerAuthContext } from '@/lib/server-auth';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await getServerAuthContext();
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const contentId = params.id;

  try {
    const content = await approveContent(contentId, auth.userId);
    return NextResponse.json(content);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to approve content' }, { status: 500 });
  }
}
