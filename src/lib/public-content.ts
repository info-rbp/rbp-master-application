import { firestore } from '@/firebase/server';
import type { EntitlementAccessFields } from './definitions';

const toIsoString = (value: unknown): string => {
  if (!value) return new Date().toISOString();
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return new Date().toISOString();
};

export type PublicContentItem = {
  entitlement?: EntitlementAccessFields;
  title: string;
  description?: string;
  href?: string;
  imageUrl?: string;
  order?: number;
};

export type PublicPageContent = {
  entitlement?: EntitlementAccessFields;
  slug: string;
  title: string;
  description: string;
  eyebrow?: string;
  heroImageUrl?: string;
  ctaLabel?: string;
  ctaHref?: string;
  sections?: Array<{ id: string; title: string; description?: string; items?: PublicContentItem[] }>;
  published: boolean;
  seoTitle?: string;
  seoDescription?: string;
  updatedAt: string;
};

export type ManagedServicePage = {
  entitlement?: EntitlementAccessFields;
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  heroImageUrl?: string;
  features: PublicContentItem[];
  benefits: PublicContentItem[];
  overview?: string;
  problemsSolved?: string[];
  inclusionsSummary?: string;
  serviceInclusions?: string[];
  membershipDiscountMessage?: string;
  discoveryCallBooking?: string;
  relatedContent?: Array<{ id: string; contentType: string; label?: string; path?: string }>;
  ctaLabel?: string;
  ctaHref?: string;
  displayOrder: number;
  published: boolean;
};

export type ManagedFaq = {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  published: boolean;
};

function mapDocToManagedServicePage(doc: any): ManagedServicePage | null {
  const data = doc.data();
  if (!data) return null;

  const slug = String(data.slug ?? doc.id);
  const mapItems = (items: unknown): PublicContentItem[] =>
    Array.isArray(items)
      ? items.map((item: Record<string, unknown>, index: number) => ({
          title: String(item.title ?? ''),
          description: item.description ? String(item.description) : undefined,
          href: item.href ? String(item.href) : undefined,
          imageUrl: item.imageUrl ? String(item.imageUrl) : undefined,
          order: typeof item.order === 'number' ? item.order : index,
          entitlement: item.entitlement as EntitlementAccessFields | undefined,
        }))
      : [];

  return {
    id: doc.id,
    slug,
    title: String(data.title ?? ''),
    shortDescription: String(data.shortDescription ?? ''),
    heroImageUrl: data.heroImageUrl ? String(data.heroImageUrl) : undefined,
    features: mapItems(data.features),
    benefits: mapItems(data.benefits),
    overview: data.overview ? String(data.overview) : undefined,
    problemsSolved: Array.isArray(data.problemsSolved) ? data.problemsSolved.map((item: unknown) => String(item)) : [],
    inclusionsSummary: data.inclusionsSummary ? String(data.inclusionsSummary) : undefined,
    serviceInclusions: Array.isArray(data.serviceInclusions) ? data.serviceInclusions.map((item: unknown) => String(item)) : [],
    membershipDiscountMessage: data.membershipDiscountMessage ? String(data.membershipDiscountMessage) : undefined,
    discoveryCallBooking: data.discoveryCallBooking ? String(data.discoveryCallBooking) : undefined,
    relatedContent: Array.isArray(data.relatedContent) ? data.relatedContent as Array<{ id: string; contentType: string; label?: string; path?: string }> : [],
    ctaLabel: data.ctaLabel ? String(data.ctaLabel) : undefined,
    ctaHref: data.ctaHref ? String(data.ctaHref) : undefined,
    displayOrder: typeof data.displayOrder === 'number' ? data.displayOrder : 0,
    published: Boolean(data.published),
    entitlement: data.entitlement as EntitlementAccessFields | undefined,
  };
}

async function getSitePage(slug: string): Promise<PublicPageContent | null> {
  const snap = await firestore.collection('site_pages').where('slug', '==', slug).where('published', '==', true).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  const data = doc.data();
  const sections = Array.isArray(data.sections)
    ? data.sections.map((section: Record<string, unknown>, index: number) => ({
        id: String(section.id ?? `section-${index}`),
        title: String(section.title ?? ''),
        description: section.description ? String(section.description) : undefined,
        items: Array.isArray(section.items)
          ? section.items.map((item: Record<string, unknown>, itemIndex: number) => ({
              title: String(item.title ?? ''),
              description: item.description ? String(item.description) : undefined,
              href: item.href ? String(item.href) : undefined,
              imageUrl: item.imageUrl ? String(item.imageUrl) : undefined,
              order: typeof item.order === 'number' ? item.order : itemIndex,
              entitlement: item.entitlement as EntitlementAccessFields | undefined,
            }))
          : [],
      }))
    : [];

  return {
    slug: String(data.slug ?? slug),
    title: String(data.title ?? ''),
    description: String(data.description ?? ''),
    eyebrow: data.eyebrow ? String(data.eyebrow) : undefined,
    heroImageUrl: data.heroImageUrl ? String(data.heroImageUrl) : undefined,
    ctaLabel: data.ctaLabel ? String(data.ctaLabel) : undefined,
    ctaHref: data.ctaHref ? String(data.ctaHref) : undefined,
    sections,
    published: Boolean(data.published),
    seoTitle: data.seoTitle ? String(data.seoTitle) : undefined,
    seoDescription: data.seoDescription ? String(data.seoDescription) : undefined,
    updatedAt: toIsoString(data.updatedAt),
    entitlement: data.entitlement as EntitlementAccessFields | undefined,
  };
}

export async function getHomepageContent() {
  return getSitePage('home');
}

export async function getPageContentBySlug(slug: string) {
  return getSitePage(slug);
}

export async function getServicesLandingContent() {
  return getSitePage('services');
}

export async function getMembershipPageContent() {
  return getSitePage('membership');
}

export async function getDocuShareSectionContent(slug: string) {
  return getSitePage(`docushare-${slug}`);
}

export async function getKnowledgeLandingContent() {
  return getSitePage('knowledge-center');
}

export async function getServicePageBySlug(slug: string): Promise<ManagedServicePage | null> {
  const snap = await firestore.collection('service_pages').where('slug', '==', slug).where('published', '==', true).limit(1).get();
  if (snap.empty) return null;
  return mapDocToManagedServicePage(snap.docs[0]);
}

export async function getPublishedServicePages(): Promise<ManagedServicePage[]> {
  const snap = await firestore.collection('service_pages').where('published', '==', true).orderBy('displayOrder', 'asc').get();
  const rows = snap.docs.map(mapDocToManagedServicePage);
  return rows.filter((x): x is ManagedServicePage => Boolean(x));
}

export async function getFAQsByCategory(category: string): Promise<ManagedFaq[]> {
  const snap = await firestore.collection('faqs').where('category', '==', category).where('published', '==', true).orderBy('order', 'asc').get();
  return snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      question: String(data.question ?? ''),
      answer: String(data.answer ?? ''),
      category: String(data.category ?? category),
      order: typeof data.order === 'number' ? data.order : 0,
      published: Boolean(data.published),
    };
  });
}
