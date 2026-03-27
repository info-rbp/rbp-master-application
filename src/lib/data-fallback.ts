import type { Testimonial, KnowledgeArticle } from './definitions';

const TESTIMONIALS_FALLBACK: Testimonial[] = [
    {
        id: 'fallback-testimonial-1',
        clientName: 'John Doe',
        company: 'Acme Inc.',
        content: 'This is a fallback testimonial. The service is great!',
        role: 'CEO',
        active: true,
        imageUrl: '/placeholder-user.png',
        displayOrder: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }
];

const KNOWLEDGE_ARTICLES_FALLBACK: KnowledgeArticle[] = [
    {
        id: 'fallback-article-1',
        title: 'Fallback Featured Resource',
        slug: 'fallback-featured-resource',
        summary: 'This is a fallback featured resource. It appears when the database is not available.',
        content: '<p>This is the full content of the fallback featured resource.</p>',
        published: true,
        featured: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        category: 'general',
        contentType: 'article',
        tags: ['fallback'],
    }
];

export const isFirestoreUnavailable = (): boolean => {
  return process.env.DISABLE_FIRESTORE === 'true';
};

export const getPublishedTestimonialsFallback = (): Testimonial[] => {
  console.log('Firestore is unavailable, returning fallback testimonials.');
  return TESTIMONIALS_FALLBACK;
};

export const getKnowledgeArticlesFallback = (): KnowledgeArticle[] => {
  console.log('Firestore is unavailable, returning fallback knowledge articles.');
  return KNOWLEDGE_ARTICLES_FALLBACK;
};
