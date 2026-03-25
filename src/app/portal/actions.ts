'use server';

import { awardBadge } from '@/lib/gamification/badges';

export async function completeOnboardingAction(userId: string) {
  return awardBadge(userId, 'onboarding_complete');
}
