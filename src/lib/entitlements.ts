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
  | 'implementation_support';

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
  },
};

export type MembershipPlanDefinition = {
  code: MembershipPlanCode;
  tier: MembershipTier;
  billingCycle: BillingCycle;
  amount: number;
  currency: 'usd';
  displayName: string;
};

export const MEMBERSHIP_PLAN_DEFINITIONS: Record<MembershipPlanCode, MembershipPlanDefinition> = {
  basic_free: { code: 'basic_free', tier: 'basic', billingCycle: 'free', amount: 0, currency: 'usd', displayName: 'Basic' },
  standard_monthly: { code: 'standard_monthly', tier: 'standard', billingCycle: 'monthly', amount: 99, currency: 'usd', displayName: 'Standard Monthly' },
  standard_annual: { code: 'standard_annual', tier: 'standard', billingCycle: 'annual', amount: 999, currency: 'usd', displayName: 'Standard Annual' },
  premium_monthly: { code: 'premium_monthly', tier: 'premium', billingCycle: 'monthly', amount: 499, currency: 'usd', displayName: 'Premium Monthly' },
  premium_annual: { code: 'premium_annual', tier: 'premium', billingCycle: 'annual', amount: 4999, currency: 'usd', displayName: 'Premium Annual' },
};

export const CONTENT_ACCESS_DEFAULTS: Record<ContentTypeKey, EntitlementAccessFields> = {
  docshare_template: { accessTier: 'basic', requiresLogin: true, requiresMembership: true, previewEnabled: true, isLimitedAccess: false, contentType: 'docshare_template' },
  docshare_companion_guide: { accessTier: 'basic', requiresLogin: true, requiresMembership: true, previewEnabled: true, isLimitedAccess: false, contentType: 'docshare_companion_guide' },
  docshare_documentation_suite: { accessTier: 'standard', requiresLogin: true, requiresMembership: true, previewEnabled: true, isLimitedAccess: false, contentType: 'docshare_documentation_suite' },
  docshare_end_to_end_process: { accessTier: 'premium', requiresLogin: true, requiresMembership: true, previewEnabled: true, isLimitedAccess: false, contentType: 'docshare_end_to_end_process' },
  docshare_tool: { accessTier: 'basic', requiresLogin: true, requiresMembership: true, previewEnabled: true, isLimitedAccess: true, contentType: 'docshare_tool' },
  partner_offer_top: { accessTier: 'basic', requiresLogin: true, requiresMembership: true, previewEnabled: true, isLimitedAccess: false, contentType: 'partner_offer_top' },
  partner_offer_exclusive: { accessTier: 'standard', requiresLogin: true, requiresMembership: true, previewEnabled: true, isLimitedAccess: false, contentType: 'partner_offer_exclusive' },
  knowledge_center_article: { accessTier: 'basic', requiresLogin: false, requiresMembership: false, previewEnabled: true, isLimitedAccess: false, contentType: 'knowledge_center_article' },
  service_discovery_call: { accessTier: 'basic', requiresLogin: true, requiresMembership: true, previewEnabled: true, isLimitedAccess: false, contentType: 'service_discovery_call' },
  service_strategic_checkup: { accessTier: 'premium', requiresLogin: true, requiresMembership: true, previewEnabled: true, isLimitedAccess: false, contentType: 'service_strategic_checkup' },
  implementation_support: { accessTier: 'premium', requiresLogin: true, requiresMembership: true, previewEnabled: false, isLimitedAccess: false, contentType: 'implementation_support' },
};

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

export function getServiceDiscountPercent(tier: MembershipTier): number {
  return ENTITLEMENT_MATRIX[tier].service_discount_percent;
}

export function getCustomisationRequestAllowance(tier: MembershipTier): number | 'unlimited' {
  return ENTITLEMENT_MATRIX[tier].customisation_requests_limit_per_month;
}

export function canSubmitCustomisationRequest(tier: MembershipTier, usedThisMonth: number): boolean {
  const allowance = getCustomisationRequestAllowance(tier);
  if (allowance === 'unlimited') return true;
  return usedThisMonth < allowance;
}

export function canBookDiscoveryCall(tier: MembershipTier): boolean {
  return ENTITLEMENT_MATRIX[tier].discovery_calls;
}

export function canBookStrategicCheckup(tier: MembershipTier): boolean {
  return ENTITLEMENT_MATRIX[tier].strategic_checkups;
}

export function canAccessImplementationSupport(tier: MembershipTier): boolean {
  return ENTITLEMENT_MATRIX[tier].implementation_support;
}

export function canAccessOffer(tier: MembershipTier, offerType: 'top' | 'exclusive'): boolean {
  return offerType === 'top'
    ? ENTITLEMENT_MATRIX[tier].partner_top_offers
    : ENTITLEMENT_MATRIX[tier].partner_exclusive_offers;
}

export function canAccessServiceBenefit(tier: MembershipTier, benefit: 'discovery_call' | 'strategic_checkup' | 'implementation_support'): boolean {
  if (benefit === 'discovery_call') return canBookDiscoveryCall(tier);
  if (benefit === 'strategic_checkup') return canBookStrategicCheckup(tier);
  return canAccessImplementationSupport(tier);
}

export type ContentAccessResult = {
  canView: boolean;
  canUse: boolean;
  requiresLogin: boolean;
  requiresMembership: boolean;
  requiredTier: MembershipTier;
  currentTier: MembershipTier;
  accessLevel: ToolsAccessLevel | 'full';
  isLimitedAccess: boolean;
  reason: 'ok' | 'requires_login' | 'requires_membership' | 'insufficient_tier';
  upgradeTargetTier?: MembershipTier;
};

export function canAccessContent(input: {
  content: EntitlementAccessFields;
  isAuthenticated: boolean;
  currentTier: MembershipTier;
}): ContentAccessResult {
  const { content, isAuthenticated, currentTier } = input;

  if (content.requiresLogin && !isAuthenticated) {
    return {
      canView: content.previewEnabled,
      canUse: false,
      requiresLogin: true,
      requiresMembership: content.requiresMembership,
      requiredTier: content.accessTier,
      currentTier,
      accessLevel: 'none',
      isLimitedAccess: false,
      reason: 'requires_login',
      upgradeTargetTier: content.accessTier,
    };
  }

  if (!content.requiresMembership) {
    return {
      canView: true,
      canUse: true,
      requiresLogin: content.requiresLogin,
      requiresMembership: false,
      requiredTier: content.accessTier,
      currentTier,
      accessLevel: 'full',
      isLimitedAccess: false,
      reason: 'ok',
    };
  }

  if (compareMembershipTier(currentTier, content.accessTier) < 0) {
    return {
      canView: content.previewEnabled,
      canUse: false,
      requiresLogin: content.requiresLogin,
      requiresMembership: true,
      requiredTier: content.accessTier,
      currentTier,
      accessLevel: 'none',
      isLimitedAccess: false,
      reason: 'insufficient_tier',
      upgradeTargetTier: content.accessTier,
    };
  }

  const toolsLevel = content.contentType === 'docshare_tool' ? ENTITLEMENT_MATRIX[currentTier].docshare_tools_access_level : 'full';

  return {
    canView: true,
    canUse: true,
    requiresLogin: content.requiresLogin,
    requiresMembership: true,
    requiredTier: content.accessTier,
    currentTier,
    accessLevel: toolsLevel,
    isLimitedAccess: toolsLevel === 'limited',
    reason: 'ok',
  };
}

export function getEntitlementContextForUser(input: {
  isAuthenticated: boolean;
  membershipTier?: MembershipTier | null;
  membershipStatus?: MembershipStatus | string | null;
  planCode?: MembershipPlanCode | null;
  grants?: MembershipAccessGrant[];
  now?: Date;
}) {
  const tier = getEffectiveMembershipTier(input);
  return {
    tier,
    featureMatrix: ENTITLEMENT_MATRIX[tier],
    serviceDiscountPercent: getServiceDiscountPercent(tier),
    toolsAccessLevel: getFeatureValue(tier, 'docshare_tools_access_level'),
    customisationRequestAllowance: getCustomisationRequestAllowance(tier),
    isAuthenticated: input.isAuthenticated,
  };
}

export function getAccessMetadataForDocuShareSection(contentType: 'templates' | 'companion-guides' | 'documentation-suites' | 'end-to-end-processes' | 'customisation-service'): EntitlementAccessFields {
  if (contentType === 'templates') return CONTENT_ACCESS_DEFAULTS.docshare_template;
  if (contentType === 'companion-guides') return CONTENT_ACCESS_DEFAULTS.docshare_companion_guide;
  if (contentType === 'documentation-suites') return CONTENT_ACCESS_DEFAULTS.docshare_documentation_suite;
  if (contentType === 'end-to-end-processes') return CONTENT_ACCESS_DEFAULTS.docshare_end_to_end_process;
  return CONTENT_ACCESS_DEFAULTS.docshare_tool;
}


export function canAccessTool(input: { tier: MembershipTier; requiredAccess?: ToolsAccessLevel | null }): boolean {
  const required = input.requiredAccess ?? 'limited';
  const available = ENTITLEMENT_MATRIX[input.tier].docshare_tools_access_level;
  if (required === 'limited') return ENTITLEMENT_MATRIX[input.tier].docshare_tools;
  return ENTITLEMENT_MATRIX[input.tier].docshare_tools && available === 'full';
}
