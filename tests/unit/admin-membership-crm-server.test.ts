import test from 'node:test';
import assert from 'node:assert/strict';
import { filterMembersForAdminView } from '../../src/lib/admin-membership-crm-client';

test('filterMembersForAdminView applies search, filters, and sorting', () => {
  const rows = [
    { id: '1', name: 'Alice', email: 'alice@example.com', role: 'member', membershipTier: 'basic', membershipStatus: 'active', joinDate: '2025-01-01T00:00:00.000Z', lastLogin: '2025-01-02T00:00:00.000Z', accessExpiry: null, overrideEnabled: false },
    { id: '2', name: 'Bob', email: 'bob@example.com', role: 'admin', membershipTier: 'premium', membershipStatus: 'suspended', joinDate: '2025-02-01T00:00:00.000Z', lastLogin: '2025-03-01T00:00:00.000Z', accessExpiry: null, overrideEnabled: false },
  ];

  const filtered = filterMembersForAdminView(rows, { search: 'bob', role: 'admin', status: 'suspended', sortBy: 'lastLogin' });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, '2');
});
