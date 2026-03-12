import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export type PublicCatalogueCardProps = {
  title: string;
  href: string;
  summary?: string;
  imageUrl?: string;
  category?: string;
  tags?: string[];
  requiredTier?: string;
  previewEnabled?: boolean;
  metadata?: string[];
  ctaLabel?: string;
};

export function PublicCatalogueCard({
  title,
  href,
  summary,
  imageUrl,
  category,
  tags = [],
  requiredTier,
  previewEnabled,
  metadata = [],
  ctaLabel = 'View details',
}: PublicCatalogueCardProps) {
  return (
    <Card className="flex h-full flex-col">
      {imageUrl ? (
        <div className="relative h-40 w-full overflow-hidden rounded-t-lg bg-muted">
          <Image src={imageUrl} alt={title} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover" />
        </div>
      ) : null}
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {category ? <Badge variant="secondary">{category}</Badge> : null}
          {requiredTier ? <Badge>Tier: {requiredTier}</Badge> : null}
          {typeof previewEnabled === 'boolean' ? (
            <Badge variant={previewEnabled ? 'default' : 'outline'}>{previewEnabled ? 'Preview available' : 'Preview unavailable'}</Badge>
          ) : null}
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow space-y-3 text-sm text-muted-foreground">
        {summary ? <p>{summary}</p> : <p>View this catalogue item for more details.</p>}
        {metadata.length > 0 ? <p>{metadata.join(' • ')}</p> : null}
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link href={href} aria-label={`${ctaLabel}: ${title}`}>
            {ctaLabel} <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
