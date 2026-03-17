
import { NextRequest, NextResponse } from 'next/server';
import { createVersionedDocument, regenerateDocument, getDocumentWithVersions } from '@/lib/document-versioning';
import { getServerAuthContext } from '@/lib/server-auth';

export async function POST(request: NextRequest) {
  const auth = await getServerAuthContext();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { templateId, data } = await request.json();

  if (!templateId || !data) {
    return NextResponse.json({ error: 'Missing templateId or data' }, { status: 400 });
  }

  try {
    const document = await createVersionedDocument(auth.userId, templateId, data);
    return NextResponse.json(document);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await getServerAuthContext();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { documentId, data } = await request.json();

  if (!documentId || !data) {
    return NextResponse.json({ error: 'Missing documentId or data' }, { status: 400 });
  }

  try {
    const document = await regenerateDocument(documentId, data);
    return NextResponse.json(document);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to regenerate document' }, { status: 500 });
  }
}
