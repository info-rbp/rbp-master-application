import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { GET as getKnowledgeCenter } from '@/app/api/admin/knowledge-center/route';
import { GET as getNotifications } from '@/app/api/notifications/route';
import { GET as getSearch } from '@/app/api/search/route';
import { GET as getTasks } from '@/app/api/tasks/route';
import { GET as getAudit } from '@/app/api/audit/route';

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

test('search API rejects unauthorized requests', async () => {
  const request = new NextRequest('http://localhost:3000/api/search?q=test');
  const response = await getSearch(request);
  assert.equal(response.status, 401);
});

test('tasks API rejects unauthorized requests', async () => {
  const request = new NextRequest('http://localhost:3000/api/tasks');
  const response = await getTasks(request);
  assert.equal(response.status, 401);
});

test('audit API rejects unauthorized requests', async () => {
  const request = new NextRequest('http://localhost:3000/api/audit');
  const response = await getAudit(request);
  assert.equal(response.status, 401);
});
