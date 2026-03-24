#!/usr/bin/env node

import dns from 'node:dns/promises';
import { appendFile } from 'node:fs/promises';

const targetEnv = process.env.SMOKE_ENV || process.argv[2] || 'dev';
const baseUrl = process.env.APP_BASE_URL;
const authCookie = process.env.SMOKE_AUTH_COOKIE || '';
const authHeader = process.env.SMOKE_AUTH_HEADER || '';

if (!baseUrl) {
  console.error('[FAIL] APP_BASE_URL is required');
  process.exit(2);
}

const base = new URL(baseUrl);

/** @type {{name:string; status:'pass'|'fail'|'skip'; detail:string}[]} */
const results = [];

const defaultHeaders = { 'user-agent': 'rbp-smoke/1.0' };
if (authHeader) defaultHeaders.authorization = authHeader;
if (authCookie) defaultHeaders.cookie = authCookie;

async function runCheck(name, fn) {
  try {
    const detail = await fn();
    results.push({ name, status: 'pass', detail: detail || 'ok' });
  } catch (error) {
    results.push({ name, status: 'fail', detail: error instanceof Error ? error.message : String(error) });
  }
}

function skipCheck(name, detail) {
  results.push({ name, status: 'skip', detail });
}

async function fetchExpect(path, { expectedStatuses, headers = {}, redirect = 'manual' } = {}) {
  const response = await fetch(new URL(path, base), { redirect, headers: { ...defaultHeaders, ...headers } });
  if (!expectedStatuses.includes(response.status)) {
    throw new Error(`Expected ${expectedStatuses.join('/')} got ${response.status} for ${path}`);
  }
  return response;
}

await runCheck('homepage loads', async () => {
  await fetchExpect('/', { expectedStatuses: [200] });
  return 'GET / -> 200';
});

await runCheck('login redirect works', async () => {
  const res = await fetchExpect('/api/auth/login?returnTo=%2Fdashboard', { expectedStatuses: [302, 303, 307, 308] });
  const location = res.headers.get('location');
  if (!location) throw new Error('Missing redirect location');
  return `redirect=${location}`;
});

await runCheck('session bootstrap works', async () => {
  const res = await fetchExpect('/api/session', { expectedStatuses: [200] });
  const body = await res.json();
  if (!body || typeof body !== 'object') throw new Error('Invalid session payload');
  return 'session payload received';
});

await runCheck('health endpoint responds', async () => {
  await fetchExpect('/api/health', { expectedStatuses: [200] });
  return 'GET /api/health -> 200';
});

await runCheck('runtime/firestore dependency check', async () => {
  const res = await fetchExpect('/api/health/runtime', { expectedStatuses: [200, 503] });
  const body = await res.json();
  if (!body?.checks?.firestore?.status) throw new Error('Missing firestore status in runtime health');
  return `runtime status=${body.status}, firestore=${body.checks.firestore.status}`;
});

await runCheck('unauthorized admin feature-flags denied', async () => {
  await fetchExpect('/api/admin/feature-flags', { expectedStatuses: [401, 403] });
  return 'denied as expected';
});

if (authCookie || authHeader) {
  await runCheck('authorized feature-control read path works', async () => {
    await fetchExpect('/api/admin/feature-flags', { expectedStatuses: [200] });
    return 'authorized read succeeded';
  });

  await runCheck('admin console/operator entry reachable for authorized user', async () => {
    const res = await fetchExpect('/admin/system/feature-controls', { expectedStatuses: [200, 302, 307] });
    return `status=${res.status}`;
  });

  await runCheck('protected API succeeds when authorized', async () => {
    await fetchExpect('/api/admin/feature-controls/recent-changes?limit=5', { expectedStatuses: [200] });
    return 'authorized protected API succeeded';
  });
} else {
  skipCheck('authorized feature-control read path works', 'set SMOKE_AUTH_COOKIE or SMOKE_AUTH_HEADER');
  skipCheck('admin console/operator entry reachable for authorized user', 'set SMOKE_AUTH_COOKIE or SMOKE_AUTH_HEADER');
  skipCheck('protected API succeeds when authorized', 'set SMOKE_AUTH_COOKIE or SMOKE_AUTH_HEADER');
}

await runCheck('unauthorized protected API denied', async () => {
  await fetchExpect('/api/admin/feature-controls/recent-changes?limit=5', { expectedStatuses: [401, 403] });
  return 'denied as expected';
});

const integrationEnvVars = [
  ['odoo', 'ODOO_BASE_URL'],
  ['lending', 'LENDING_BASE_URL'],
  ['marble', 'MARBLE_BASE_URL'],
  ['n8n', 'N8N_BASE_URL'],
  ['docspell', 'DOCSPELL_BASE_URL'],
  ['metabase', 'METABASE_BASE_URL'],
];

for (const [name, envKey] of integrationEnvVars) {
  const value = process.env[envKey];
  if (!value) {
    skipCheck(`upstream connectivity: ${name}`, `${envKey} not configured`);
    continue;
  }
  await runCheck(`upstream connectivity: ${name}`, async () => {
    const res = await fetch(value, { method: 'GET', redirect: 'manual' });
    if (res.status >= 500) throw new Error(`upstream ${name} returned ${res.status}`);
    return `${value} -> ${res.status}`;
  });
}

if (targetEnv === 'staging' || targetEnv === 'prod' || targetEnv === 'production') {
  await runCheck('domain resolves in DNS', async () => {
    const lookup = await dns.lookup(base.hostname);
    return `${base.hostname} -> ${lookup.address}`;
  });

  await runCheck('TLS/HTTPS enforced', async () => {
    if (base.protocol !== 'https:') {
      throw new Error(`Expected https scheme for ${targetEnv}, got ${base.protocol}`);
    }
    return 'https scheme confirmed';
  });

  await runCheck('auth callback endpoint reachable', async () => {
    const res = await fetchExpect('/api/auth/callback?code=smoke&state=smoke', { expectedStatuses: [302, 303, 307, 400, 401] });
    return `status=${res.status}`;
  });
}

const passCount = results.filter((r) => r.status === 'pass').length;
const failCount = results.filter((r) => r.status === 'fail').length;
const skipCount = results.filter((r) => r.status === 'skip').length;

console.log(`\nSmoke Test Results (${targetEnv})`);
for (const item of results) {
  const prefix = item.status === 'pass' ? '[PASS]' : item.status === 'fail' ? '[FAIL]' : '[SKIP]';
  console.log(`${prefix} ${item.name}: ${item.detail}`);
}
console.log(`\nSummary: pass=${passCount} fail=${failCount} skip=${skipCount}`);

if (process.env.GITHUB_STEP_SUMMARY) {
  const lines = [
    `## Post-deploy smoke (${targetEnv})`,
    '',
    `- Pass: ${passCount}`,
    `- Fail: ${failCount}`,
    `- Skip: ${skipCount}`,
    '',
    ...results.map((item) => `- ${item.status.toUpperCase()} - ${item.name}: ${item.detail}`),
    '',
  ];
  await appendFile(process.env.GITHUB_STEP_SUMMARY, `${lines.join('\n')}\n`);
}

process.exit(failCount > 0 ? 1 : 0);
