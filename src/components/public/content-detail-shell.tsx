import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTemplateForContentType } from '@/lib/detail-templates';
import type { RenderableContentObject } from '@/lib/content-objects';

function AccessCta({ content }: { content: RenderableContentObject }) {
  const access = content.accessBehavior;
  const state = access?.requiresMembership
    ? 'Membership required'
    : access?.requiresLogin
      ? 'Login to access'
      : access?.previewEnabled
        ? 'Preview available'
        : 'Access available';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Access</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{state}</p>
        <p className="text-sm text-muted-foreground">
          {access?.accessTier ? `Tier: ${access.accessTier}` : 'Public availability depends on item settings.'}
        </p>
        {content.actionTarget ? (
          <Button asChild>
            <Link href={content.actionTarget}>{content.actionLabel ?? 'Continue'}</Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

function SectionBlock({ title, body, items }: { title: string; body?: string; items?: string[] }) {
  if (!body && (!items || items.length === 0)) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold">{title}</h2>
      {body ? <p className="text-muted-foreground whitespace-pre-wrap">{body}</p> : null}
      {items?.length ? (
        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function TemplateSections({ content }: { content: RenderableContentObject }) {
  const template = getTemplateForContentType(content.contentType);
  const fields = content.templateFields ?? {};

  return (
    <div className="space-y-8">
      {template.sections.map((section) => (
        <SectionBlock
          key={section.title}
          title={section.title}
          body={typeof fields[section.bodyKey] === 'string' ? (fields[section.bodyKey] as string) : undefined}
          items={Array.isArray(fields[section.listKey]) ? (fields[section.listKey] as string[]) : undefined}
        />
      ))}
    </div>
  );
}

function RelatedContent({ content }: { content: RenderableContentObject }) {
  if (!content.relatedContent.length) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold">Related content</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {content.relatedContent.map((item) => (
          <Card key={`${item.contentType}-${item.id}`}>
            <CardContent className="p-4 space-y-2">
              <p className="font-medium">{item.title ?? item.id}</p>
              <p className="text-xs text-muted-foreground">{item.contentType.replaceAll('_', ' ')}</p>
              {item.path ? (
                <Button size="sm" variant="outline" asChild>
                  <Link href={item.path}>View</Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function ContentDetailShell({ content }: { content: RenderableContentObject }) {
  return (
    <article className="container mx-auto px-4 md:px-6 py-16 max-w-5xl space-y-10">
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline">{content.contentType.replaceAll('_', ' ')}</Badge>
          {content.category ? <Badge variant="secondary">{content.category}</Badge> : null}
          {content.accessBehavior?.accessTier ? <Badge>{content.accessBehavior.accessTier}</Badge> : null}
          {content.tags.slice(0, 4).map((tag) => (
            <Badge key={tag} variant="outline">{tag}</Badge>
          ))}
        </div>
        <h1 className="text-4xl font-bold">{content.title}</h1>
        {content.summary ? <p className="text-muted-foreground text-lg">{content.summary}</p> : null}
        {content.accessBehavior?.previewEnabled && content.accessBehavior.previewContent ? (
          <Card className="bg-muted/40">
            <CardContent className="p-4 text-sm text-muted-foreground whitespace-pre-wrap">{content.accessBehavior.previewContent}</CardContent>
          </Card>
        ) : null}
      </header>

      <TemplateSections content={content} />
      {content.description ? <SectionBlock title="Overview" body={content.description} /> : null}
      <AccessCta content={content} />
      <RelatedContent content={content} />
    </article>
  );
}
