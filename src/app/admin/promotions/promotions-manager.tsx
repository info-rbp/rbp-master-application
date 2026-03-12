'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { AdminPromotion, PromotionType } from '@/lib/admin-operations';
import { upsertPromotionAction } from './server-actions';

const types: PromotionType[] = ['free_membership', 'discount_code', 'service_purchase', 'annual_plan'];

export function PromotionsManager({ initial, selectedType }: { initial: AdminPromotion[]; selectedType?: PromotionType }) {
  const [rows, setRows] = useState(initial);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-2">
          <h3 className="font-semibold">Create promotion</h3>
          <div className="grid gap-2 md:grid-cols-5">
            <Input placeholder="Title" id="promo-title" />
            <select id="promo-type" className="h-10 rounded-md border px-3" defaultValue={selectedType ?? 'free_membership'}>{types.map((type) => <option key={type} value={type}>{type}</option>)}</select>
            <select id="promo-tier" className="h-10 rounded-md border px-3" defaultValue="standard"><option value="basic">basic</option><option value="standard">standard</option><option value="premium">premium</option></select>
            <Input placeholder="Starts at (ISO)" id="promo-start" />
            <Input placeholder="Ends at (ISO)" id="promo-end" />
          </div>
          <Textarea id="promo-description" placeholder="Description and operating notes" />
          <Button disabled={pending} onClick={() => {
            const title = (document.getElementById('promo-title') as HTMLInputElement).value;
            const type = (document.getElementById('promo-type') as HTMLSelectElement).value as PromotionType;
            const targetTier = (document.getElementById('promo-tier') as HTMLSelectElement).value as 'basic' | 'standard' | 'premium';
            const startsAt = (document.getElementById('promo-start') as HTMLInputElement).value || null;
            const endsAt = (document.getElementById('promo-end') as HTMLInputElement).value || null;
            const description = (document.getElementById('promo-description') as HTMLTextAreaElement).value;
            if (!title.trim()) return;
            startTransition(async () => {
              await upsertPromotionAction({ title, type, targetTier, startsAt, endsAt, description, active: true });
            });
          }}>Save promotion</Button>
        </CardContent>
      </Card>

      {rows.map((row) => (
        <Card key={row.id}>
          <CardContent className="p-4 flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">{row.title}</p>
              <p className="text-sm text-muted-foreground">{row.type} • tier: {row.targetTier ?? 'n/a'}</p>
              <p className="text-xs text-muted-foreground">{row.description ?? 'No description provided.'}</p>
            </div>
            <Button size="sm" variant="outline" disabled={pending} onClick={() => startTransition(async () => {
              await upsertPromotionAction({ id: row.id, title: row.title, type: row.type, description: row.description, targetTier: row.targetTier, startsAt: row.startsAt, endsAt: row.endsAt, active: !row.active });
              setRows((prev) => prev.map((item) => (item.id === row.id ? { ...item, active: !item.active } : item)));
            })}>{row.active ? 'Deactivate' : 'Activate'}</Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
