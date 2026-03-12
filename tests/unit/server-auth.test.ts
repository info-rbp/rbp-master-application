import test from 'node:test';
import assert from 'node:assert/strict';
import { AUTH_COOKIE_NAME, AuthorizationError } from '@/lib/server-auth';

test('AUTH_COOKIE_NAME stays stable for server/session auth', () => {
  assert.equal(AUTH_COOKIE_NAME, 'rbp_id_token');
});

test('AuthorizationError exposes status for API and server-action handling', () => {
  const error = new AuthorizationError('Forbidden', 403);
  assert.equal(error.message, 'Forbidden');
  assert.equal(error.status, 403);
  assert.equal(error.name, 'AuthorizationError');
});
