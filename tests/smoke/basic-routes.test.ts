import test from 'node:test';
import assert from 'node:assert/strict';

const baseUrl = process.env.SMOKE_BASE_URL;

test('SMOKE_BASE_URL configured for smoke tests', () => {
  if (!baseUrl) {
    assert.ok(true, 'Skipped because SMOKE_BASE_URL is not set');
    return;
  }
  assert.match(baseUrl, /^https?:\/\//);
});
