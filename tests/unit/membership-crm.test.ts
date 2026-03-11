import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMembershipHistoryItem, buildMembershipMetrics, normalizeMemberRow } from '../../src/lib/membership-crm';

test('normalizeMemberRow provides defaults', () => {
  const row = normalizeMemberRow({ id: 'abc' });
  assert.equal(row.name, 'Unnamed member');
  assert.equal(row.membershipStatus, 'pending');
  assert.equal(row.overrideEnabled, false);
});

test('buildMembershipHistoryItem builds full payload', () => {
  const item = buildMembershipHistoryItem({ memberId: 'u1', oldTier: 'basic', newTier: 'premium', oldStatus: 'pending', newStatus: 'active', reason: 'manual', changedBy: 'admin@example.com' });
  assert.equal(item.memberId, 'u1');
  assert.equal(item.oldTier, 'basic');
  assert.equal(item.newStatus, 'active');
  assert.equal(item.reason, 'manual');
  assert.ok(item.changedAt);
});

test('buildMembershipMetrics computes status counts', () => {
  const rows = [
    normalizeMemberRow({ id: '1', membershipStatus: 'active', createdAt: new Date().toISOString(), overrideEnabled: true }),
    normalizeMemberRow({ id: '2', membershipStatus: 'pending', createdAt: new Date().toISOString() }),
    normalizeMemberRow({ id: '3', membershipStatus: 'suspended', createdAt: '2020-01-01T00:00:00.000Z' }),
  ];

  const metrics = buildMembershipMetrics(rows, [
    { id: 'h1', memberId: '1', oldTier: 'basic', newTier: 'premium', oldStatus: 'pending', newStatus: 'active', changedBy: 'a', changedAt: new Date().toISOString() },
  ]);

  assert.equal(metrics.totalMembers, 3);
  assert.equal(metrics.activeMembers, 1);
  assert.equal(metrics.pendingMembers, 1);
  assert.equal(metrics.suspendedMembers, 1);
  assert.equal(metrics.membersOnOverride, 1);
  assert.equal(metrics.recentStatusChanges, 1);
});
