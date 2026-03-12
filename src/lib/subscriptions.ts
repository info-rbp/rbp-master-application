import type { MembershipPlan } from './definitions';
import { resolvePlanCodeToBillingCycle, resolvePlanCodeToTier } from './entitlements';

export function validatePlanForSquareCheckout(plan: MembershipPlan | null | undefined) {
  if (!plan) return { ok: false as const, error: 'Membership plan not found.' };
  if (!plan.active) return { ok: false as const, error: 'Selected plan is not active.' };
  if (plan.billingCycle === 'free') {
    return { ok: false as const, error: 'Free plans do not require Square checkout.' };
  }
  if (!plan.squareSubscriptionPlanVariationId) {
    return { ok: false as const, error: 'Selected plan is missing Square subscription plan variation mapping.' };
  }
  return { ok: true as const };
}

export function normalizeMembershipStatusFromSquare(status: string | null | undefined) {
  const normalized = String(status ?? '').toUpperCase();
  if (normalized === 'ACTIVE') return 'active';
  if (normalized === 'CANCELED') return 'canceled';
  if (normalized === 'PAUSED') return 'suspended';
  if (normalized === 'DEACTIVATED') return 'lapsed';
  if (normalized === 'PENDING') return 'pending';
  return 'pending';
}

export function resolveMembershipTierFromPlan(plan: Pick<MembershipPlan, 'tier' | 'code'>) {
  return plan.tier ?? resolvePlanCodeToTier(plan.code);
}

export function resolveBillingCycleFromPlan(plan: Pick<MembershipPlan, 'billingCycle' | 'code'>) {
  return plan.billingCycle ?? resolvePlanCodeToBillingCycle(plan.code);
}
