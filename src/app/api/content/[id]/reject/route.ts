
import { NextRequest, NextResponse } from 'next/server';
import { rejectContent } from '@/lib/content-service';
import { getServerAuthContext } from '@/lib/server-auth';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await getServerAuthContext();
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const contentId = params.id;
  const { feedback } = await request.json();

  if (!feedback) {
    return NextResponse.json({ error: 'Feedback is required to reject content' }, { status: 400 });
  }

  try {
    const content = await rejectContent(contentId, auth.userId, feedback);
    return NextResponse.json(content);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to reject content' }, { status: 500 });
  }
}
