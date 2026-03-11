import test from 'node:test';
import assert from 'node:assert/strict';
import { filterAndSortUsers, validateAdminRole } from '../../src/lib/user-admin';
import type { UserProfile } from '../../src/lib/definitions';

const sampleUsers: UserProfile[] = [
  { uid: '1', name: 'Alice', email: 'alice@example.com', role: 'member', membershipTier: 'basic', membershipStatus: 'active', emailVerified: true, accountStatus: 'active', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z', lastLoginAt: '2024-03-01T00:00:00.000Z' },
  { uid: '2', name: 'Bob', email: 'bob@example.com', role: 'admin', membershipTier: 'premium', membershipStatus: 'pending', emailVerified: false, accountStatus: 'suspended', createdAt: '2024-02-01T00:00:00.000Z', updatedAt: '2024-02-01T00:00:00.000Z', lastLoginAt: '2024-04-01T00:00:00.000Z' },
  { uid: '3', name: 'Cara', email: 'cara@example.com', role: 'member', membershipTier: null, membershipStatus: 'lapsed', emailVerified: true, accountStatus: 'active', createdAt: '2024-03-01T00:00:00.000Z', updatedAt: '2024-03-01T00:00:00.000Z', lastLoginAt: null },
];

test('validateAdminRole only allows member/admin', () => {
  assert.equal(validateAdminRole('member'), true);
  assert.equal(validateAdminRole('admin'), true);
  assert.equal(validateAdminRole('owner'), false);
});

test('filterAndSortUsers filters by query, role and verification', () => {
  const result = filterAndSortUsers(sampleUsers, { query: 'bob', role: 'admin', verification: 'unverified' });
  assert.equal(result.length, 1);
  assert.equal(result[0]?.uid, '2');
});

test('filterAndSortUsers supports membership and account filters', () => {
  const result = filterAndSortUsers(sampleUsers, { membershipTier: 'basic', membershipStatus: 'active', accountStatus: 'active' });
  assert.equal(result.length, 1);
  assert.equal(result[0]?.uid, '1');
});

test('filterAndSortUsers sorts by last login descending', () => {
  const result = filterAndSortUsers(sampleUsers, { sortBy: 'lastLoginAt', sortDir: 'desc' });
  assert.equal(result[0]?.uid, '2');
});
