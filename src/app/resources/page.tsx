import { buildSeoMetadata } from '@/lib/seo';
import {
  ResourcesHero,
  FeaturedResource,
  CategoryNav,
  ArticleCard
} from '@/components/resources-hub';

export const metadata = buildSeoMetadata({
  title: 'Resources',
  description: 'Explore our collection of articles, guides, and tools to help you grow your business.',
  path: '/resources'
});

// Placeholder Data
const featuredResource = {
  id: 'res-001',
  title: 'The Ultimate Guide to Strategic Business Planning',
  summary: 'Learn how to create a robust business plan that aligns with your strategic goals and drives growth. This guide covers everything from market analysis to financial projections.',
  slug: 'the-ultimate-guide-to-strategic-business-planning',
  category: 'Strategy'
};

const categories = [
  { id: 'cat-01', name: 'All', slug: '' },
  { id: 'cat-02', name: 'Strategy', slug: 'strategy' },
  { id: 'cat-03', name: 'Finance', slug: 'finance' },
  { id: 'cat-04', name: 'Operations', slug: 'operations' },
  { id: 'cat-05', name: 'Marketing', slug: 'marketing' }
];

const articles = [
  {
    id: 'art-001',
    title: '5 Common Financial Mistakes Small Businesses Make',
    summary: 'Avoid these common pitfalls to ensure the financial health and stability of your business.',
    slug: '5-common-financial-mistakes',
    category: 'Finance'
  },
  {
    id: 'art-002',
    title: 'How to Build a High-Performing Operations Team',
    summary: 'A step-by-step guide to recruiting, training, and managing an operations team that drives results.',
    slug: 'how-to-build-a-high-performing-operations-team',
    category: 'Operations'
  },
  {
    id: 'art-003',
    title: 'The Founder\'s Guide to Effective Marketing',
    summary: 'Learn the fundamentals of marketing and how to create a strategy that resonates with your target audience.',
    slug: 'the-founders-guide-to-effective-marketing',
    category: 'Marketing'
  }
];

export default function ResourcesHubPage() {
  return (
    <div>
      <ResourcesHero />
      <FeaturedResource resource={featuredResource} />
      <CategoryNav categories={categories} />
      <div className="container mx-auto px-4 md:px-6 py-16">
        <h2 className="text-3xl font-bold tracking-tight text-center mb-12">Latest Articles</h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {articles.map(article => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      </div>
    </div>
  );
}
