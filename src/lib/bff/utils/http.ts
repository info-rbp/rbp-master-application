import { NextResponse } from 'next/server';
import type { BffErrorEnvelope, BffSuccessEnvelope, WarningDto } from '@/lib/bff/dto/common';
import type { BffApiError } from './request-context';

export function ok<T>(data: T, correlationId: string, warnings: WarningDto[] = [], extraMeta: Record<string, unknown> = {}) {
  const body: BffSuccessEnvelope<T> = {
    data,
    meta: { correlationId, generatedAt: new Date().toISOString(), degraded: warnings.length > 0 || Boolean(extraMeta.degraded) },
    warnings: warnings.length > 0 ? warnings : undefined,
  };
  return NextResponse.json(body);
}

export function fail(error: unknown, correlationId: string) {
  const known = error as BffApiError;
  const body: BffErrorEnvelope = {
    error: {
      code: known?.code ?? 'internal_error',
      message: known?.message ?? 'An unexpected error occurred.',
      details: known?.details,
    },
    correlationId,
    retryable: known?.retryable,
  };
  return NextResponse.json(body, { status: known?.status ?? 500 });
}
