import { getKnowledgeArticleBySlug, getMembershipAccessGrantsForUser, getPartnerOfferBySlug, getSuiteBySlug, getUserById } from '@/lib/data';
import { safeLogAnalyticsEvent } from '@/lib/analytics';
import type { ContentActionType, MembershipTier } from '@/lib/definitions';
import { canAccessContent, canSubmitCustomisationRequest, CONTENT_ACCESS_DEFAULTS, getCustomisationRequestAllowance, getEffectiveMembershipTier } from '@/lib/entitlements';
import type { AuthContext } from '@/lib/server-auth';

export type ProtectedActionType =
  | 'download_resource'
  | 'access_suite'
  | 'launch_tool'
  | 'redeem_offer'
  | 'submit_customisation_request'
  | 'submit_support_request'
  | 'book_member_benefit';

export type AccessDecision = 'allowed' | 'requiresLogin' | 'requiresMembership' | 'requiresUpgrade' | 'limitedAccess' | 'denied';

export type ProtectedActionResult = {
  allowed: boolean;
  decision: AccessDecision;
  requiresLogin: boolean;
  requiresMembership: boolean;
  requiredTier?: MembershipTier;
  currentTier?: MembershipTier;
  reason: string;
  actionUrl?: string;
  secureDeliveryUrl?: string;
  accessLevel?: 'none' | 'limited' | 'full';
  metadata?: Record<string, unknown>;
};

export type ProtectedActionInput = {
  actionType: ProtectedActionType;
  slug?: string;
  returnTo?: string;
};

export async function resolveUserTier(auth: AuthContext | null): Promise<{
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  currentTier: MembershipTier;
  userId?: string;
}> {
  if (!auth) return { isAuthenticated: false, isEmailVerified: false, currentTier: 'basic' };

  const [user, grants] = await Promise.all([
    getUserById(auth.userId),
    getMembershipAccessGrantsForUser(auth.userId),
  ]);

  const currentTier = getEffectiveMembershipTier({
    membershipTier: user?.membershipTier,
    membershipStatus: user?.membershipStatus,
    planCode: user?.membershipPlanCode ?? null,
    grants,
  });

  return {
    isAuthenticated: true,
    isEmailVerified: Boolean(auth.emailVerified),
    currentTier,
    userId: auth.userId,
  };
}

function toResult(input: Omit<ProtectedActionResult, 'allowed'> & { allowed?: boolean }): ProtectedActionResult {
  return {
    allowed: input.allowed ?? (input.decision === 'allowed' || input.decision === 'limitedAccess'),
    ...input,
  };
}

export async function evaluateProtectedAction(input: ProtectedActionInput, auth: AuthContext | null): Promise<ProtectedActionResult> {
  const user = await resolveUserTier(auth);

  if (!user.isAuthenticated) {
    return toResult({
      decision: 'requiresLogin',
      requiresLogin: true,
      requiresMembership: true,
      reason: 'login_required',
    });
  }

  if (!user.isEmailVerified) {
    return toResult({
      decision: 'denied',
      requiresLogin: true,
      requiresMembership: true,
      reason: 'email_verification_required',
    });
  }

  if (input.actionType === 'download_resource' || input.actionType === 'access_suite' || input.actionType === 'launch_tool') {
    const suite = input.slug ? await getSuiteBySlug(input.slug) : null;
    const knowledgeTool = !suite && input.actionType === 'launch_tool' && input.slug ? await getKnowledgeArticleBySlug(input.slug) : null;
    const entitlement = suite?.entitlement ?? knowledgeTool?.entitlement ?? (input.actionType === 'access_suite'
      ? CONTENT_ACCESS_DEFAULTS.docshare_documentation_suite
      : input.actionType === 'launch_tool'
        ? CONTENT_ACCESS_DEFAULTS.docshare_tool
        : CONTENT_ACCESS_DEFAULTS.docshare_template);
    const access = canAccessContent({
      content: entitlement,
      isAuthenticated: user.isAuthenticated,
      currentTier: user.currentTier,
    });

    if (!access.canUse) {
      if (access.reason === 'requires_login') {
        return toResult({ decision: 'requiresLogin', requiresLogin: true, requiresMembership: access.requiresMembership, requiredTier: access.requiredTier, currentTier: access.currentTier, reason: access.reason });
      }
      if (access.reason === 'insufficient_tier') {
        return toResult({ decision: 'requiresUpgrade', requiresLogin: false, requiresMembership: true, requiredTier: access.requiredTier, currentTier: access.currentTier, reason: access.reason });
      }
      return toResult({ decision: 'requiresMembership', requiresLogin: false, requiresMembership: true, requiredTier: access.requiredTier, currentTier: access.currentTier, reason: access.reason });
    }

    const secureDeliveryUrl = suite && input.slug ? `/api/protected-actions/deliver?slug=${encodeURIComponent(input.slug)}` : undefined;
    const decision = access.isLimitedAccess ? 'limitedAccess' : 'allowed';
    await safeLogAnalyticsEvent({
      eventType: 'resource_downloaded',
      userId: user.userId,
      userRole: 'member',
      targetId: input.slug,
      targetType: input.actionType,
      metadata: { decision, tier: user.currentTier, returnTo: input.returnTo },
    });

    return toResult({
      decision,
      requiresLogin: false,
      requiresMembership: true,
      requiredTier: entitlement.accessTier,
      currentTier: user.currentTier,
      reason: access.isLimitedAccess ? 'limited_access' : 'ok',
      secureDeliveryUrl,
      actionUrl: secureDeliveryUrl ?? knowledgeTool?.externalLink,
      accessLevel: access.accessLevel,
    });
  }

  if (input.actionType === 'redeem_offer') {
    const offer = input.slug ? await getPartnerOfferBySlug(input.slug) : null;
    const entitlement = offer?.entitlement ?? CONTENT_ACCESS_DEFAULTS.partner_offer_top;
    const access = canAccessContent({
      content: entitlement,
      isAuthenticated: user.isAuthenticated,
      currentTier: user.currentTier,
    });
    if (!access.canUse) {
      return toResult({
        decision: access.reason === 'insufficient_tier' ? 'requiresUpgrade' : 'requiresMembership',
        requiresLogin: false,
        requiresMembership: true,
        requiredTier: access.requiredTier,
        currentTier: user.currentTier,
        reason: access.reason,
      });
    }

    return toResult({
      decision: 'allowed',
      requiresLogin: false,
      requiresMembership: true,
      requiredTier: entitlement.accessTier,
      currentTier: user.currentTier,
      reason: 'ok',
      actionUrl: offer?.link,
      metadata: {
        redemptionCode: offer?.redemptionCode ?? null,
        claimInstructions: offer?.claimInstructions ?? null,
      },
    });
  }

  if (input.actionType === 'submit_customisation_request') {
    const allowance = getCustomisationRequestAllowance(user.currentTier);
    const usedThisMonth = 0;
    const canSubmit = canSubmitCustomisationRequest(user.currentTier, usedThisMonth);
    if (!canSubmit) {
      return toResult({
        decision: user.currentTier === 'basic' ? 'requiresMembership' : 'requiresUpgrade',
        requiresLogin: false,
        requiresMembership: true,
        requiredTier: 'standard',
        currentTier: user.currentTier,
        reason: 'customisation_limit_reached',
        metadata: { allowance, usedThisMonth },
      });
    }

    return toResult({
      decision: 'allowed',
      requiresLogin: false,
      requiresMembership: true,
      requiredTier: 'standard',
      currentTier: user.currentTier,
      reason: 'ok',
      actionUrl: '/contact?topic=customisation',
      metadata: { allowance, usedThisMonth },
    });
  }

  if (input.actionType === 'submit_support_request') {
    if (user.currentTier !== 'premium') {
      return toResult({
        decision: 'requiresUpgrade',
        requiresLogin: false,
        requiresMembership: true,
        requiredTier: 'premium',
        currentTier: user.currentTier,
        reason: 'implementation_support_premium_only',
      });
    }
    return toResult({ decision: 'allowed', requiresLogin: false, requiresMembership: true, requiredTier: 'premium', currentTier: user.currentTier, reason: 'ok', actionUrl: '/contact?topic=implementation-support' });
  }

  if (input.actionType === 'book_member_benefit') {
    if (user.currentTier !== 'premium') {
      return toResult({ decision: 'requiresUpgrade', requiresLogin: false, requiresMembership: true, requiredTier: 'premium', currentTier: user.currentTier, reason: 'strategic_checkup_premium_only' });
    }
    return toResult({ decision: 'allowed', requiresLogin: false, requiresMembership: true, requiredTier: 'premium', currentTier: user.currentTier, reason: 'ok', actionUrl: '/contact?topic=strategic-checkup' });
  }

  return toResult({ decision: 'denied', requiresLogin: false, requiresMembership: false, reason: 'unsupported_action' });
}

export function getDefaultActionLabel(actionType: ProtectedActionType): string {
  const labels: Record<ProtectedActionType, string> = {
    download_resource: 'Download resource',
    access_suite: 'Access suite',
    launch_tool: 'Launch tool',
    redeem_offer: 'Claim offer',
    submit_customisation_request: 'Submit customisation request',
    submit_support_request: 'Submit support request',
    book_member_benefit: 'Book benefit',
  };
  return labels[actionType];
}

export function mapActionTypeFromContentAction(actionType: ContentActionType | undefined, contentType: string): ProtectedActionType {
  if (actionType === 'redeem') return 'redeem_offer';
  if (actionType === 'launch') return 'launch_tool';
  if (actionType === 'book_call') return 'book_member_benefit';
  if (contentType === 'partner_offer') return 'redeem_offer';
  if (contentType === 'docshare_tool') return 'launch_tool';
  if (contentType === 'docshare_documentation_suite') return 'access_suite';
  return 'download_resource';
}
