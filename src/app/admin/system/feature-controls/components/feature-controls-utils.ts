import type {
  ControlPlaneIssue,
  FeatureFlagOperationalSummary,
  ModuleControlOperationalSummary,
  PercentageRolloutRule,
  ReleaseStage,
  RolloutBucketBy,
} from '@/lib/feature-flags/types';

export const releaseStages: ReleaseStage[] = ['experimental', 'internal', 'beta', 'limited', 'general_availability', 'deprecated'];
export const rolloutBucketOptions: RolloutBucketBy[] = ['tenant', 'workspace', 'user', 'role', 'composite'];

export type TabKey = 'overview' | 'flags' | 'modules' | 'preview' | 'diagnostics' | 'recent';
export type MutationMessage = { kind: 'success' | 'error'; text: string };
export type PreviewRequest = {
  tenantId?: string;
  workspaceId?: string;
  userId?: string;
  roleCodes: string[];
  currentModule?: string;
  currentRoute?: string;
  featureKeys: string[];
  includeReasoning: true;
  includeBucketDetails: true;
  proposedRolloutRules?: PercentageRolloutRule[];
};

export function buildFlagRows(items: FeatureFlagOperationalSummary[], search: string, releaseStage: string, status: string, killSwitchOnly: boolean) {
  const needle = search.trim().toLowerCase();
  return items
    .filter((item) => !needle || `${item.flagKey} ${item.name} ${item.category} ${item.tags.join(' ')}`.toLowerCase().includes(needle))
    .filter((item) => !releaseStage || item.releaseStage === releaseStage)
    .filter((item) => !killSwitchOnly || item.isKillSwitch)
    .filter((item) => status === 'all' ? true : status === 'enabled' ? item.effectiveEnabled : status === 'disabled' ? !item.effectiveEnabled : item.diagnostics.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function buildModuleRows(items: ModuleControlOperationalSummary[], search: string, status: string) {
  const needle = search.trim().toLowerCase();
  return items
    .filter((item) => !needle || `${item.moduleKey} ${item.moduleName} ${item.category}`.toLowerCase().includes(needle))
    .filter((item) => status === 'all' ? true : status === 'enabled' ? item.effectiveEnabled : status === 'hidden' ? !item.effectiveVisible : item.diagnostics.length > 0)
    .sort((a, b) => a.moduleName.localeCompare(b.moduleName));
}

export function summarizeDiagnostics(items: ControlPlaneIssue[]) {
  return {
    total: items.length,
    critical: items.filter((item) => item.severity === 'critical').length,
    warning: items.filter((item) => item.severity === 'warning').length,
    scheduled: items.filter((item) => item.status === 'scheduled').length,
    activeKillSwitches: items.filter((item) => item.type === 'kill_switch_active').length,
  };
}

export function formatDate(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

export function toneForSeverity(value: string) {
  if (value === 'critical') return 'border-red-200 bg-red-50 text-red-700';
  if (value === 'warning') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-slate-200 bg-slate-50 text-slate-700';
}

export function toneForStage(value: ReleaseStage) {
  return {
    experimental: 'bg-fuchsia-100 text-fuchsia-700',
    internal: 'bg-indigo-100 text-indigo-700',
    beta: 'bg-sky-100 text-sky-700',
    limited: 'bg-amber-100 text-amber-700',
    general_availability: 'bg-emerald-100 text-emerald-700',
    deprecated: 'bg-rose-100 text-rose-700',
  }[value];
}

export type JsonResult<T> =
  | { ok: true; payload: T }
  | { ok: false; message: string; code?: string; status: number };

export async function handleJsonResponse<T>(response: Response): Promise<JsonResult<T>> {
  const payload = await response.json().catch(() => ({}));
  if (response.ok) return { ok: true, payload: (payload.data ?? payload) as T };
  return { ok: false, message: payload?.error?.message ?? 'Request failed.', code: payload?.error?.code, status: response.status };
}

export function highRiskMessage(input: { kind: 'assignment' | 'rollout' | 'module'; operation: 'create' | 'update' | 'disable'; flagKey?: string; moduleKey?: string; scopeType?: string; percentage?: number; enabled?: boolean; visible?: boolean; isKillSwitch?: boolean }) {
  if (input.kind === 'assignment' && input.isKillSwitch) return `High risk (${input.operation}): You are changing kill switch ${input.flagKey}. Confirm incident context and rollback owner.`;
  if (input.kind === 'assignment' && input.scopeType === 'environment') return `High risk (${input.operation}): You are applying an environment-wide override for ${input.flagKey}.`;
  if (input.kind === 'rollout' && (input.percentage ?? 0) >= 50) return `High risk (${input.operation}): You are setting ${input.percentage}% rollout for ${input.flagKey}. Confirm blast radius.`;
  if (input.kind === 'module' && (input.enabled === false || input.visible === false)) return `High risk (${input.operation}): You are reducing module availability for ${input.moduleKey}.`;
  return null;
}

function asOptionalString(value: FormDataEntryValue | null) {
  const text = String(value ?? '').trim();
  return text ? text : undefined;
}

function csvValues(value: FormDataEntryValue | null) {
  return String(value ?? '').split(',').map((item) => item.trim()).filter(Boolean);
}

export function buildPreviewPayload(formData: FormData): PreviewRequest {
  const tenantId = asOptionalString(formData.get('tenantId'));
  const proposedScopeId = asOptionalString(formData.get('simulateScopeId')) ?? tenantId;
  const proposedFlagKey = asOptionalString(formData.get('simulateFlagKey'));

  return {
    tenantId,
    workspaceId: asOptionalString(formData.get('workspaceId')),
    userId: asOptionalString(formData.get('userId')),
    roleCodes: csvValues(formData.get('roleCodes')),
    currentModule: asOptionalString(formData.get('currentModule')),
    currentRoute: asOptionalString(formData.get('currentRoute')),
    featureKeys: csvValues(formData.get('featureKeys')),
    includeReasoning: true,
    includeBucketDetails: true,
    proposedRolloutRules: proposedFlagKey && proposedScopeId
      ? [{
          id: 'preview-rule',
          flagKey: proposedFlagKey,
          scopeType: String(formData.get('simulateScopeType') ?? 'tenant') as PercentageRolloutRule['scopeType'],
          scopeId: proposedScopeId,
          percentage: Number(formData.get('simulatePercentage') ?? 0),
          bucketBy: String(formData.get('simulateBucketBy') ?? 'tenant') as RolloutBucketBy,
          salt: String(formData.get('simulateSalt') ?? '').trim() || undefined,
          reason: String(formData.get('simulateReason') ?? 'preview').trim() || 'preview',
          enabled: true,
          metadata: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'preview',
          updatedBy: 'preview',
          version: 1,
        }]
      : [],
  };
}
