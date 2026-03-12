'use server';

import { revalidatePath } from 'next/cache';
import { upsertPromotion, type PromotionType } from '@/lib/admin-operations';

export async function upsertPromotionAction(input: {
  id?: string;
  title: string;
  type: PromotionType;
  description?: string;
  active: boolean;
  targetTier?: 'basic' | 'standard' | 'premium';
  startsAt?: string | null;
  endsAt?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await upsertPromotion(input);
  revalidatePath('/admin/promotions');
}
