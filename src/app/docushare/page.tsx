import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getDocuShareSectionContent } from '@/lib/data';

const fallbackCategories = [
  { title: 'Templates', description: 'Ready-to-use business documents.', href: '/docushare/templates' },
  { title: 'Companion Guides', description: 'How-to instructions for implementation.', href: '/docushare/companion-guides' },
  { title: 'Documentation Suites', description: 'Curated bundles for business functions.', href: '/docushare/documentation-suites' },
  { title: 'End-to-End Processes', description: 'Comprehensive workflow documentation.', href: '/docushare/end-to-end-processes' },
  { title: 'Customisation Service', description: 'Tailored documentation support.', href: '/docushare/customisation-service' },
];

export default async function DocuShareLandingPage() {
  const content = await getDocuShareSectionContent('landing');
  const categories = content?.sections?.[0]?.items?.length ? content.sections[0].items : fallbackCategories;

  return (
    <div>
      <section className="relative w-full py-20 md:py-32 lg:py-40 bg-muted/40">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">{content?.title ?? 'DocuShare Portal'}</h1>
          <p className="mt-6 text-lg text-muted-foreground md:text-xl max-w-3xl mx-auto">{content?.description ?? 'Streamline operations with practical documents, guides, and process suites.'}</p>
          <div className="mt-8"><Button asChild size="lg"><Link href={content?.ctaHref ?? '/portal'}>{content?.ctaLabel ?? 'Access the Document Hub'}</Link></Button></div>
        </div>
      </section>
      <section className="w-full py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6"><div className="grid gap-8 mt-12 md:grid-cols-2 lg:grid-cols-3">{categories.map((category) => <Card key={category.title} className="flex flex-col"><CardHeader><CardTitle>{category.title}</CardTitle></CardHeader><CardContent className="flex-grow"><CardDescription>{category.description}</CardDescription></CardContent><CardContent><Button variant="outline" asChild><Link href={category.href ?? '/docushare'}>Learn More <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></CardContent></Card>)}</div></div>
      </section>
    </div>
  );
}
