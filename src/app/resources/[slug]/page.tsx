import { buildSeoMetadata } from '@/lib/seo';
import { InArticleCta } from '@/components/resources-hub';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// This is a placeholder for fetching a single article
const getArticleBySlug = (slug: string) => {
  // In a real app, you would fetch this from a CMS
  const articles = [
        {
            id: 'art-001',
            title: '5 Common Financial Mistakes Small Businesses Make',
            summary: 'Avoid these common pitfalls to ensure the financial health and stability of your business.',
            slug: '5-common-financial-mistakes',
            category: 'finance',
            content: `
<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam. Sed nisi. Nulla quis sem at nibh elementum imperdiet. Duis sagittis ipsum. Praesent mauris. Fusce nec tellus sed augue semper porta. Mauris massa. Vestibulum lacinia arcu eget nulla. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.</p>
<p>Curabitur sodales ligula in libero. Sed dignissim lacinia nunc. Curabitur tortor. Pellentesque nibh. Aenean quam. In scelerisque sem at dolor. Maecenas mattis. Sed convallis tristique sem. Proin ut ligula vel nunc egestas porttitor. Morbi lectus risus, iaculis vel, suscipit quis, luctus non, massa. Fusce ac turpis quis ligula lacinia aliquet. Mauris ipsum.</p>
`
        },
        {
            id: 'res-001',
            title: 'The Ultimate Guide to Strategic Business Planning',
            summary: 'Learn how to create a robust business plan that aligns with your strategic goals and drives growth.',
            slug: 'the-ultimate-guide-to-strategic-business-planning',
            category: 'strategy',
            content: `
<p>This is the full content for the strategic planning guide. It would be much longer in a real application.</p>
<p>Here are some key sections:</p>
<ul>
    <li>Market Analysis</li>
    <li>Competitive Landscape</li>
    <li>Financial Projections</li>
</ul>
`
        }
  ];
  return articles.find(article => article.slug === slug);
};

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const article = getArticleBySlug(params.slug);
  if (!article) {
    return {};
  }
  return buildSeoMetadata({
    title: article.title,
    description: article.summary,
    path: `/resources/${article.slug}`
  });
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const article = getArticleBySlug(params.slug);

  if (!article) {
    return <div>Article not found</div>;
  }

  return (
    <article className="container mx-auto px-4 md:px-6 py-16">
        <div className="max-w-3xl mx-auto">
            <Link href="/resources" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-2 mb-4"><ArrowLeft size={14}/> Back to Resources</Link>
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl mb-4">{article.title}</h1>
            <p className="text-lg text-muted-foreground mb-8">{article.summary}</p>

            {/* Article content would be rendered here from a CMS */}
            <div className="prose lg:prose-xl max-w-none" dangerouslySetInnerHTML={{ __html: article.content }} />

            <InArticleCta />
        </div>
    </article>
  );
}
