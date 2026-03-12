import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { RenderableContentObject } from '@/lib/content-objects';

export function ContentDetailShell({ content }: { content: RenderableContentObject }) {
  return (
    <article className="container mx-auto px-4 md:px-6 py-16 max-w-4xl space-y-8">
      <header className="space-y-3">
        <p className="text-sm text-muted-foreground uppercase tracking-wide">{content.contentType.replaceAll('_', ' ')}</p>
        <h1 className="text-4xl font-bold">{content.title}</h1>
        {content.summary ? <p className="text-muted-foreground text-lg">{content.summary}</p> : null}
      </header>
      {content.description ? <p className="whitespace-pre-wrap text-base leading-7">{content.description}</p> : null}
      {content.actionTarget ? (
        <div>
          <Button asChild>
            <Link href={content.actionTarget}>{content.actionLabel ?? 'Continue'}</Link>
          </Button>
        </div>
      ) : null}
    </article>
  );
}
