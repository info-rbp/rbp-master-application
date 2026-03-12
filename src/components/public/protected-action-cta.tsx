'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MembershipTier } from '@/lib/definitions';
import { buildAuthRedirectPath } from '@/lib/return-path';
import type { ProtectedActionType, ProtectedActionResult } from '@/lib/protected-actions';

type Props = {
  actionType: ProtectedActionType;
  slug?: string;
  defaultLabel: string;
};

function tierLabel(tier: MembershipTier | undefined) {
  if (!tier) return 'membership';
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

function AccessRequirementNotice({ result }: { result: ProtectedActionResult }) {
  if (result.decision === 'requiresMembership') {
    return <p className="text-sm text-muted-foreground">Membership required. Join to unlock this action.</p>;
  }
  if (result.decision === 'requiresUpgrade') {
    return <p className="text-sm text-muted-foreground">Upgrade required: <strong>{tierLabel(result.requiredTier)}</strong>.</p>;
  }
  if (result.decision === 'limitedAccess') {
    return <p className="text-sm text-muted-foreground">Limited access available on your current plan.</p>;
  }
  return null;
}

export function ProtectedActionCTA({ actionType, slug, defaultLabel }: Props) {
  const pathname = usePathname();
  const [result, setResult] = useState<ProtectedActionResult | null>(null);
  const [loading, setLoading] = useState(false);

  const evaluate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/protected-actions/evaluate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ actionType, slug, returnTo: pathname }),
      });
      const payload = (await response.json()) as ProtectedActionResult;
      setResult(payload);

      if (payload.allowed && payload.actionUrl) {
        window.location.href = payload.actionUrl;
      }
    } finally {
      setLoading(false);
    }
  };

  const returnTo = pathname || '/';

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground"><Lock className="h-4 w-4" /> Protected action</div>
      <Button onClick={evaluate} disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {defaultLabel}
      </Button>
      {result?.decision === 'requiresLogin' ? (
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link href={buildAuthRedirectPath('/login', returnTo)}>Sign in</Link></Button>
          <Button variant="secondary" asChild><Link href={buildAuthRedirectPath('/signup', returnTo)}>Sign up</Link></Button>
        </div>
      ) : null}
      {result && (result.decision === 'requiresMembership' || result.decision === 'requiresUpgrade') ? (
        <Button variant="outline" asChild>
          <Link href="/membership">{result.decision === 'requiresUpgrade' ? `Upgrade to ${tierLabel(result.requiredTier)}` : 'Join membership'}</Link>
        </Button>
      ) : null}
      {result ? <AccessRequirementNotice result={result} /> : null}
    </div>
  );
}
