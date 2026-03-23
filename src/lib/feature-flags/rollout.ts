import crypto from 'crypto';
import type { BucketEvaluationResult, FeatureScopeType, PercentageRolloutRule, PreviewEvaluationContext, RolloutTargetIdentity } from '@/lib/feature-flags/types';

export function buildRolloutTargetIdentity(context: Pick<PreviewEvaluationContext, 'tenantId' | 'workspaceId' | 'userId' | 'roleCodes'>, bucketBy: PercentageRolloutRule['bucketBy']): RolloutTargetIdentity | null {
  const roleCodes = [...(context.roleCodes ?? [])].sort();
  if (bucketBy === 'tenant') return context.tenantId ? { targetType: 'tenant', targetId: context.tenantId, tenantId: context.tenantId, roleCodes, normalizedKey: `tenant:${context.tenantId}` } : null;
  if (bucketBy === 'workspace') return context.workspaceId ? { targetType: 'workspace', targetId: context.workspaceId, tenantId: context.tenantId, workspaceId: context.workspaceId, roleCodes, normalizedKey: `tenant:${context.tenantId}|workspace:${context.workspaceId}` } : null;
  if (bucketBy === 'user') return context.userId ? { targetType: 'user', targetId: context.userId, tenantId: context.tenantId, workspaceId: context.workspaceId, userId: context.userId, roleCodes, normalizedKey: `tenant:${context.tenantId}|user:${context.userId}` } : null;
  if (bucketBy === 'role') return roleCodes.length ? { targetType: 'role', targetId: roleCodes.join(','), tenantId: context.tenantId, workspaceId: context.workspaceId, roleCodes, normalizedKey: `tenant:${context.tenantId}|roles:${roleCodes.join(',')}` } : null;
  return { targetType: 'composite', targetId: [context.tenantId, context.workspaceId ?? '-', context.userId ?? '-', roleCodes.join(',') || '-'].join('|'), tenantId: context.tenantId, workspaceId: context.workspaceId, userId: context.userId, roleCodes, normalizedKey: `tenant:${context.tenantId}|workspace:${context.workspaceId ?? '-'}|user:${context.userId ?? '-'}|roles:${roleCodes.join(',') || '-'}` };
}

export function evaluateDeterministicBucket(input: { flagKey: string; identity: RolloutTargetIdentity; percentage: number; salt?: string; }): BucketEvaluationResult {
  const saltUsed = input.salt?.trim() || 'default';
  const seed = `${input.flagKey}|${input.identity.normalizedKey}|${saltUsed}`;
  const hash = crypto.createHash('sha256').update(seed).digest('hex');
  const hashValue = parseInt(hash.slice(0, 8), 16);
  const bucket = hashValue % 100;
  return { algorithm: 'sha256-mod-100', normalizedKey: input.identity.normalizedKey, hashValue, bucket, threshold: input.percentage, matched: bucket < input.percentage, saltUsed };
}
