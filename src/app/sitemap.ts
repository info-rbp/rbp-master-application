import type { MetadataRoute } from 'next';
import { getBaseUrl } from '@/lib/seo';
import { getPublicDiscoveryItems } from '@/lib/discovery';

const STATIC_PUBLIC_PATHS = ['/', '/docushare', '/knowledge-center', '/partner-offers', '/services', '/membership', '/search', '/contact'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const items = await getPublicDiscoveryItems();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PUBLIC_PATHS.map((path) => ({
    url: `${baseUrl}${path}`,
    changeFrequency: path === '/' ? 'daily' : 'weekly',
    priority: path === '/' ? 1 : 0.7,
    lastModified: new Date(),
  }));

  const dynamicEntries: MetadataRoute.Sitemap = items
    .filter((item) => item.published)
    .map((item) => ({
      url: `${baseUrl}${item.path}`,
      lastModified: item.updatedAt ? new Date(item.updatedAt) : new Date(),
      changeFrequency: 'weekly',
      priority: item.featured ? 0.8 : 0.6,
    }));

  return [...staticEntries, ...dynamicEntries];
}
