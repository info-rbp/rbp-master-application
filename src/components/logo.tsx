import { cn } from '@/lib/utils';
import { Layers } from 'lucide-react';

export default function Logo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground',
        className
      )}
    >
      <Layers className="h-6 w-6" />
      <span className="sr-only">DocShare Portal</span>
    </div>
  );
}
