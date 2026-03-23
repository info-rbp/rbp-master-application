'use client';

import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import type { AuditEvent } from '@/lib/audit/types';
import type {
  BucketEvaluationResult,
  ControlPlaneIssue,
  FeatureCatalogEntry,
  FeatureEvaluationReason,
  FeatureEvaluationResult,
  FeatureFlagAssignment,
  FeatureFlagOperationalSummary,
  ModuleAccessControlResult,
  ModuleControlOperationalSummary,
  ModuleEnablementRule,
  PercentageRolloutRule,
  PreviewEvaluationResult,
  ReleaseStage,
  RolloutBucketBy,
} from '@/lib/feature-flags/types';

const releaseStages: ReleaseStage[] = ['experimental', 'internal', 'beta', 'limited', 'general_availability', 'deprecated'];
const rolloutBucketOptions: RolloutBucketBy[] = ['tenant', 'workspace', 'user', 'role', 'composite'];

type ClientProps = {
  catalog: FeatureCatalogEntry[];
  assignments: FeatureFlagAssignment[];
  rolloutRules: PercentageRolloutRule[];
  moduleRules: ModuleEnablementRule[];
  evaluations: FeatureEvaluationResult[];
  modules: ModuleAccessControlResult[];
  flagSummaries: FeatureFlagOperationalSummary[];
  moduleSummaries: ModuleControlOperationalSummary[];
  diagnostics: ControlPlaneIssue[];
  recentChanges: AuditEvent[];
  auditVisible: boolean;
  canManage: boolean;
  canManageModules: boolean;
  canPreview: boolean;
};

type TabKey = 'overview' | 'flags' | 'modules' | 'preview' | 'diagnostics' | 'recent';
type MutationMessage = { kind: 'success' | 'error'; text: string };
type PreviewRequest = {
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

type JsonResult<T> =
  | { ok: true; payload: T }
  | { ok: false; message: string; code?: string; status: number };

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

function formatDate(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function toneForSeverity(value: string) {
  if (value === 'critical') return 'border-red-200 bg-red-50 text-red-700';
  if (value === 'warning') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-slate-200 bg-slate-50 text-slate-700';
}

function toneForStage(value: ReleaseStage) {
  return {
    experimental: 'bg-fuchsia-100 text-fuchsia-700',
    internal: 'bg-indigo-100 text-indigo-700',
    beta: 'bg-sky-100 text-sky-700',
    limited: 'bg-amber-100 text-amber-700',
    general_availability: 'bg-emerald-100 text-emerald-700',
    deprecated: 'bg-rose-100 text-rose-700',
  }[value];
}

async function handleJsonResponse<T>(response: Response): Promise<JsonResult<T>> {
  const payload = await response.json().catch(() => ({}));
  if (response.ok) return { ok: true, payload: (payload.data ?? payload) as T };
  return { ok: false, message: payload?.error?.message ?? 'Request failed.', code: payload?.error?.code, status: response.status };
}

function highRiskMessage(input: { kind: 'assignment' | 'rollout' | 'module'; flagKey?: string; moduleKey?: string; scopeType?: string; percentage?: number; enabled?: boolean; visible?: boolean; isKillSwitch?: boolean }) {
  if (input.kind === 'assignment' && input.isKillSwitch) return `You are changing the kill switch ${input.flagKey}. Confirm that this is an incident-response action and that the reason is recorded.`;
  if (input.kind === 'assignment' && input.scopeType === 'environment') return `You are applying an environment-wide feature override for ${input.flagKey}. Confirm that you want a global change.`;
  if (input.kind === 'rollout' && (input.percentage ?? 0) >= 50) return `You are creating a ${input.percentage}% rollout for ${input.flagKey}. Confirm that this cohort expansion is intentional.`;
  if (input.kind === 'module' && (input.enabled === false || input.visible === false)) return `You are changing module availability for ${input.moduleKey}. Confirm that operators understand the impact and rollback plan.`;
  return null;
}

function asOptionalString(value: FormDataEntryValue | null) {
  const text = String(value ?? '').trim();
  return text ? text : undefined;
}

function csvValues(value: FormDataEntryValue | null) {
  return String(value ?? '').split(',').map((item) => item.trim()).filter(Boolean);
}

function buildPreviewPayload(formData: FormData): PreviewRequest {
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

export default function FeatureControlsClient(props: ClientProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [message, setMessage] = useState<MutationMessage | null>(null);
  const [flagSearch, setFlagSearch] = useState('');
  const [flagStage, setFlagStage] = useState('');
  const [flagStatus, setFlagStatus] = useState<'all' | 'enabled' | 'disabled' | 'issues'>('all');
  const [killSwitchOnly, setKillSwitchOnly] = useState(false);
  const [moduleSearch, setModuleSearch] = useState('');
  const [moduleStatus, setModuleStatus] = useState<'all' | 'enabled' | 'hidden' | 'issues'>('all');
  const [selectedFlagKey, setSelectedFlagKey] = useState(props.flagSummaries[0]?.flagKey ?? '');
  const [selectedModuleKey, setSelectedModuleKey] = useState(props.moduleSummaries[0]?.moduleKey ?? '');
  const [preview, setPreview] = useState<PreviewEvaluationResult | null>(null);
  const [previewBusy, setPreviewBusy] = useState(false);

  const flagRows = useMemo(() => buildFlagRows(props.flagSummaries, flagSearch, flagStage, flagStatus, killSwitchOnly), [props.flagSummaries, flagSearch, flagStage, flagStatus, killSwitchOnly]);
  const moduleRows = useMemo(() => buildModuleRows(props.moduleSummaries, moduleSearch, moduleStatus), [props.moduleSummaries, moduleSearch, moduleStatus]);
  const diagnosticSummary = useMemo(() => summarizeDiagnostics(props.diagnostics), [props.diagnostics]);
  const selectedFlag = props.flagSummaries.find((item) => item.flagKey === selectedFlagKey) ?? flagRows[0] ?? null;
  const selectedFlagEvaluation = props.evaluations.find((item) => item.flagKey === selectedFlag?.flagKey) ?? null;
  const selectedFlagAssignments = props.assignments.filter((item) => item.flagKey === selectedFlag?.flagKey);
  const selectedFlagRollouts = props.rolloutRules.filter((item) => item.flagKey === selectedFlag?.flagKey);
  const selectedFlagIssues = props.diagnostics.filter((item) => item.targetKey === selectedFlag?.flagKey);
  const selectedFlagAudit = props.recentChanges.filter((item) => item.subjectEntityId === selectedFlag?.flagKey || item.metadata?.flagKey === selectedFlag?.flagKey);
  const selectedModule = props.moduleSummaries.find((item) => item.moduleKey === selectedModuleKey) ?? moduleRows[0] ?? null;
  const selectedModuleRules = props.moduleRules.filter((item) => item.moduleKey === selectedModule?.moduleKey);
  const selectedModuleAudit = props.recentChanges.filter((item) => item.metadata?.moduleKey === selectedModule?.moduleKey || item.subjectEntityId === selectedModule?.winningRuleId);
  const selectedModuleIssues = props.diagnostics.filter((item) => item.targetKey === selectedModule?.moduleKey);
  const previewModulesWithIssues = preview?.evaluatedModules.filter((item) => !item.enabled || !item.visible || item.reasonCodes.length > 0) ?? [];

  async function createAssignment(formData: FormData) {
    const flagKey = String(formData.get('flagKey') ?? '');
    const definition = props.catalog.find((item) => item.flagKey === flagKey);
    const payload = { scopeType: String(formData.get('scopeType') ?? 'tenant'), scopeId: String(formData.get('scopeId') ?? ''), value: formData.get('value') === 'true', reason: String(formData.get('reason') ?? ''), enabled: true, metadata: {} };
    const risk = highRiskMessage({ kind: 'assignment', flagKey, scopeType: payload.scopeType, isKillSwitch: definition?.isKillSwitch });
    if (risk && !window.confirm(risk)) return;
    const result = await handleJsonResponse(await fetch(`/api/admin/feature-flags/${encodeURIComponent(flagKey)}/assignments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }));
    setMessage(result.ok ? { kind: 'success', text: `Saved assignment for ${flagKey}. Refresh to load the new effective state.` } : { kind: 'error', text: result.status === 409 ? `Concurrency conflict while saving ${flagKey}. Refresh and retry.` : result.message });
  }

  async function createRolloutRule(formData: FormData) {
    const flagKey = String(formData.get('flagKey') ?? '');
    const payload = { scopeType: String(formData.get('scopeType') ?? 'tenant'), scopeId: String(formData.get('scopeId') ?? ''), percentage: Number(formData.get('percentage') ?? 0), bucketBy: String(formData.get('bucketBy') ?? 'tenant'), salt: String(formData.get('salt') ?? ''), reason: String(formData.get('reason') ?? ''), enabled: true, metadata: {} };
    const risk = highRiskMessage({ kind: 'rollout', flagKey, percentage: payload.percentage });
    if (risk && !window.confirm(risk)) return;
    const result = await handleJsonResponse(await fetch(`/api/admin/feature-flags/${encodeURIComponent(flagKey)}/rollout-rules`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }));
    setMessage(result.ok ? { kind: 'success', text: `Saved rollout rule for ${flagKey}. Refresh to inspect bucket reasoning.` } : { kind: 'error', text: result.status === 409 ? `Concurrency conflict while saving rollout for ${flagKey}.` : result.message });
  }

  async function createModuleRule(formData: FormData) {
    const payload = Object.fromEntries(formData.entries());
    const request = { moduleKey: String(payload.moduleKey), scopeType: String(payload.scopeType), scopeId: String(payload.scopeId), enabled: payload.enabled === 'true', visible: payload.visible === 'true', internalOnly: payload.internalOnly === 'true', betaOnly: payload.betaOnly === 'true', reason: String(payload.reason ?? ''), metadata: {} };
    const risk = highRiskMessage({ kind: 'module', moduleKey: request.moduleKey, enabled: request.enabled, visible: request.visible });
    if (risk && !window.confirm(risk)) return;
    const result = await handleJsonResponse(await fetch('/api/admin/module-controls', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request) }));
    setMessage(result.ok ? { kind: 'success', text: `Saved module rule for ${request.moduleKey}. Refresh to validate the winning state.` } : { kind: 'error', text: result.status === 409 ? `Concurrency conflict while saving ${request.moduleKey}.` : result.message });
  }

  async function disableAssignment(id: string, version: number) {
    if (!window.confirm('Disable this assignment? This is the safest rollback path for a stale override.')) return;
    const result = await handleJsonResponse(await fetch(`/api/admin/feature-flags/assignments/${encodeURIComponent(id)}?expectedVersion=${version}`, { method: 'DELETE' }));
    setMessage(result.ok ? { kind: 'success', text: 'Assignment disabled. Refresh to confirm the new effective state.' } : { kind: 'error', text: result.message });
  }

  async function disableRolloutRule(id: string, version: number) {
    if (!window.confirm('Disable this rollout rule? This immediately removes it from matching cohorts.')) return;
    const result = await handleJsonResponse(await fetch(`/api/admin/feature-flags/rollout-rules/${encodeURIComponent(id)}?expectedVersion=${version}`, { method: 'DELETE' }));
    setMessage(result.ok ? { kind: 'success', text: 'Rollout rule disabled. Refresh to verify the next winning rule.' } : { kind: 'error', text: result.message });
  }

  async function disableModuleRule(id: string, version: number) {
    if (!window.confirm('Disable this module rule? This can change navigation visibility and access.')) return;
    const result = await handleJsonResponse(await fetch(`/api/admin/module-controls/rules/${encodeURIComponent(id)}?expectedVersion=${version}`, { method: 'DELETE' }));
    setMessage(result.ok ? { kind: 'success', text: 'Module rule disabled. Refresh to validate module availability.' } : { kind: 'error', text: result.message });
  }

  async function runPreview(formData: FormData) {
    setPreviewBusy(true);
    const payload = buildPreviewPayload(formData);
    const result = await handleJsonResponse<PreviewEvaluationResult>(await fetch('/api/admin/feature-preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }));
    setPreviewBusy(false);
    if (result.ok) {
      setPreview(result.payload);
      setMessage({ kind: 'success', text: 'Preview refreshed with runtime-equivalent reasoning and bucket diagnostics.' });
      return;
    }
    setPreview(null);
    setMessage({ kind: 'error', text: result.message });
  }

  return (
    <div className="space-y-6 p-4 pt-6 md:p-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Feature control operations console</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">Operate feature flags, module controls, rollouts, kill switches, diagnostics, preview, and audit history from a backend-owned control plane. Sprint 2 is finalised on the same evaluation truth path used by runtime checks.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {(['overview', 'flags', 'modules', 'preview', 'diagnostics', 'recent'] as TabKey[]).map((tab) => (
            <button key={tab} className={`rounded-full border px-3 py-2 capitalize ${activeTab === tab ? 'border-slate-900 bg-slate-900 text-white' : 'bg-white text-slate-700'}`} onClick={() => setActiveTab(tab)}>
              {tab === 'recent' ? 'Recent changes' : tab}
            </button>
          ))}
        </div>
      </div>

      {message ? <div className={`rounded border px-3 py-2 text-sm ${message.kind === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>{message.text}</div> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <SummaryCard title="Flags" value={props.flagSummaries.length} helper="Catalog entries" />
        <SummaryCard title="Kill switches" value={diagnosticSummary.activeKillSwitches} helper="Currently active" tone="critical" />
        <SummaryCard title="Diagnostics" value={diagnosticSummary.total} helper={`${diagnosticSummary.critical} critical`} tone={diagnosticSummary.critical > 0 ? 'critical' : 'default'} />
        <SummaryCard title="Scheduled changes" value={diagnosticSummary.scheduled} helper="Future-start rules" />
        <SummaryCard title="Module overrides" value={props.moduleSummaries.filter((item) => item.hasOverrides).length} helper="Non-default modules" />
        <SummaryCard title="Runtime-visible modules" value={props.modules.length} helper="Enabled and visible now" />
      </section>

      {activeTab === 'overview' ? (
        <section className="grid gap-6 xl:grid-cols-[1.5fr,1fr]">
          <div className="space-y-6">
            <Panel title="Active kill switches" description="Emergency controls are elevated because they represent live service-impacting state.">
              {props.flagSummaries.filter((item) => item.activeKillSwitch).length === 0 ? <EmptyState text="No kill switches are currently active." /> : props.flagSummaries.filter((item) => item.activeKillSwitch).map((item) => <RowBadge key={item.flagKey} title={item.name} subtitle={`${item.flagKey} · ${item.winningScope}`} badges={[{ label: 'active', tone: 'critical' }, { label: item.releaseStage.replaceAll('_', ' '), tone: 'neutral' }]} />)}
            </Panel>
            <Panel title="Diagnostics queue" description="Conflicts, stale rules, dependency blockers, and dangerous states that should be triaged quickly.">
              <div className="space-y-3">
                {props.diagnostics.slice(0, 8).map((issue) => (
                  <div key={issue.id} className={`rounded border p-3 ${toneForSeverity(issue.severity)}`}>
                    <div className="flex items-center justify-between gap-3"><div className="font-medium">{issue.summary}</div><Badge label={issue.targetKey} tone="neutral" /></div>
                    <div className="mt-1 text-xs">{issue.detail}</div>
                  </div>
                ))}
                {props.diagnostics.length === 0 ? <EmptyState text="No diagnostics are currently raised." /> : null}
              </div>
            </Panel>
          </div>
          <div className="space-y-6">
            <Panel title="Recent changes" description="Latest control-plane activity, embedded into the operations workflow.">
              <div className="space-y-3 text-sm">
                {props.recentChanges.slice(0, 8).map((item) => <AuditRow key={item.id} item={item} />)}
                {props.recentChanges.length === 0 ? <EmptyState text={props.auditVisible ? 'No recent control-plane changes.' : 'Audit history is not visible in this session.'} /> : null}
              </div>
            </Panel>
            <Panel title="Operator guidance" description="Recommended flow during rollout and rollback work.">
              <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                <li>Review diagnostics before making changes.</li>
                <li>Use preview for the target tenant/workspace/user cohort.</li>
                <li>Record a reason for high-risk changes, especially kill switches and global overrides.</li>
                <li>After save, verify effective state, audit history, and blockers from the detail view.</li>
              </ol>
            </Panel>
          </div>
        </section>
      ) : null}

      {activeTab === 'flags' ? (
        <section className="grid gap-6 xl:grid-cols-[1.1fr,1.4fr,1fr]">
          <Panel title="Feature catalog" description="Filter by identity, stage, and issue state to find controls quickly.">
            <div className="space-y-3">
              <input className="w-full rounded border px-3 py-2 text-sm" placeholder="Search key, name, category, tag" value={flagSearch} onChange={(event) => setFlagSearch(event.target.value)} />
              <div className="grid gap-2 md:grid-cols-2">
                <select className="rounded border px-3 py-2 text-sm" value={flagStage} onChange={(event) => setFlagStage(event.target.value)}><option value="">All release stages</option>{releaseStages.map((stage) => <option key={stage} value={stage}>{stage.replaceAll('_', ' ')}</option>)}</select>
                <select className="rounded border px-3 py-2 text-sm" value={flagStatus} onChange={(event) => setFlagStatus(event.target.value as typeof flagStatus)}><option value="all">All states</option><option value="enabled">Enabled now</option><option value="disabled">Disabled now</option><option value="issues">Has diagnostics</option></select>
              </div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={killSwitchOnly} onChange={(event) => setKillSwitchOnly(event.target.checked)} /> Kill switches only</label>
              <div className="space-y-2">
                {flagRows.map((item) => (
                  <button key={item.flagKey} className={`w-full rounded border p-3 text-left ${selectedFlag?.flagKey === item.flagKey ? 'border-slate-900 bg-slate-50' : 'bg-white'}`} onClick={() => setSelectedFlagKey(item.flagKey)}>
                    <div className="flex items-center justify-between gap-3"><div className="font-medium">{item.name}</div><div className={`rounded-full px-2 py-1 text-xs ${item.effectiveEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>{item.effectiveEnabled ? 'enabled' : 'disabled'}</div></div>
                    <div className="mt-1 text-xs text-muted-foreground">{item.flagKey} · {item.category}</div>
                    <div className="mt-2 flex flex-wrap gap-2">{item.isKillSwitch ? <Badge label="kill switch" tone="critical" /> : null}<Badge label={item.releaseStage.replaceAll('_', ' ')} tone="neutral" /><Badge label={item.hasOverrides ? 'overrides' : 'default-only'} tone="neutral" />{item.diagnostics.length > 0 ? <Badge label={`${item.diagnostics.length} issues`} tone="warning" /> : null}</div>
                  </button>
                ))}
                {flagRows.length === 0 ? <EmptyState text="No flags matched the current filters." /> : null}
              </div>
            </div>
          </Panel>

          <Panel title={selectedFlag ? `${selectedFlag.name} detail` : 'Feature detail'} description="Effective state, winning source, blockers, runtime rules, preview entry point, and embedded audit.">
            {selectedFlag && selectedFlagEvaluation ? (
              <div className="space-y-4 text-sm">
                <div className="flex flex-wrap gap-2"><Badge label={selectedFlag.flagKey} tone="neutral" /><span className={`rounded-full px-2 py-1 text-xs ${toneForStage(selectedFlag.releaseStage)}`}>{selectedFlag.releaseStage.replaceAll('_', ' ')}</span>{selectedFlag.isKillSwitch ? <Badge label="kill switch" tone="critical" /> : null}{selectedFlag.isDeprecated ? <Badge label="deprecated" tone="warning" /> : null}</div>
                <p className="text-muted-foreground">{selectedFlag.description}</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <DetailStat label="Effective state" value={selectedFlag.effectiveEnabled ? 'Enabled' : 'Disabled'} />
                  <DetailStat label="Winning source" value={selectedFlag.winningSource} />
                  <DetailStat label="Winning scope" value={selectedFlag.winningScope} />
                  <DetailStat label="Current value" value={String(selectedFlag.effectiveValue)} />
                  <DetailStat label="Overrides" value={`${selectedFlag.activeAssignmentCount} assignments / ${selectedFlag.activeRolloutCount} rollouts`} />
                  <DetailStat label="Last changed" value={`${formatDate(selectedFlag.lastUpdatedAt)} by ${selectedFlag.lastUpdatedBy ?? '—'}`} />
                </div>
                <SectionTitle title="Explainability" />
                <ReasonList reasons={selectedFlagEvaluation.reasons} empty="No extra reasoning was needed for the current decision." />
                {selectedFlagEvaluation.bucketResult ? <BucketDetailsCard bucketResult={selectedFlagEvaluation.bucketResult} /> : null}
                <SectionTitle title="Diagnostics" />
                <div className="space-y-2">{selectedFlagIssues.length > 0 ? selectedFlagIssues.map((issue) => <div key={issue.id} className={`rounded border p-3 ${toneForSeverity(issue.severity)}`}><div className="font-medium">{issue.summary}</div><div className="text-xs">{issue.detail}</div></div>) : <EmptyState text="No diagnostics are raised for this feature." />}</div>
                <SectionTitle title="Assignments" />
                <RuleList items={selectedFlagAssignments} empty="No assignments for this flag." onDisable={props.canManage ? disableAssignment : undefined} render={(item) => `${item.scopeType}:${item.scopeId} · value=${String(item.value)} · ${item.enabled ? 'active' : 'disabled'} · v${item.version}`} />
                <SectionTitle title="Rollout rules" />
                <RuleList items={selectedFlagRollouts} empty="No rollout rules for this flag." onDisable={props.canManage ? disableRolloutRule : undefined} render={(item) => `${item.scopeType}:${item.scopeId} · ${item.percentage}% by ${item.bucketBy} · ${item.enabled ? 'active' : 'disabled'} · v${item.version}`} />
                <SectionTitle title="Audit history" />
                <div className="space-y-2">{selectedFlagAudit.length > 0 ? selectedFlagAudit.slice(0, 6).map((item) => <AuditRow key={item.id} item={item} />) : <EmptyState text={props.auditVisible ? 'No related audit events.' : 'Audit history is not visible in this session.'} />}</div>
              </div>
            ) : <EmptyState text="Select a feature flag to inspect its effective state." />}
          </Panel>

          <div className="space-y-6">
            <Panel title="Create feature assignment" description="Use explicit overrides for surgical access changes or emergency controls.">
              {props.canManage ? <form action={createAssignment} className="space-y-3"><input name="flagKey" defaultValue={selectedFlag?.flagKey ?? ''} placeholder="feature.search.enabled" className="w-full rounded border px-3 py-2 text-sm" /><div className="grid grid-cols-2 gap-2"><input name="scopeType" defaultValue="tenant" className="rounded border px-3 py-2 text-sm" /><input name="scopeId" placeholder="ten_acme_customer" className="rounded border px-3 py-2 text-sm" /></div><select name="value" className="w-full rounded border px-3 py-2 text-sm"><option value="true">true</option><option value="false">false</option></select><textarea name="reason" placeholder="Reason (required for high-risk changes)" className="w-full rounded border px-3 py-2 text-sm" /><button className="rounded bg-slate-900 px-3 py-2 text-sm text-white">Save assignment</button></form> : <EmptyState text="You do not have permission to manage assignments." />}
            </Panel>
            <Panel title="Create percentage rollout" description="Preview big jumps before saving. Rollouts above 50% require explicit confirmation.">
              {props.canManage ? <form action={createRolloutRule} className="space-y-3"><input name="flagKey" defaultValue={selectedFlag?.flagKey ?? ''} placeholder="feature.search.enabled" className="w-full rounded border px-3 py-2 text-sm" /><div className="grid grid-cols-2 gap-2"><input name="scopeType" defaultValue="tenant" className="rounded border px-3 py-2 text-sm" /><input name="scopeId" placeholder="ten_acme_customer" className="rounded border px-3 py-2 text-sm" /></div><div className="grid grid-cols-2 gap-2"><input name="percentage" type="number" min={0} max={100} defaultValue={25} className="rounded border px-3 py-2 text-sm" /><select name="bucketBy" className="rounded border px-3 py-2 text-sm">{rolloutBucketOptions.map((bucketBy) => <option key={bucketBy} value={bucketBy}>{bucketBy}</option>)}</select></div><input name="salt" placeholder="optional salt" className="w-full rounded border px-3 py-2 text-sm" /><textarea name="reason" placeholder="Why is this rollout changing?" className="w-full rounded border px-3 py-2 text-sm" /><button className="rounded bg-slate-900 px-3 py-2 text-sm text-white">Save rollout rule</button></form> : <EmptyState text="You do not have permission to manage rollouts." />}
            </Panel>
          </div>
        </section>
      ) : null}

      {activeTab === 'modules' ? (
        <section className="grid gap-6 xl:grid-cols-[1fr,1.4fr,1fr]">
          <Panel title="Module controls catalog" description="Search for modules with overrides, hidden state, or diagnostics.">
            <div className="space-y-3"><input className="w-full rounded border px-3 py-2 text-sm" placeholder="Search module key or name" value={moduleSearch} onChange={(event) => setModuleSearch(event.target.value)} /><select className="w-full rounded border px-3 py-2 text-sm" value={moduleStatus} onChange={(event) => setModuleStatus(event.target.value as typeof moduleStatus)}><option value="all">All states</option><option value="enabled">Enabled now</option><option value="hidden">Hidden now</option><option value="issues">Has diagnostics</option></select><div className="space-y-2">{moduleRows.map((item) => <button key={item.moduleKey} className={`w-full rounded border p-3 text-left ${selectedModule?.moduleKey === item.moduleKey ? 'border-slate-900 bg-slate-50' : 'bg-white'}`} onClick={() => setSelectedModuleKey(item.moduleKey)}><div className="flex items-center justify-between gap-3"><div className="font-medium">{item.moduleName}</div><Badge label={item.effectiveEnabled ? 'enabled' : 'disabled'} tone={item.effectiveEnabled ? 'success' : 'neutral'} /></div><div className="mt-1 text-xs text-muted-foreground">{item.moduleKey} · {item.category}</div><div className="mt-2 flex flex-wrap gap-2">{item.internalOnly ? <Badge label="internal" tone="warning" /> : null}{item.betaOnly ? <Badge label="beta-only" tone="warning" /> : null}{item.diagnostics.length > 0 ? <Badge label={`${item.diagnostics.length} issues`} tone="warning" /> : null}</div></button>)}{moduleRows.length === 0 ? <EmptyState text="No modules matched the current filters." /> : null}</div></div>
          </Panel>
          <Panel title={selectedModule ? `${selectedModule.moduleName} detail` : 'Module detail'} description="Winning module rule, visibility, blockers, rollback rules, and audit history.">
            {selectedModule ? <div className="space-y-4 text-sm"><div className="flex flex-wrap gap-2"><Badge label={selectedModule.moduleKey} tone="neutral" />{selectedModule.internalOnly ? <Badge label="internal only" tone="warning" /> : null}{selectedModule.betaOnly ? <Badge label="beta only" tone="warning" /> : null}</div><p className="text-muted-foreground">{selectedModule.description}</p><div className="grid gap-3 md:grid-cols-2"><DetailStat label="Enabled" value={selectedModule.effectiveEnabled ? 'Yes' : 'No'} /><DetailStat label="Visible" value={selectedModule.effectiveVisible ? 'Yes' : 'No'} /><DetailStat label="Winning source" value={selectedModule.winningSource} /><DetailStat label="Winning rule" value={selectedModule.winningRuleId ?? 'Definition'} /><DetailStat label="Default landing" value={selectedModule.defaultLanding ?? selectedModule.route} /><DetailStat label="Last changed" value={`${formatDate(selectedModule.lastUpdatedAt)} by ${selectedModule.lastUpdatedBy ?? '—'}`} /></div><SectionTitle title="Runtime blockers" /><div className="flex flex-wrap gap-2">{selectedModule.reasonCodes.length > 0 ? selectedModule.reasonCodes.map((code) => <Badge key={code} label={code} tone="warning" />) : <Badge label="no blockers" tone="success" />}</div><SectionTitle title="Diagnostics" /><div className="space-y-2">{selectedModuleIssues.length > 0 ? selectedModuleIssues.map((issue) => <div key={issue.id} className={`rounded border p-3 ${toneForSeverity(issue.severity)}`}><div className="font-medium">{issue.summary}</div><div className="text-xs">{issue.detail}</div></div>) : <EmptyState text="No diagnostics are raised for this module." />}</div><SectionTitle title="Module rules" /><RuleList items={selectedModuleRules} empty="No module rules for this module." onDisable={props.canManageModules ? disableModuleRule : undefined} render={(item) => `${item.scopeType}:${item.scopeId} · enabled=${String(item.enabled)} · visible=${String(item.visible)} · v${item.version}`} /><SectionTitle title="Audit history" /><div className="space-y-2">{selectedModuleAudit.length > 0 ? selectedModuleAudit.slice(0, 6).map((item) => <AuditRow key={item.id} item={item} />) : <EmptyState text={props.auditVisible ? 'No related audit events.' : 'Audit history is not visible in this session.'} />}</div></div> : <EmptyState text="Select a module to inspect its effective state." />}
          </Panel>
          <Panel title="Create module rule" description="High-risk module availability changes require explicit confirmation.">
            {props.canManageModules ? <form action={createModuleRule} className="space-y-3"><input name="moduleKey" defaultValue={selectedModule?.moduleKey ?? ''} placeholder="analytics" className="w-full rounded border px-3 py-2 text-sm" /><div className="grid grid-cols-2 gap-2"><input name="scopeType" defaultValue="tenant" className="rounded border px-3 py-2 text-sm" /><input name="scopeId" placeholder="ten_acme_customer" className="rounded border px-3 py-2 text-sm" /></div><div className="grid grid-cols-2 gap-2"><select name="enabled" className="rounded border px-3 py-2 text-sm"><option value="true">enabled</option><option value="false">disabled</option></select><select name="visible" className="rounded border px-3 py-2 text-sm"><option value="true">visible</option><option value="false">hidden</option></select></div><div className="grid grid-cols-2 gap-2"><select name="internalOnly" className="rounded border px-3 py-2 text-sm"><option value="false">external ok</option><option value="true">internal only</option></select><select name="betaOnly" className="rounded border px-3 py-2 text-sm"><option value="false">not beta only</option><option value="true">beta only</option></select></div><textarea name="reason" placeholder="Why is this changing?" className="w-full rounded border px-3 py-2 text-sm" /><button className="rounded bg-slate-900 px-3 py-2 text-sm text-white">Save module rule</button></form> : <EmptyState text="You do not have permission to manage module rules." />}
          </Panel>
        </section>
      ) : null}

      {activeTab === 'preview' ? (
        <section className="grid gap-6 xl:grid-cols-[1fr,1.2fr]">
          <Panel title="Preview / simulation" description="Run backend-owned evaluations with reasoning, bucket details, and optional unsaved rollout simulation.">
            {props.canPreview ? <form action={runPreview} className="space-y-3"><div className="grid grid-cols-2 gap-2"><input name="tenantId" placeholder="tenant id" className="rounded border px-3 py-2 text-sm" /><input name="workspaceId" placeholder="workspace id" className="rounded border px-3 py-2 text-sm" /></div><div className="grid grid-cols-2 gap-2"><input name="userId" placeholder="user id" className="rounded border px-3 py-2 text-sm" /><input name="roleCodes" placeholder="role codes csv" className="rounded border px-3 py-2 text-sm" /></div><div className="grid grid-cols-2 gap-2"><input name="currentModule" placeholder="current module" className="rounded border px-3 py-2 text-sm" /><input name="currentRoute" placeholder="current route" className="rounded border px-3 py-2 text-sm" /></div><input name="featureKeys" defaultValue={selectedFlag?.flagKey ?? ''} placeholder="feature keys csv" className="w-full rounded border px-3 py-2 text-sm" /><div className="rounded border p-3"><div className="mb-2 text-sm font-medium">Optional unsaved rollout comparison</div><div className="grid grid-cols-2 gap-2"><input name="simulateFlagKey" defaultValue={selectedFlag?.flagKey ?? ''} placeholder="feature.search.enabled" className="rounded border px-3 py-2 text-sm" /><input name="simulateScopeId" placeholder="scope id" className="rounded border px-3 py-2 text-sm" /></div><div className="mt-2 grid grid-cols-2 gap-2"><input name="simulateScopeType" defaultValue="tenant" className="rounded border px-3 py-2 text-sm" /><input name="simulatePercentage" type="number" min={0} max={100} defaultValue={25} className="rounded border px-3 py-2 text-sm" /></div><div className="mt-2 grid grid-cols-2 gap-2"><select name="simulateBucketBy" className="rounded border px-3 py-2 text-sm">{rolloutBucketOptions.map((bucketBy) => <option key={bucketBy} value={bucketBy}>{bucketBy}</option>)}</select><input name="simulateSalt" placeholder="salt" className="rounded border px-3 py-2 text-sm" /></div><textarea name="simulateReason" placeholder="preview reason" className="mt-2 w-full rounded border px-3 py-2 text-sm" /></div><button className="rounded bg-slate-900 px-3 py-2 text-sm text-white">{previewBusy ? 'Running…' : 'Run preview'}</button></form> : <EmptyState text="You do not have permission to run rollout preview." />}
          </Panel>
          <Panel title="Preview results" description="Compare current state against preview results without mentally parsing raw API JSON.">
            {preview ? (
              <div className="space-y-4 text-sm">
                <div className="rounded border bg-slate-50 p-3 text-xs">Context: {JSON.stringify(preview.contextSummary)}</div>
                {preview.evaluatedFlags.map((item) => {
                  const current = props.evaluations.find((entry) => entry.flagKey === item.flagKey);
                  return (
                    <div key={item.flagKey} className="rounded border p-3">
                      <div className="flex items-center justify-between gap-3"><div className="font-medium">{item.flagKey}</div><div className="flex gap-2"><Badge label={`current ${current?.enabled ? 'enabled' : 'disabled'}`} tone="neutral" /><Badge label={`preview ${item.enabled ? 'enabled' : 'disabled'}`} tone={item.enabled ? 'success' : 'warning'} /></div></div>
                      <div className="mt-1 text-xs text-muted-foreground">source={item.source} · scope={item.scopeType}{item.scopeId ? `:${item.scopeId}` : ''}</div>
                      <div className="mt-2 flex flex-wrap gap-2"><Badge label={item.releaseStage.replaceAll('_', ' ')} tone="neutral" />{item.reasonCodes.length > 0 ? item.reasonCodes.map((code) => <Badge key={code} label={code} tone="warning" />) : <Badge label="no blockers" tone="success" />}</div>
                      <div className="mt-3 grid gap-3 md:grid-cols-2"><DetailStat label="Preview enabled" value={item.enabled ? 'Yes' : 'No'} /><DetailStat label="Current enabled" value={current?.enabled ? 'Yes' : 'No'} /><DetailStat label="Winning source" value={item.source} /><DetailStat label="Winning scope" value={item.scopeId ? `${item.scopeType}:${item.scopeId}` : item.scopeType} /></div>
                      <div className="mt-3"><ReasonList reasons={item.reasons} empty="No structured reasons were returned for this preview." compact /></div>
                      {item.bucketResult ? <div className="mt-3"><BucketDetailsCard bucketResult={item.bucketResult} /></div> : null}
                    </div>
                  );
                })}
                {preview.missingDependencies.length > 0 ? <div className="rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">Missing dependencies: {preview.missingDependencies.join(', ')}</div> : null}
                {preview.conflicts.length > 0 ? <div className="rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700">Conflicts: {preview.conflicts.join(', ')}</div> : null}
                <div className="rounded border p-3">
                  <div className="font-medium">Previewed modules</div>
                  <div className="mt-1 text-xs text-muted-foreground">Modules are evaluated through the same feature-flag truth path, including any simulated rollout rules.</div>
                  <div className="mt-3 space-y-2">{previewModulesWithIssues.length > 0 ? previewModulesWithIssues.map((item) => <div key={item.moduleKey} className="rounded border bg-slate-50 p-3"><div className="flex items-center justify-between gap-3"><div className="font-medium">{item.moduleKey}</div><div className="flex gap-2"><Badge label={item.enabled ? 'enabled' : 'disabled'} tone={item.enabled ? 'success' : 'warning'} /><Badge label={item.visible ? 'visible' : 'hidden'} tone={item.visible ? 'neutral' : 'warning'} /></div></div><div className="mt-1 text-xs text-muted-foreground">source={item.source} · dependsOn={item.dependsOnFlags.join(', ') || '—'}</div><div className="mt-2 flex flex-wrap gap-2">{item.reasonCodes.length > 0 ? item.reasonCodes.map((code) => <Badge key={code} label={code} tone="warning" />) : <Badge label="no blockers" tone="success" />}</div></div>) : <EmptyState text="No previewed modules were blocked or hidden for this context." />}</div>
                </div>
              </div>
            ) : <EmptyState text="Run a preview to inspect reasoning, bucket details, and compare current versus proposed behavior." />}
          </Panel>
        </section>
      ) : null}

      {activeTab === 'diagnostics' ? (
        <Panel title="Diagnostics and stale configuration" description="Surface conflicts, expired rules, dependency blockers, and dangerous states before users notice them.">
          <div className="grid gap-4 md:grid-cols-4">{['critical', 'warning', 'info'].map((severity) => <SummaryCard key={severity} title={severity} value={props.diagnostics.filter((item) => item.severity === severity).length} helper="issues" tone={severity === 'critical' ? 'critical' : 'default'} />)}<SummaryCard title="Kill switches" value={diagnosticSummary.activeKillSwitches} helper="active now" tone="critical" /></div>
          <div className="mt-4 space-y-3">{props.diagnostics.map((issue) => <div key={issue.id} className={`rounded border p-3 ${toneForSeverity(issue.severity)}`}><div className="flex items-center justify-between gap-3"><div><div className="font-medium">{issue.summary}</div><div className="text-xs">{issue.detail}</div></div><div className="text-right text-xs"><div>{issue.area}</div><div>{issue.status}</div></div></div></div>)}{props.diagnostics.length === 0 ? <EmptyState text="No diagnostics are currently raised." /> : null}</div>
        </Panel>
      ) : null}

      {activeTab === 'recent' ? (
        <Panel title="Recent control-plane changes" description="Embedded audit visibility for assignment, rollout, kill switch, and module-control operations.">
          <div className="space-y-3">{props.recentChanges.map((item) => <AuditRow key={item.id} item={item} />)}{props.recentChanges.length === 0 ? <EmptyState text={props.auditVisible ? 'No recent changes found.' : 'Audit visibility is not available for this operator.'} /> : null}</div>
        </Panel>
      ) : null}
    </div>
  );
}

function Panel({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <div className="rounded border bg-white p-4"><div className="mb-3"><h2 className="text-xl font-semibold">{title}</h2><p className="text-sm text-muted-foreground">{description}</p></div>{children}</div>;
}

function SummaryCard({ title, value, helper, tone = 'default' }: { title: string; value: number; helper: string; tone?: 'default' | 'critical' }) {
  return <div className={`rounded border p-4 ${tone === 'critical' ? 'border-red-200 bg-red-50' : 'bg-white'}`}><div className="text-sm text-muted-foreground">{title}</div><div className="text-2xl font-semibold">{value}</div><div className="text-xs text-muted-foreground">{helper}</div></div>;
}

function Badge({ label, tone }: { label: string; tone: 'neutral' | 'warning' | 'critical' | 'success' }) {
  const className = {
    neutral: 'bg-slate-100 text-slate-700',
    warning: 'bg-amber-100 text-amber-700',
    critical: 'bg-red-100 text-red-700',
    success: 'bg-emerald-100 text-emerald-700',
  }[tone];
  return <span className={`rounded-full px-2 py-1 text-xs ${className}`}>{label}</span>;
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded border bg-slate-50 p-3"><div className="text-xs text-muted-foreground">{label}</div><div className="mt-1 font-medium">{value}</div></div>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded border border-dashed p-4 text-sm text-muted-foreground">{text}</div>;
}

function SectionTitle({ title }: { title: string }) {
  return <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</div>;
}

function RowBadge({ title, subtitle, badges }: { title: string; subtitle: string; badges: Array<{ label: string; tone: 'neutral' | 'warning' | 'critical' | 'success' }> }) {
  return <div className="rounded border p-3"><div className="font-medium">{title}</div><div className="text-xs text-muted-foreground">{subtitle}</div><div className="mt-2 flex flex-wrap gap-2">{badges.map((badge) => <Badge key={badge.label} label={badge.label} tone={badge.tone} />)}</div></div>;
}

function RuleList<T extends { id: string; updatedAt: string; reason: string; version: number }>(props: { items: T[]; empty: string; render: (item: T) => string; onDisable?: (id: string, version: number) => void }) {
  return <div className="space-y-2">{props.items.length > 0 ? props.items.map((item) => <div key={item.id} className="rounded border p-3"><div className="flex items-start justify-between gap-3"><div><div className="font-medium">{props.render(item)}</div><div className="mt-1 text-xs text-muted-foreground">{item.reason || 'No reason recorded.'} · updated {formatDate(item.updatedAt)}</div></div>{props.onDisable ? <button className="rounded border px-3 py-1 text-xs" onClick={() => props.onDisable?.(item.id, item.version)}>Disable</button> : null}</div></div>) : <EmptyState text={props.empty} />}</div>;
}

function ReasonList({ reasons, empty, compact = false }: { reasons: FeatureEvaluationReason[]; empty: string; compact?: boolean }) {
  if (reasons.length === 0) return <EmptyState text={empty} />;
  return (
    <div className="space-y-2">
      {reasons.map((entry, index) => (
        <div key={`${entry.code}-${index}`} className={`rounded border bg-slate-50 ${compact ? 'p-2' : 'p-3'}`}>
          <div className="flex flex-wrap items-center gap-2"><div className="font-medium">{entry.code}</div><Badge label={entry.category.replaceAll('_', ' ')} tone="neutral" />{entry.scopeType ? <Badge label={`${entry.scopeType}${entry.scopeId ? `:${entry.scopeId}` : ''}`} tone="warning" /> : null}</div>
          <div className="mt-1 text-xs text-muted-foreground">{entry.message}</div>
          {entry.details ? <pre className="mt-2 overflow-x-auto rounded bg-white p-2 text-[11px] text-slate-600">{JSON.stringify(entry.details, null, 2)}</pre> : null}
        </div>
      ))}
    </div>
  );
}

function BucketDetailsCard({ bucketResult }: { bucketResult: BucketEvaluationResult }) {
  return <div className="rounded border bg-slate-50 p-3 text-xs">Bucket details: normalized key <code>{bucketResult.normalizedKey}</code>, bucket {bucketResult.bucket}, threshold {bucketResult.threshold}, matched {String(bucketResult.matched)}, salt {bucketResult.saltUsed ?? 'default'}.</div>;
}

function AuditRow({ item }: { item: AuditEvent }) {
  return <div className="rounded border p-3"><div className="flex items-center justify-between gap-3"><div className="font-medium">{item.eventType}</div><Badge label={item.severity} tone={item.severity === 'critical' ? 'critical' : item.severity === 'warning' ? 'warning' : 'neutral'} /></div><div className="mt-1 text-xs text-muted-foreground">{item.actorDisplay ?? item.actorId ?? 'system'} · {formatDate(item.timestamp)}</div><div className="mt-1 text-xs text-muted-foreground">{item.subjectEntityId ?? item.targetEntityId ?? '—'} · {item.reason ?? String(item.metadata?.reason ?? 'No reason recorded')}</div></div>;
}
