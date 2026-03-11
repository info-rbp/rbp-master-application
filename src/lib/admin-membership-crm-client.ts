import type { MemberCRMRow, MemberListResult } from './definitions';

export type MemberListFilters = {
  search?: string;
  status?: string;
  tier?: string;
  role?: string;
  sortBy?: 'joinDate' | 'lastLogin';
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
};

export function filterMembersForAdminView(members: MemberCRMRow[], filters: MemberListFilters = {}): MemberListResult {
  const search = (filters.search ?? '').trim().toLowerCase();
  const status = (filters.status ?? 'all').trim().toLowerCase();
  const tier = (filters.tier ?? 'all').trim().toLowerCase();
  const role = (filters.role ?? 'all').trim().toLowerCase();
  const sortBy = filters.sortBy ?? 'joinDate';
  const sortDir = filters.sortDir ?? 'desc';
  const pageSize = Math.max(1, Math.min(100, Number(filters.pageSize ?? 20)));
  const page = Math.max(1, Number(filters.page ?? 1));

  const filtered = members
    .filter((member) => {
      if (search && !`${member.name} ${member.email}`.toLowerCase().includes(search)) return false;
      if (status !== 'all' && member.membershipStatus.toLowerCase() !== status) return false;
      if (tier !== 'all' && member.membershipTier.toLowerCase() !== tier) return false;
      if (role !== 'all' && member.role.toLowerCase() !== role) return false;
      return true;
    })
    .sort((a, b) => {
      const fallback = sortDir === 'asc' ? 1 : -1;
      if (sortBy === 'lastLogin') {
        const diff = new Date(a.lastLogin ?? 0).getTime() - new Date(b.lastLogin ?? 0).getTime();
        if (diff === 0) return fallback;
        return sortDir === 'asc' ? diff : -diff;
      }
      const diff = new Date(a.joinDate).getTime() - new Date(b.joinDate).getTime();
      if (diff === 0) return fallback;
      return sortDir === 'asc' ? diff : -diff;
    });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const items = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return { items, total, page: safePage, pageSize, totalPages };
}
