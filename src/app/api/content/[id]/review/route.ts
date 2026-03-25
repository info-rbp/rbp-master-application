
import { NextRequest, NextResponse } from 'next/server';
import { submitForReview } from '@/lib/content-service';
import { getServerAuthContext } from '@/lib/server-auth';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await getServerAuthContext();
  // In a real app, you might have more granular permissions for who can submit for review.
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const contentId = params.id;

  try {
    const content = await submitForReview(contentId);
    return NextResponse.json(content);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to submit for review' }, { status: 500 });
  }
}
