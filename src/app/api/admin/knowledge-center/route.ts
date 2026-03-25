import { NextRequest, NextResponse } from 'next/server';
import { createKnowledgeArticle, getKnowledgeArticlesWithFilters } from '@/lib/data';
import { AuthorizationError, requireAdminActionRequestContext } from '@/lib/server-auth';
import { isKnowledgeContentType, normalizeKnowledgeSlug, parseTagInput } from '@/lib/knowledge-center';
import { readJsonBody } from '@/lib/http';

export async function GET(request: NextRequest) {
  try {
    await requireAdminActionRequestContext(request, 'admin.knowledge.read');
  } catch (error) {
    const status = error instanceof AuthorizationError ? error.status : 401;
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : 'Unauthorized' }, { status });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const published = searchParams.get('published');
  const featured = searchParams.get('featured');
  const search = searchParams.get('search') ?? '';
  const sortBy = (searchParams.get('sortBy') as 'updatedAt' | 'createdAt' | 'publishedAt' | null) ?? 'updatedAt';
  const sortDirection = (searchParams.get('sortDirection') as 'asc' | 'desc' | null) ?? 'desc';

  const articles = await getKnowledgeArticlesWithFilters({
    type: type && isKnowledgeContentType(type) ? type : undefined,
    published: published === null ? undefined : published === 'true',
    featured: featured === null ? undefined : featured === 'true',
    search,
    sortBy,
    sortDirection,
  });

  return NextResponse.json({ data: articles });
}

export async function POST(request: NextRequest) {
  let auth;
  try {
    auth = await requireAdminActionRequestContext(request, 'admin.knowledge.manage');
  } catch (error) {
    const status = error instanceof AuthorizationError ? error.status : 401;
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : 'Unauthorized' }, { status });
  }

  const parsed = await readJsonBody<Record<string, unknown>>(request);
  if (!parsed.ok) {
    return parsed.response;
  }

  const payload = parsed.data;
  if (!isKnowledgeContentType(payload.type)) {
    return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
  }

  const article = await createKnowledgeArticle({
    title: String(payload.title ?? '').trim(),
    slug: normalizeKnowledgeSlug(String(payload.slug ?? '')),
    excerpt: String(payload.excerpt ?? '').trim(),
    content: String(payload.content ?? '').trim(),
    contentType: payload.type,
    tags: Array.isArray(payload.tags) ? payload.tags : parseTagInput(String(payload.tags ?? '')),
    authorId: auth.userId,
    authorName: payload.authorName ? String(payload.authorName).trim() : undefined,
    published: Boolean(payload.published),
    featured: Boolean(payload.featured),
    imageUrl: payload.imageUrl ? String(payload.imageUrl).trim() : undefined,
    seoTitle: payload.seoTitle ? String(payload.seoTitle).trim() : undefined,
    seoDescription: payload.seoDescription ? String(payload.seoDescription).trim() : undefined,
    externalLink: payload.externalLink ? String(payload.externalLink).trim() : undefined,
    ctaLabel: payload.ctaLabel ? String(payload.ctaLabel).trim() : undefined,
  }, auth.userId);

  return NextResponse.json({ data: article }, { status: 201 });
}
