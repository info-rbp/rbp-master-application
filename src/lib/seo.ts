import type { Metadata } from 'next';

const DEFAULT_SITE_NAME = 'Remote Business Partner';
const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || 'http://localhost:3000';

export function getBaseUrl() {
  return baseUrl;
}

export function buildCanonicalUrl(path = '/') {
  return new URL(path, getBaseUrl()).toString();
}

export function buildSeoMetadata(input: {
  title: string;
  description: string;
  path?: string;
  noIndex?: boolean;
  keywords?: string[];
}): Metadata {
  const canonical = buildCanonicalUrl(input.path ?? '/');
  const title = input.title.includes(DEFAULT_SITE_NAME) ? input.title : `${input.title} | ${DEFAULT_SITE_NAME}`;

  return {
    title,
    description: input.description,
    keywords: input.keywords,
    metadataBase: new URL(getBaseUrl()),
    alternates: { canonical },
    openGraph: {
      title,
      description: input.description,
      url: canonical,
      siteName: DEFAULT_SITE_NAME,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: input.description,
    },
    robots: input.noIndex ? { index: false, follow: false } : { index: true, follow: true },
  };
}

export function buildContentMetadata(content: { title: string; summary?: string; description?: string; slug?: string }, path: string): Metadata {
  return buildSeoMetadata({
    title: content.title,
    description: content.summary ?? content.description ?? 'Catalogue content from Remote Business Partner.',
    path,
  });
}
