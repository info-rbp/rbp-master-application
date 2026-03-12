import type { MetadataRoute } from 'next';
import { getBaseUrl } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  const host = getBaseUrl();
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/docushare', '/knowledge-center', '/partner-offers', '/services', '/membership', '/search'],
      disallow: ['/admin', '/portal', '/api', '/dashboard'],
    },
    sitemap: `${host}/sitemap.xml`,
    host,
  };
}
