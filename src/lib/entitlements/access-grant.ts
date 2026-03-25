/**
 * @file Defines the data models and constants for access grants and tiers.
 */

export type AccessTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export const TIER_HIERARCHY: Record<AccessTier, number> = {
  bronze: 1,
  silver: 2,
  gold: 3,
  platinum: 4,
};

export interface AccessGrant {
  id: string;
  userId: string;
  tier: AccessTier;
  source: string; // e.g., 'promotion', 'manual_grant'
  createdAt: Date;
  expiresAt?: Date;
}
