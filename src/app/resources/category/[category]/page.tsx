import { buildSeoMetadata } from '@/lib/seo';
import { ArticleCard } from '@/components/resources-hub';

// This is a placeholder for fetching data based on category
const getArticlesByCategory = (category: string) => {
  // In a real app, you would fetch this from a CMS
  const allArticles = [
    {
      id: 'art-001',
      title: '5 Common Financial Mistakes Small Businesses Make',
      summary: 'Avoid these common pitfalls to ensure the financial health and stability of your business.',
      slug: '5-common-financial-mistakes',
      category: 'finance'
    },
    {
      id: 'art-002',
      title: 'How to Build a High-Performing Operations Team',
      summary: 'A step-by-step guide to recruiting, training, and managing an operations team that drives results.',
      slug: 'how-to-build-a-high-performing-operations-team',
      category: 'operations'
    },
    {
      id: 'art-003',
      title: 'The Founder\'s Guide to Effective Marketing',
      summary: 'Learn the fundamentals of marketing and how to create a strategy that resonates with your target audience.',
      slug: 'the-founders-guide-to-effective-marketing',
      category: 'marketing'
    },
    {
        id: 'res-001',
        title: 'The Ultimate Guide to Strategic Business Planning',
        summary: 'Learn how to create a robust business plan that aligns with your strategic goals and drives growth. This guide covers everything from market analysis to financial projections.',
        slug: 'the-ultimate-guide-to-strategic-business-planning',
        category: 'strategy'
    }
  ];
  return allArticles.filter(article => article.category === category);
};

export async function generateMetadata({ params }: { params: { category: string } }) {
  const categoryName = params.category.charAt(0).toUpperCase() + params.category.slice(1);
  return buildSeoMetadata({
    title: `${categoryName} Resources`,
    description: `Browse our resources on the topic of ${categoryName}.`,
    path: `/resources/category/${params.category}`
  });
}

export default function ResourceCategoryPage({ params }: { params: { category: string } }) {
  const articles = getArticlesByCategory(params.category);
  const categoryName = params.category.charAt(0).toUpperCase() + params.category.slice(1);

  return (
    <div className="container mx-auto px-4 md:px-6 py-16">
      <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-center mb-4">{categoryName}</h1>
      <p className="text-lg text-muted-foreground md:text-xl text-center max-w-3xl mx-auto mb-12">Explore our collection of articles and guides on {categoryName}.</p>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {articles.length > 0 ? (
          articles.map(article => (
            <ArticleCard key={article.id} article={article} />
          ))
        ) : (
          <p className="text-center md:col-span-3">No articles found in this category.</p>
        )}
      </div>
    </div>
  );
}
