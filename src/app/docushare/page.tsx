import { buildSeoMetadata } from '@/lib/seo';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getDocumentSuites, getDocuShareSectionContent } from '@/lib/data';
import { filterPublishedDocushareSuites } from '@/lib/public-catalogue';

const fallbackCategories = [
  { title: 'Templates', description: 'Ready-to-use business documents.', href: '/docushare/templates' },
  { title: 'Companion Guides', description: 'How-to instructions for implementation.', href: '/docushare/companion-guides' },
  { title: 'Documentation Suites', description: 'Curated bundles for business functions.', href: '/docushare/documentation-suites' },
  { title: 'End-to-End Processes', description: 'Comprehensive workflow documentation.', href: '/docushare/end-to-end-processes' },
  { title: 'Customisation Service', description: 'Tailored documentation support.', href: '/docushare/customisation-service' },
];

export const metadata = buildSeoMetadata({ title: 'DocuShare', description: 'Browse templates, guides, suites, and process documentation.', path: '/docushare' });

export const revalidate = 300;

export default async function DocuShareLandingPage() {
  let content: Awaited<ReturnType<typeof getDocuShareSectionContent>> = null;
  let allSuites: Awaited<ReturnType<typeof getDocumentSuites>> = [];

  try {
    [content, allSuites] = await Promise.all([getDocuShareSectionContent('landing'), getDocumentSuites()]);
  } catch (error) {
    console.error('Failed to load DocuShare landing content', error);
  }

  const suites = filterPublishedDocushareSuites(allSuites);
  const countByType = (type: string) => suites.filter((suite) => suite.contentType === type).length;
  const categories = content?.sections?.[0]?.items?.length ? content.sections[0].items : fallbackCategories;

  return (
    <div>
      <section className="relative w-full py-20 md:py-32 lg:py-40 bg-muted/40">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">{content?.title ?? 'DocuShare Portal'}</h1>
          <p className="mt-6 text-lg text-muted-foreground md:text-xl max-w-3xl mx-auto">{content?.description ?? 'Browse published templates, guides, suites, and processes in one resource catalogue.'}</p>
          <div className="mt-8"><Button asChild size="lg"><Link href={content?.ctaHref ?? '/docushare/templates'}>{content?.ctaLabel ?? 'Browse the library'}</Link></Button></div>
        </div>
      </section>
      <section className="w-full py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6"><div className="grid gap-8 mt-12 md:grid-cols-2 lg:grid-cols-3">{categories.map((category) => <Card key={category.title} className="flex flex-col"><CardHeader><CardTitle>{category.title}</CardTitle></CardHeader><CardContent className="flex-grow space-y-3"><CardDescription>{category.description}</CardDescription><p className="text-sm text-muted-foreground">Published suites: {category.href?.includes('templates') ? countByType('templates') : category.href?.includes('companion-guides') ? countByType('companion-guides') : category.href?.includes('documentation-suites') ? countByType('documentation-suites') : category.href?.includes('end-to-end-processes') ? countByType('end-to-end-processes') : 'Service page'}</p></CardContent><CardContent><Button variant="outline" asChild><Link href={category.href ?? '/docushare'}>Browse category</Link></Button></CardContent></Card>)}</div></div>
      </section>
    </div>
  );
}
