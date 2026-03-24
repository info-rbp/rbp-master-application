import { NextResponse } from 'next/server';
import { db } from '@/firebase/server';

type CheckStatus = 'pass' | 'fail' | 'skip';
type CheckResult = { status: CheckStatus; detail: string; latencyMs?: number };

const UPSTREAMS = [
  ['odoo', process.env.ODOO_BASE_URL],
  ['lending', process.env.LENDING_BASE_URL],
  ['marble', process.env.MARBLE_BASE_URL],
  ['n8n', process.env.N8N_BASE_URL],
  ['docspell', process.env.DOCSPELL_BASE_URL],
  ['metabase', process.env.METABASE_BASE_URL],
] as const;

async function checkUpstream(url: string): Promise<CheckResult> {
  const startedAt = Date.now();
  try {
    const response = await fetch(url, { method: 'GET', cache: 'no-store', signal: AbortSignal.timeout(5000) });
    const latencyMs = Date.now() - startedAt;
    if (response.status >= 200 && response.status < 500) {
      return { status: 'pass', detail: `HTTP ${response.status}`, latencyMs };
    }
    return { status: 'fail', detail: `HTTP ${response.status}`, latencyMs };
  } catch (error) {
    const latencyMs = Date.now() - startedAt;
    return { status: 'fail', detail: error instanceof Error ? error.message : 'network_error', latencyMs };
  }
}

async function checkFirestore(): Promise<CheckResult> {
  const startedAt = Date.now();
  try {
    await db.collection('__health_checks').limit(1).get();
    return { status: 'pass', detail: 'firestore query ok', latencyMs: Date.now() - startedAt };
  } catch (error) {
    return {
      status: 'fail',
      detail: error instanceof Error ? error.message : 'firestore_query_failed',
      latencyMs: Date.now() - startedAt,
    };
  }
}

export async function GET() {
  const firestore = await checkFirestore();
  const upstreamEntries = await Promise.all(
    UPSTREAMS.map(async ([name, baseUrl]) => {
      if (!baseUrl) {
        return [name, { status: 'skip', detail: 'not_configured' } satisfies CheckResult] as const;
      }
      return [name, await checkUpstream(baseUrl)] as const;
    }),
  );

  const upstream = Object.fromEntries(upstreamEntries);
  const failedUpstreams = Object.values(upstream).filter((result) => result.status === 'fail').length;
  const healthy = firestore.status === 'pass' && failedUpstreams === 0;

  return NextResponse.json(
    {
      status: healthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks: {
        firestore,
        upstream,
      },
    },
    { status: healthy ? 200 : 503 },
  );
}
