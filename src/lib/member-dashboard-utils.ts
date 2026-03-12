import type { MembershipTier } from './definitions';
import { canAccessImplementationSupport, canBookStrategicCheckup, getCustomisationRequestAllowance } from './entitlements';

export function getCustomisationAllowanceSummary(tier: MembershipTier, usedThisMonth: number) {
  const allowance = getCustomisationRequestAllowance(tier);
  if (allowance === 'unlimited') return { allowance, remaining: 'unlimited' as const, canSubmit: true };
  const remaining = Math.max(0, allowance - usedThisMonth);
  return { allowance, remaining, canSubmit: remaining > 0 };
}

export function canSubmitImplementationSupport(tier: MembershipTier) {
  return canAccessImplementationSupport(tier);
}

export function canRequestCallType(tier: MembershipTier, callType: 'discovery_call' | 'strategic_checkup') {
  if (callType === 'discovery_call') return true;
  return canBookStrategicCheckup(tier);
}

export function shapeSubscriptionSummary(input: {
  planCode: string;
  tier: MembershipTier;
  billingCycle: string;
  renewalDate: string | null;
  endDate: string | null;
  lastPaymentStatus: string | null;
}) {
  return {
    ...input,
    renewalOrEndDate: input.renewalDate ?? input.endDate ?? 'Not scheduled',
    hasPaymentIssue: input.lastPaymentStatus === 'failed' || input.lastPaymentStatus === 'past_due',
  };
}
