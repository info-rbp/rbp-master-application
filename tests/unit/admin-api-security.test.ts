import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { GET as getKnowledgeCenter } from '@/app/api/admin/knowledge-center/route';
import { GET as getNotifications } from '@/app/api/notifications/route';

test('admin knowledge center API rejects unauthorized requests', async () => {
  const request = new NextRequest('http://localhost:3000/api/admin/knowledge-center');
  const response = await getKnowledgeCenter(request);
  assert.equal(response.status, 401);
});

test('notifications API rejects unauthorized requests', async () => {
  const request = new NextRequest('http://localhost:3000/api/notifications');
  const response = await getNotifications(request);
  assert.equal(response.status, 401);
});
