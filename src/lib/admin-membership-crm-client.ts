import type { MemberCRMRow } from './definitions';

export type MemberListFilters = {
  search?: string;
  status?: string;
  tier?: string;
  role?: string;
  sortBy?: 'joinDate' | 'lastLogin';
};

export function filterMembersForAdminView(members: MemberCRMRow[], filters: MemberListFilters = {}): MemberCRMRow[] {
  const search = (filters.search ?? '').trim().toLowerCase();
  const status = (filters.status ?? 'all').trim().toLowerCase();
  const tier = (filters.tier ?? 'all').trim().toLowerCase();
  const role = (filters.role ?? 'all').trim().toLowerCase();
  const sortBy = filters.sortBy ?? 'joinDate';

  return members
    .filter((member) => {
      if (search && !`${member.name} ${member.email}`.toLowerCase().includes(search)) return false;
      if (status !== 'all' && member.membershipStatus.toLowerCase() !== status) return false;
      if (tier !== 'all' && member.membershipTier.toLowerCase() !== tier) return false;
      if (role !== 'all' && member.role.toLowerCase() !== role) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'lastLogin') {
        return (new Date(b.lastLogin ?? 0).getTime() || 0) - (new Date(a.lastLogin ?? 0).getTime() || 0);
      }
      return new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime();
    });
}
