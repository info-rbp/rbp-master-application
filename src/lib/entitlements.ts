
import type {
  BillingCycle,
  ContentTypeKey,
  EntitlementAccessFields,
  MembershipAccessGrant,
  MembershipPlan,
  MembershipPlanCode,
  MembershipStatus,
  MembershipTier,
  Subscription,
  ToolsAccessLevel,
} from './definitions';

const TIER_ORDER: Record<MembershipTier, number> = {
  basic: 1,
  standard: 2,
  premium: 3,
};

export type EntitlementFeatureKey =
  | 'docshare_templates'
  | 'docshare_companion_guides'
  | 'docshare_documentation_suites'
  | 'docshare_end_to_end_processes'
  | 'docshare_tools'
  | 'docshare_tools_access_level'
  | 'customisation_requests'
  | 'customisation_requests_limit_per_month'
  | 'partner_top_offers'
  | 'partner_exclusive_offers'
  | 'discovery_calls'
  | 'strategic_checkups'
  | 'service_discount_percent'
  | 'knowledge_center'
  | 'implementation_support'
  // New tool-specific keys
  | 'tool_planner'
  | 'tool_crm'
  | 'tool_automation'
  | 'tool_knowledge_assistant'
  | 'tool_reporting';

export type TierEntitlements = {
  docshare_templates: boolean;
  docshare_companion_guides: boolean;
  docshare_documentation_suites: boolean;
  docshare_end_to_end_processes: boolean;
  docshare_tools: boolean;
  docshare_tools_access_level: ToolsAccessLevel;
  customisation_requests: boolean;
  customisation_requests_limit_per_month: number | 'unlimited';
  partner_top_offers: boolean;
  partner_exclusive_offers: boolean;
  discovery_calls: boolean;
  strategic_checkups: boolean;
  service_discount_percent: number;
  knowledge_center: boolean;
  implementation_support: boolean;
  // New tool-specific entitlements
  tool_planner: boolean;
  tool_crm: boolean;
  tool_automation: boolean;
  tool_knowledge_assistant: boolean;
  tool_reporting: boolean;
};

export const ENTITLEMENT_MATRIX: Record<MembershipTier, TierEntitlements> = {
  basic: {
    docshare_templates: true,
    docshare_companion_guides: true,
    docshare_documentation_suites: false,
    docshare_end_to_end_processes: false,
    docshare_tools: true,
    docshare_tools_access_level: 'limited',
    customisation_requests: false,
    customisation_requests_limit_per_month: 0,
    partner_top_offers: true,
    partner_exclusive_offers: false,
    discovery_calls: true,
    strategic_checkups: false,
    service_discount_percent: 5,
    knowledge_center: true,
    implementation_support: false,
    tool_planner: true,
    tool_crm: false,
    tool_automation: false,
    tool_knowledge_assistant: false,
    tool_reporting: false,
  },
  standard: {
    docshare_templates: true,
    docshare_companion_guides: true,
    docshare_documentation_suites: true,
    docshare_end_to_end_processes: false,
    docshare_tools: true,
    docshare_tools_access_level: 'full',
    customisation_requests: true,
    customisation_requests_limit_per_month: 1,
    partner_top_offers: true,
    partner_exclusive_offers: true,
    discovery_calls: true,
    strategic_checkups: false,
    service_discount_percent: 12.5,
    knowledge_center: true,
    implementation_support: false,
    tool_planner: true,
    tool_crm: true,
    tool_automation: true,
    tool_knowledge_assistant: false,
    tool_reporting: true,
  },
  premium: {
    docshare_templates: true,
    docshare_companion_guides: true,
    docshare_documentation_suites: true,
    docshare_end_to_end_processes: true,
    docshare_tools: true,
    docshare_tools_access_level: 'full',
    customisation_requests: true,
    customisation_requests_limit_per_month: 'unlimited',
    partner_top_offers: true,
    partner_exclusive_offers: true,
    discovery_calls: true,
    strategic_checkups: true,
    service_discount_percent: 20,
    knowledge_center: true,
    implementation_support: true,
    tool_planner: true,
    tool_crm: true,
    tool_automation: true,
    tool_knowledge_assistant: true,
    tool_reporting: true,
  },
};

// ... (rest of the file remains the same until canAccessTool)

function isTierActive(status: MembershipStatus | string | null | undefined): boolean {
  const normalized = String(status ?? '').toLowerCase();
  return normalized === 'active' || normalized === 'pending';
}

function isGrantActive(grant: Pick<MembershipAccessGrant, 'status' | 'grantStartAt' | 'grantEndAt'>, now = new Date()): boolean {
  if (grant.status !== 'active') return false;
  const start = new Date(grant.grantStartAt);
  const end = new Date(grant.grantEndAt);
  return start <= now && now <= end;
}

export function compareMembershipTier(a: MembershipTier, b: MembershipTier): number {
  return TIER_ORDER[a] - TIER_ORDER[b];
}

export function getHigherMembershipTier(a: MembershipTier, b: MembershipTier): MembershipTier {
  return compareMembershipTier(a, b) >= 0 ? a : b;
}

export function resolvePlanCodeToTier(planCode: MembershipPlanCode): MembershipTier {
  return MEMBERSHIP_PLAN_DEFINITIONS[planCode].tier;
}

export function resolvePlanCodeToBillingCycle(planCode: MembershipPlanCode): BillingCycle {
  return MEMBERSHIP_PLAN_DEFINITIONS[planCode].billingCycle;
}

export function inferPlanCodeFromPlan(plan: Pick<MembershipPlan, 'code' | 'tier' | 'billingCycle'>): MembershipPlanCode {
  if (plan.code) return plan.code;
  const found = Object.values(MEMBERSHIP_PLAN_DEFINITIONS).find((candidate) => candidate.tier === plan.tier && candidate.billingCycle === plan.billingCycle);
  return found?.code ?? 'basic_free';
}

export function getEffectiveMembershipTier(input: {
  membershipTier?: MembershipTier | null;
  membershipStatus?: MembershipStatus | string | null;
  planCode?: MembershipPlanCode | null;
  subscription?: Pick<Subscription, 'membershipTier' | 'status'> | null;
  grants?: MembershipAccessGrant[];
  now?: Date;
}): MembershipTier {
  const now = input.now ?? new Date();
  let effectiveTier: MembershipTier = 'basic';

  if (input.subscription && isTierActive(input.subscription.status)) {
    effectiveTier = input.subscription.membershipTier;
  } else if (input.planCode && isTierActive(input.membershipStatus)) {
    effectiveTier = resolvePlanCodeToTier(input.planCode);
  } else if (input.membershipTier && isTierActive(input.membershipStatus)) {
    effectiveTier = input.membershipTier;
  }

  for (const grant of input.grants ?? []) {
    if (!isGrantActive(grant, now)) continue;
    effectiveTier = getHigherMembershipTier(effectiveTier, grant.grantTier);
  }

  return effectiveTier;
}

export function hasFeatureAccess(tier: MembershipTier, feature: EntitlementFeatureKey): boolean {
  const value = ENTITLEMENT_MATRIX[tier][feature];
  return typeof value === 'boolean' ? value : Boolean(value);
}

export function getFeatureValue<T extends EntitlementFeatureKey>(tier: MembershipTier, feature: T): TierEntitlements[T] {
  return ENTITLEMENT_MATRIX[tier][feature];
}

export function canAccessTool(input: {
  currentTier: MembershipTier;
  requiredTier: MembershipTier;
  isAuthenticated: boolean;
  accountStatus?: "active" | "suspended";
}) {
  if (!input.isAuthenticated) return { allowed: false, reason: "requires_login" };
  if (input.accountStatus === "suspended") return { allowed: false, reason: "suspended" };
  if (compareMembershipTier(input.currentTier, input.requiredTier) < 0) {
    return { allowed: false, reason: "insufficient_tier" };
  }
  return { allowed: true, reason: "ok" };
}

// ... (rest of the file)
