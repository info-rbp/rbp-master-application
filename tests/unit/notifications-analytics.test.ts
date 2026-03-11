import test from 'node:test';
import assert from 'node:assert/strict';
import { computeUnreadCount } from '../../src/lib/notifications';
import { buildAnalyticsEventRecord } from '../../src/lib/analytics';

test('computeUnreadCount counts unread notification items', () => {
  const count = computeUnreadCount([{ read: false }, { read: true }, { read: false }]);
  assert.equal(count, 2);
});

test('buildAnalyticsEventRecord sanitizes undefined metadata and sets createdAt', () => {
  const event = buildAnalyticsEventRecord({
    eventType: 'resource_viewed',
    userId: 'u-1',
    metadata: { keep: 'yes', drop: undefined },
  });

  assert.equal(event.eventType, 'resource_viewed');
  assert.equal(event.userId, 'u-1');
  assert.deepEqual(event.metadata, { keep: 'yes' });
  assert.ok(event.createdAt instanceof Date);
});
