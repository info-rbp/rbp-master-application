import { cn } from '@/lib/utils';

export default function Logo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground',
        className
      )}
    >
      <span className="text-xl font-bold tracking-tighter">RBP</span>
      <span className="sr-only">Remote Business Partner</span>
    </div>
  );
}
