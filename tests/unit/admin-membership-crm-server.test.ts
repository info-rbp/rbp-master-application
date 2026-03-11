import test from 'node:test';
import assert from 'node:assert/strict';
import { filterMembersForAdminView } from '../../src/lib/admin-membership-crm-client';

test('filterMembersForAdminView applies search, filters, sorting and pagination', () => {
  const rows = [
    { id: '1', name: 'Alice', email: 'alice@example.com', role: 'member', membershipTier: 'basic', membershipStatus: 'active', joinDate: '2025-01-01T00:00:00.000Z', lastLogin: '2025-01-02T00:00:00.000Z', accessExpiry: null, emailVerified: true, overrideEnabled: false, squareSubscriptionStatus: null, squareSubscriptionId: null, squareCustomerId: null },
    { id: '2', name: 'Bob', email: 'bob@example.com', role: 'admin', membershipTier: 'premium', membershipStatus: 'suspended', joinDate: '2025-02-01T00:00:00.000Z', lastLogin: '2025-03-01T00:00:00.000Z', accessExpiry: null, emailVerified: false, overrideEnabled: false, squareSubscriptionStatus: 'PAUSED', squareSubscriptionId: 'sub_1', squareCustomerId: 'cus_1' },
  ];

  const filtered = filterMembersForAdminView(rows, { search: 'bob', role: 'admin', status: 'suspended', sortBy: 'lastLogin', page: 1, pageSize: 10 });
  assert.equal(filtered.items.length, 1);
  assert.equal(filtered.items[0].id, '2');
  assert.equal(filtered.total, 1);
});
