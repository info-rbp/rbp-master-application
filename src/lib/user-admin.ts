import type { UserAdminListFilters, UserProfile } from './definitions';

export const ADMIN_ALLOWED_ROLES = ['member', 'admin'] as const;

export function validateAdminRole(role: string) {
  return ADMIN_ALLOWED_ROLES.includes(role as (typeof ADMIN_ALLOWED_ROLES)[number]);
}

export function filterAndSortUsers(users: UserProfile[], filters: UserAdminListFilters = {}) {
  const query = (filters.query ?? '').trim().toLowerCase();
  const sortBy = filters.sortBy ?? 'createdAt';
  const sortDir = filters.sortDir ?? 'desc';

  const filtered = users.filter((user) => {
    const queryMatch = !query || `${user.name} ${user.email}`.toLowerCase().includes(query);
    const roleMatch = !filters.role || filters.role === 'all' || user.role === filters.role;
    const statusMatch = !filters.membershipStatus || filters.membershipStatus === 'all' || user.membershipStatus === filters.membershipStatus;
    const tierMatch = !filters.membershipTier || filters.membershipTier === 'all' || (user.membershipTier ?? 'none') === filters.membershipTier;
    const verificationMatch = !filters.verification || filters.verification === 'all' || (filters.verification === 'verified' ? Boolean(user.emailVerified) : !user.emailVerified);
    const accountStatusMatch = !filters.accountStatus || filters.accountStatus === 'all' || (user.accountStatus ?? 'active') === filters.accountStatus;
    return queryMatch && roleMatch && statusMatch && tierMatch && verificationMatch && accountStatusMatch;
  });

  return [...filtered].sort((a, b) => {
    const aValue = sortBy === 'lastLoginAt' ? (a.lastLoginAt ?? '') : a.createdAt;
    const bValue = sortBy === 'lastLoginAt' ? (b.lastLoginAt ?? '') : b.createdAt;
    const comparator = aValue.localeCompare(bValue);
    return sortDir === 'asc' ? comparator : -comparator;
  });
}
