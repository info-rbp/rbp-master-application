import test from 'node:test';
import assert from 'node:assert/strict';
import { getPublicPartnerOffers, getPublicPastProjects, getPublicTestimonials } from '@/lib/content-admin';

test('getPublicPartnerOffers returns only active and non-expired, sorted by display order', () => {
  const now = new Date('2026-01-01T00:00:00.000Z').getTime();
  const rows = getPublicPartnerOffers([
    { id: 'a', title: 'A', description: 'd', link: '#', active: true, displayOrder: 2, createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z' },
    { id: 'b', title: 'B', description: 'd', link: '#', active: false, displayOrder: 1, createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z' },
    { id: 'c', title: 'C', description: 'd', link: '#', active: true, displayOrder: 0, expiresAt: '2024-01-01T00:00:00.000Z', createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z' },
    { id: 'd', title: 'D', description: 'd', link: '#', active: true, displayOrder: 1, createdAt: '2025-01-02T00:00:00.000Z', updatedAt: '2025-01-02T00:00:00.000Z' },
  ], now);

  assert.deepEqual(rows.map((row) => row.id), ['d', 'a']);
});

test('getPublicTestimonials returns active testimonials only', () => {
  const rows = getPublicTestimonials([
    { id: 'a', clientName: 'A', content: 'x', active: false, createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z' },
    { id: 'b', clientName: 'B', content: 'x', active: true, displayOrder: 1, createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z' },
  ]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.id, 'b');
});

test('getPublicPastProjects returns active projects only', () => {
  const rows = getPublicPastProjects([
    { id: 'a', name: 'A', description: 'x', active: true, createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z' },
    { id: 'b', name: 'B', description: 'x', active: false, createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z' },
  ]);
  assert.deepEqual(rows.map((row) => row.id), ['a']);
});
