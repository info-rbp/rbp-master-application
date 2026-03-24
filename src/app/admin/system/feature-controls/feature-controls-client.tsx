'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AuditEvent } from '@/lib/audit/types';
import type {
  ControlPlaneIssue,
  FeatureCatalogEntry,
  FeatureEvaluationResult,
  FeatureFlagAssignment,
  FeatureFlagOperationalSummary,
  ModuleAccessControlResult,
  ModuleControlOperationalSummary,
  ModuleEnablementRule,
  PercentageRolloutRule,
  PreviewEvaluationResult,
} from '@/lib/feature-flags/types';
import {
  buildFlagRows,
  buildModuleRows,
  buildPreviewPayload,
  handleJsonResponse,
  highRiskMessage,
  releaseStages,
  rolloutBucketOptions,
  summarizeDiagnostics,
  TabKey,
  type MutationMessage,
  toneForSeverity,
  toneForStage,
  formatDate,
} from './components/feature-controls-utils';
import {
  AuditRow,
  Badge,
  BucketDetailsCard,
  DetailStat,
  EmptyState,
  Panel,
  ReasonList,
  RowBadge,
  RuleList,
  SectionTitle,
  SummaryCard,
} from './components/feature-controls-shared';

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

export default function FeatureControlsClient(props: ClientProps) {
  const router = useRouter();
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
  const [diagnosticSeverity, setDiagnosticSeverity] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [diagnosticArea, setDiagnosticArea] = useState<'all' | 'feature_flag' | 'module_control'>('all');
  const [diagnosticTarget, setDiagnosticTarget] = useState('');
  const [editingAssignment, setEditingAssignment] = useState<FeatureFlagAssignment | null>(null);
  const [editingRollout, setEditingRollout] = useState<PercentageRolloutRule | null>(null);
  const [editingModuleRule, setEditingModuleRule] = useState<ModuleEnablementRule | null>(null);

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

  const filteredDiagnostics = useMemo(() => {
    const targetNeedle = diagnosticTarget.trim().toLowerCase();
    return props.diagnostics.filter((issue) => {
      if (diagnosticSeverity !== 'all' && issue.severity !== diagnosticSeverity) return false;
      if (diagnosticArea !== 'all' && issue.area !== diagnosticArea) return false;
      if (targetNeedle && !`${issue.targetKey} ${issue.summary} ${issue.type}`.toLowerCase().includes(targetNeedle)) return false;
      return true;
    });
  }, [props.diagnostics, diagnosticSeverity, diagnosticArea, diagnosticTarget]);

  function goToTarget(targetKey: string, area: ControlPlaneIssue['area']) {
    if (area === 'module_control') {
      setSelectedModuleKey(targetKey);
      setActiveTab('modules');
      return;
    }
    setSelectedFlagKey(targetKey);
    setActiveTab('flags');
  }

  function goToAuditTarget(item: AuditEvent) {
    const moduleKey = String(item.metadata?.moduleKey ?? '');
    const flagKey = String(item.metadata?.flagKey ?? '');
    if (moduleKey) {
      setSelectedModuleKey(moduleKey);
      setActiveTab('modules');
      return;
    }
    if (flagKey) {
      setSelectedFlagKey(flagKey);
      setActiveTab('flags');
    }
  }

  async function onMutationComplete(okText: string) {
    setMessage({ kind: 'success', text: `${okText} Console data refreshed from the server.` });
    router.refresh();
  }

  async function createAssignment(formData: FormData) {
    const flagKey = String(formData.get('flagKey') ?? '');
    const definition = props.catalog.find((item) => item.flagKey === flagKey);
    const payload = { scopeType: String(formData.get('scopeType') ?? 'tenant'), scopeId: String(formData.get('scopeId') ?? ''), value: formData.get('value') === 'true', reason: String(formData.get('reason') ?? ''), enabled: true, metadata: {} };
    const risk = highRiskMessage({ kind: 'assignment', operation: 'create', flagKey, scopeType: payload.scopeType, isKillSwitch: definition?.isKillSwitch });
    if (risk && !window.confirm(risk)) return;
    const result = await handleJsonResponse(await fetch(`/api/admin/feature-flags/${encodeURIComponent(flagKey)}/assignments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }));
    if (!result.ok) return setMessage({ kind: 'error', text: result.status === 409 ? `Concurrency conflict while saving ${flagKey}. Reloaded state is now available.` : result.message });
    await onMutationComplete(`Saved assignment for ${flagKey}.`);
  }

  async function updateAssignment(formData: FormData) {
    if (!editingAssignment) return;
    const payload = {
      value: formData.get('value') === 'true',
      reason: String(formData.get('reason') ?? '').trim(),
      enabled: formData.get('enabled') === 'true',
      expectedVersion: Number(formData.get('expectedVersion') ?? editingAssignment.version),
    };
    const definition = props.catalog.find((item) => item.flagKey === editingAssignment.flagKey);
    const risk = highRiskMessage({ kind: 'assignment', operation: 'update', flagKey: editingAssignment.flagKey, scopeType: editingAssignment.scopeType, isKillSwitch: definition?.isKillSwitch });
    if (risk && !window.confirm(risk)) return;
    const result = await handleJsonResponse(await fetch(`/api/admin/feature-flags/assignments/${encodeURIComponent(editingAssignment.id)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }));
    if (!result.ok) return setMessage({ kind: 'error', text: result.status === 409 ? `Version conflict while updating ${editingAssignment.flagKey}. Latest server state has been refreshed.` : result.message });
    setEditingAssignment(null);
    await onMutationComplete(`Updated assignment for ${editingAssignment.flagKey}.`);
  }

  async function createRolloutRule(formData: FormData) {
    const flagKey = String(formData.get('flagKey') ?? '');
    const payload = { scopeType: String(formData.get('scopeType') ?? 'tenant'), scopeId: String(formData.get('scopeId') ?? ''), percentage: Number(formData.get('percentage') ?? 0), bucketBy: String(formData.get('bucketBy') ?? 'tenant'), salt: String(formData.get('salt') ?? ''), reason: String(formData.get('reason') ?? ''), enabled: true, metadata: {} };
    const risk = highRiskMessage({ kind: 'rollout', operation: 'create', flagKey, percentage: payload.percentage });
    if (risk && !window.confirm(risk)) return;
    const result = await handleJsonResponse(await fetch(`/api/admin/feature-flags/${encodeURIComponent(flagKey)}/rollout-rules`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }));
    if (!result.ok) return setMessage({ kind: 'error', text: result.status === 409 ? `Concurrency conflict while saving rollout for ${flagKey}.` : result.message });
    await onMutationComplete(`Saved rollout rule for ${flagKey}.`);
  }

  async function updateRolloutRule(formData: FormData) {
    if (!editingRollout) return;
    const payload = {
      percentage: Number(formData.get('percentage') ?? editingRollout.percentage),
      bucketBy: String(formData.get('bucketBy') ?? editingRollout.bucketBy),
      salt: String(formData.get('salt') ?? ''),
      reason: String(formData.get('reason') ?? '').trim(),
      enabled: formData.get('enabled') === 'true',
      expectedVersion: Number(formData.get('expectedVersion') ?? editingRollout.version),
    };
    const risk = highRiskMessage({ kind: 'rollout', operation: 'update', flagKey: editingRollout.flagKey, percentage: payload.percentage });
    if (risk && !window.confirm(risk)) return;
    const result = await handleJsonResponse(await fetch(`/api/admin/feature-flags/rollout-rules/${encodeURIComponent(editingRollout.id)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }));
    if (!result.ok) return setMessage({ kind: 'error', text: result.status === 409 ? `Version conflict while updating rollout for ${editingRollout.flagKey}.` : result.message });
    setEditingRollout(null);
    await onMutationComplete(`Updated rollout rule for ${editingRollout.flagKey}.`);
  }

  async function createModuleRule(formData: FormData) {
    const payload = Object.fromEntries(formData.entries());
    const request = { moduleKey: String(payload.moduleKey), scopeType: String(payload.scopeType), scopeId: String(payload.scopeId), enabled: payload.enabled === 'true', visible: payload.visible === 'true', internalOnly: payload.internalOnly === 'true', betaOnly: payload.betaOnly === 'true', reason: String(payload.reason ?? ''), metadata: {} };
    const risk = highRiskMessage({ kind: 'module', operation: 'create', moduleKey: request.moduleKey, enabled: request.enabled, visible: request.visible });
    if (risk && !window.confirm(risk)) return;
    const result = await handleJsonResponse(await fetch('/api/admin/module-controls', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request) }));
    if (!result.ok) return setMessage({ kind: 'error', text: result.status === 409 ? `Concurrency conflict while saving ${request.moduleKey}.` : result.message });
    await onMutationComplete(`Saved module rule for ${request.moduleKey}.`);
  }

  async function updateModuleRule(formData: FormData) {
    if (!editingModuleRule) return;
    const payload = {
      enabled: formData.get('enabled') === 'true',
      visible: formData.get('visible') === 'true',
      internalOnly: formData.get('internalOnly') === 'true',
      betaOnly: formData.get('betaOnly') === 'true',
      reason: String(formData.get('reason') ?? '').trim(),
      expectedVersion: Number(formData.get('expectedVersion') ?? editingModuleRule.version),
    };
    const risk = highRiskMessage({ kind: 'module', operation: 'update', moduleKey: editingModuleRule.moduleKey, enabled: payload.enabled, visible: payload.visible });
    if (risk && !window.confirm(risk)) return;
    const result = await handleJsonResponse(await fetch(`/api/admin/module-controls/rules/${encodeURIComponent(editingModuleRule.id)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }));
    if (!result.ok) return setMessage({ kind: 'error', text: result.status === 409 ? `Version conflict while updating ${editingModuleRule.moduleKey}.` : result.message });
    setEditingModuleRule(null);
    await onMutationComplete(`Updated module rule for ${editingModuleRule.moduleKey}.`);
  }

  async function disableAssignment(id: string, version: number) {
    if (!window.confirm('Disable this assignment? This is the safest rollback path for a stale override.')) return;
    const result = await handleJsonResponse(await fetch(`/api/admin/feature-flags/assignments/${encodeURIComponent(id)}?expectedVersion=${version}`, { method: 'DELETE' }));
    if (!result.ok) return setMessage({ kind: 'error', text: result.message });
    await onMutationComplete('Assignment disabled.');
  }

  async function disableRolloutRule(id: string, version: number) {
    if (!window.confirm('Disable this rollout rule? This immediately removes it from matching cohorts.')) return;
    const result = await handleJsonResponse(await fetch(`/api/admin/feature-flags/rollout-rules/${encodeURIComponent(id)}?expectedVersion=${version}`, { method: 'DELETE' }));
    if (!result.ok) return setMessage({ kind: 'error', text: result.message });
    await onMutationComplete('Rollout rule disabled.');
  }

  async function disableModuleRule(id: string, version: number) {
    if (!window.confirm('Disable this module rule? This can change navigation visibility and access.')) return;
    const result = await handleJsonResponse(await fetch(`/api/admin/module-controls/rules/${encodeURIComponent(id)}?expectedVersion=${version}`, { method: 'DELETE' }));
    if (!result.ok) return setMessage({ kind: 'error', text: result.message });
    await onMutationComplete('Module rule disabled.');
  }

  async function runPreview(formData: FormData) {
    setPreviewBusy(true);
    const payload = buildPreviewPayload(formData);
    const result = await handleJsonResponse<PreviewEvaluationResult>(await fetch('/api/admin/feature-preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }));
    setPreviewBusy(false);
    if (result.ok) {
      setPreview(result.payload);
      setMessage({ kind: 'success', text: `Preview refreshed${payload.proposedRolloutRules?.length ? ' (includes simulation-only rollout candidate)' : ''}.` });
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
          <p className="max-w-3xl text-sm text-muted-foreground">Operate feature flags, module controls, rollouts, kill switches, diagnostics, preview, and audit history from a backend-owned control plane.</p>
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

      {activeTab === 'overview' ? <section className="grid gap-6 xl:grid-cols-[1.5fr,1fr]"><div className="space-y-6"><Panel title="Active kill switches" description="Emergency controls are elevated because they represent live service-impacting state.">{props.flagSummaries.filter((item) => item.activeKillSwitch).length === 0 ? <EmptyState text="No kill switches are currently active." /> : props.flagSummaries.filter((item) => item.activeKillSwitch).map((item) => <RowBadge key={item.flagKey} title={item.name} subtitle={`${item.flagKey} · ${item.winningScope}`} badges={[{ label: 'active', tone: 'critical' }, { label: item.releaseStage.replaceAll('_', ' '), tone: 'neutral' }]} />)}</Panel><Panel title="Diagnostics queue" description="Conflicts, stale rules, dependency blockers, and dangerous states."><div className="space-y-3">{props.diagnostics.slice(0, 8).map((issue) => (<div key={issue.id} className={`rounded border p-3 ${toneForSeverity(issue.severity)}`}><div className="flex items-center justify-between gap-3"><div className="font-medium">{issue.summary}</div><button className="rounded border bg-white px-2 py-1 text-xs" onClick={() => goToTarget(issue.targetKey, issue.area)}>Inspect {issue.targetKey}</button></div><div className="mt-1 text-xs">{issue.detail}</div></div>))}{props.diagnostics.length === 0 ? <EmptyState text="No diagnostics are currently raised." /> : null}</div></Panel></div><div className="space-y-6"><Panel title="Recent changes" description="Latest control-plane activity."><div className="space-y-3 text-sm">{props.recentChanges.slice(0, 8).map((item) => <AuditRow key={item.id} item={item} onTarget={goToAuditTarget} />)}{props.recentChanges.length === 0 ? <EmptyState text={props.auditVisible ? 'No recent control-plane changes.' : 'Audit history is not visible in this session.'} /> : null}</div></Panel><Panel title="Operator guidance" description="Recommended flow during rollout and rollback work."><ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground"><li>Inspect diagnostics and select the target entity directly from issue rows.</li><li>Use preview for the target tenant/workspace/user cohort.</li><li>Record a reason for high-risk changes, especially kill switches and global overrides.</li><li>After save, verify refreshed detail state and recent changes.</li></ol></Panel></div></section> : null}

      {activeTab === 'flags' ? <section className="grid gap-6 xl:grid-cols-[1.1fr,1.4fr,1fr]">{/* unchanged large UI with edit forms */}
        <Panel title="Feature catalog" description="Filter by identity, stage, and issue state to find controls quickly."><div className="space-y-3"><input className="w-full rounded border px-3 py-2 text-sm" placeholder="Search key, name, category, tag" value={flagSearch} onChange={(event) => setFlagSearch(event.target.value)} /><div className="grid gap-2 md:grid-cols-2"><select className="rounded border px-3 py-2 text-sm" value={flagStage} onChange={(event) => setFlagStage(event.target.value)}><option value="">All release stages</option>{releaseStages.map((stage) => <option key={stage} value={stage}>{stage.replaceAll('_', ' ')}</option>)}</select><select className="rounded border px-3 py-2 text-sm" value={flagStatus} onChange={(event) => setFlagStatus(event.target.value as typeof flagStatus)}><option value="all">All states</option><option value="enabled">Enabled now</option><option value="disabled">Disabled now</option><option value="issues">Has diagnostics</option></select></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={killSwitchOnly} onChange={(event) => setKillSwitchOnly(event.target.checked)} /> Kill switches only</label><div className="space-y-2">{flagRows.map((item) => (<button key={item.flagKey} className={`w-full rounded border p-3 text-left ${selectedFlag?.flagKey === item.flagKey ? 'border-slate-900 bg-slate-50' : 'bg-white'}`} onClick={() => setSelectedFlagKey(item.flagKey)}><div className="flex items-center justify-between gap-3"><div className="font-medium">{item.name}</div><div className={`rounded-full px-2 py-1 text-xs ${item.effectiveEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>{item.effectiveEnabled ? 'enabled' : 'disabled'}</div></div><div className="mt-1 text-xs text-muted-foreground">{item.flagKey} · {item.category}</div><div className="mt-2 flex flex-wrap gap-2">{item.isKillSwitch ? <Badge label="kill switch" tone="critical" /> : null}<Badge label={item.releaseStage.replaceAll('_', ' ')} tone="neutral" /><Badge label={item.hasOverrides ? 'overrides' : 'default-only'} tone="neutral" />{item.diagnostics.length > 0 ? <Badge label={`${item.diagnostics.length} issues`} tone="warning" /> : null}</div></button>))}{flagRows.length === 0 ? <EmptyState text="No flags matched the current filters." /> : null}</div></div></Panel>
        <Panel title={selectedFlag ? `${selectedFlag.name} detail` : 'Feature detail'} description="Effective state, winning source, blockers, runtime rules, preview entry point, and embedded audit.">{selectedFlag && selectedFlagEvaluation ? <div className="space-y-4 text-sm"><div className="flex flex-wrap gap-2"><Badge label={selectedFlag.flagKey} tone="neutral" /><span className={`rounded-full px-2 py-1 text-xs ${toneForStage(selectedFlag.releaseStage)}`}>{selectedFlag.releaseStage.replaceAll('_', ' ')}</span>{selectedFlag.isKillSwitch ? <Badge label="kill switch" tone="critical" /> : null}{selectedFlag.isDeprecated ? <Badge label="deprecated" tone="warning" /> : null}<button className="rounded border px-2 py-1 text-xs" onClick={() => { setActiveTab('preview'); }}>Preview this flag</button></div><p className="text-muted-foreground">{selectedFlag.description}</p><div className="grid gap-3 md:grid-cols-2"><DetailStat label="Effective state" value={selectedFlag.effectiveEnabled ? 'Enabled' : 'Disabled'} /><DetailStat label="Winning source" value={selectedFlag.winningSource} /><DetailStat label="Winning scope" value={selectedFlag.winningScope} /><DetailStat label="Current value" value={String(selectedFlag.effectiveValue)} /><DetailStat label="Overrides" value={`${selectedFlag.activeAssignmentCount} assignments / ${selectedFlag.activeRolloutCount} rollouts`} /><DetailStat label="Last changed" value={`${formatDate(selectedFlag.lastUpdatedAt)} by ${selectedFlag.lastUpdatedBy ?? '—'}`} /></div><SectionTitle title="Explainability" /><ReasonList reasons={selectedFlagEvaluation.reasons} empty="No extra reasoning was needed for the current decision." />{selectedFlagEvaluation.bucketResult ? <BucketDetailsCard bucketResult={selectedFlagEvaluation.bucketResult} /> : null}<SectionTitle title="Diagnostics" /><div className="space-y-2">{selectedFlagIssues.length > 0 ? selectedFlagIssues.map((issue) => <div key={issue.id} className={`rounded border p-3 ${toneForSeverity(issue.severity)}`}><div className="font-medium">{issue.summary}</div><div className="text-xs">{issue.detail}</div></div>) : <EmptyState text="No diagnostics are raised for this feature." />}</div><SectionTitle title="Assignments" /><RuleList items={selectedFlagAssignments} empty="No assignments for this flag." onDisable={props.canManage ? disableAssignment : undefined} onEdit={props.canManage ? setEditingAssignment : undefined} editingId={editingAssignment?.id} render={(item) => `${item.scopeType}:${item.scopeId} · value=${String(item.value)} · ${item.enabled ? 'active' : 'disabled'} · v${item.version}`} />{editingAssignment ? <form action={updateAssignment} className="space-y-2 rounded border bg-slate-50 p-3"><div className="font-medium">Edit assignment</div><input type="hidden" name="expectedVersion" value={editingAssignment.version} /><select name="value" defaultValue={String(editingAssignment.value)} className="w-full rounded border px-2 py-1 text-sm"><option value="true">true</option><option value="false">false</option></select><select name="enabled" defaultValue={String(editingAssignment.enabled)} className="w-full rounded border px-2 py-1 text-sm"><option value="true">active</option><option value="false">disabled</option></select><textarea name="reason" defaultValue={editingAssignment.reason} className="w-full rounded border px-2 py-1 text-sm" /><div className="flex gap-2"><button className="rounded bg-slate-900 px-3 py-1 text-xs text-white">Save edit</button><button type="button" className="rounded border px-3 py-1 text-xs" onClick={() => setEditingAssignment(null)}>Cancel</button></div></form> : null}<SectionTitle title="Rollout rules" /><RuleList items={selectedFlagRollouts} empty="No rollout rules for this flag." onDisable={props.canManage ? disableRolloutRule : undefined} onEdit={props.canManage ? setEditingRollout : undefined} editingId={editingRollout?.id} render={(item) => `${item.scopeType}:${item.scopeId} · ${item.percentage}% by ${item.bucketBy} · ${item.enabled ? 'active' : 'disabled'} · v${item.version}`} />{editingRollout ? <form action={updateRolloutRule} className="space-y-2 rounded border bg-slate-50 p-3"><div className="font-medium">Edit rollout rule</div><input type="hidden" name="expectedVersion" value={editingRollout.version} /><input name="percentage" type="number" min={0} max={100} defaultValue={editingRollout.percentage} className="w-full rounded border px-2 py-1 text-sm" /><select name="bucketBy" defaultValue={editingRollout.bucketBy} className="w-full rounded border px-2 py-1 text-sm">{rolloutBucketOptions.map((bucketBy) => <option key={bucketBy} value={bucketBy}>{bucketBy}</option>)}</select><input name="salt" defaultValue={editingRollout.salt ?? ''} className="w-full rounded border px-2 py-1 text-sm" /><select name="enabled" defaultValue={String(editingRollout.enabled)} className="w-full rounded border px-2 py-1 text-sm"><option value="true">active</option><option value="false">disabled</option></select><textarea name="reason" defaultValue={editingRollout.reason} className="w-full rounded border px-2 py-1 text-sm" /><div className="flex gap-2"><button className="rounded bg-slate-900 px-3 py-1 text-xs text-white">Save edit</button><button type="button" className="rounded border px-3 py-1 text-xs" onClick={() => setEditingRollout(null)}>Cancel</button></div></form> : null}<SectionTitle title="Audit history" /><div className="space-y-2">{selectedFlagAudit.length > 0 ? selectedFlagAudit.slice(0, 6).map((item) => <AuditRow key={item.id} item={item} onTarget={goToAuditTarget} />) : <EmptyState text={props.auditVisible ? 'No related audit events.' : 'Audit history is not visible in this session.'} />}</div></div> : <EmptyState text="Select a feature flag to inspect its effective state." />}</Panel>
        <div className="space-y-6"><Panel title="Create feature assignment" description="Use explicit overrides for surgical access changes or emergency controls.">{props.canManage ? <form action={createAssignment} className="space-y-3"><input name="flagKey" defaultValue={selectedFlag?.flagKey ?? ''} className="w-full rounded border px-3 py-2 text-sm" /><div className="grid grid-cols-2 gap-2"><input name="scopeType" defaultValue="tenant" className="rounded border px-3 py-2 text-sm" /><input name="scopeId" className="rounded border px-3 py-2 text-sm" /></div><select name="value" className="w-full rounded border px-3 py-2 text-sm"><option value="true">true</option><option value="false">false</option></select><textarea name="reason" className="w-full rounded border px-3 py-2 text-sm" /><button className="rounded bg-slate-900 px-3 py-2 text-sm text-white">Save assignment</button></form> : <EmptyState text="You do not have permission to manage assignments." />}</Panel><Panel title="Create percentage rollout" description="Preview big jumps before saving.">{props.canManage ? <form action={createRolloutRule} className="space-y-3"><input name="flagKey" defaultValue={selectedFlag?.flagKey ?? ''} className="w-full rounded border px-3 py-2 text-sm" /><div className="grid grid-cols-2 gap-2"><input name="scopeType" defaultValue="tenant" className="rounded border px-3 py-2 text-sm" /><input name="scopeId" className="rounded border px-3 py-2 text-sm" /></div><div className="grid grid-cols-2 gap-2"><input name="percentage" type="number" min={0} max={100} defaultValue={25} className="rounded border px-3 py-2 text-sm" /><select name="bucketBy" className="rounded border px-3 py-2 text-sm">{rolloutBucketOptions.map((bucketBy) => <option key={bucketBy} value={bucketBy}>{bucketBy}</option>)}</select></div><input name="salt" className="w-full rounded border px-3 py-2 text-sm" /><textarea name="reason" className="w-full rounded border px-3 py-2 text-sm" /><button className="rounded bg-slate-900 px-3 py-2 text-sm text-white">Save rollout rule</button></form> : <EmptyState text="You do not have permission to manage rollouts." />}</Panel></div>
      </section> : null}

      {activeTab === 'modules' ? <section className="grid gap-6 xl:grid-cols-[1fr,1.4fr,1fr]"><Panel title="Module controls catalog" description="Search for modules with overrides, hidden state, or diagnostics."><div className="space-y-3"><input className="w-full rounded border px-3 py-2 text-sm" placeholder="Search module key or name" value={moduleSearch} onChange={(event) => setModuleSearch(event.target.value)} /><select className="w-full rounded border px-3 py-2 text-sm" value={moduleStatus} onChange={(event) => setModuleStatus(event.target.value as typeof moduleStatus)}><option value="all">All states</option><option value="enabled">Enabled now</option><option value="hidden">Hidden now</option><option value="issues">Has diagnostics</option></select><div className="space-y-2">{moduleRows.map((item) => <button key={item.moduleKey} className={`w-full rounded border p-3 text-left ${selectedModule?.moduleKey === item.moduleKey ? 'border-slate-900 bg-slate-50' : 'bg-white'}`} onClick={() => setSelectedModuleKey(item.moduleKey)}><div className="flex items-center justify-between gap-3"><div className="font-medium">{item.moduleName}</div><Badge label={item.effectiveEnabled ? 'enabled' : 'disabled'} tone={item.effectiveEnabled ? 'success' : 'neutral'} /></div><div className="mt-1 text-xs text-muted-foreground">{item.moduleKey} · {item.category}</div><div className="mt-2 flex flex-wrap gap-2">{item.internalOnly ? <Badge label="internal" tone="warning" /> : null}{item.betaOnly ? <Badge label="beta-only" tone="warning" /> : null}{item.diagnostics.length > 0 ? <Badge label={`${item.diagnostics.length} issues`} tone="warning" /> : null}</div></button>)}{moduleRows.length === 0 ? <EmptyState text="No modules matched the current filters." /> : null}</div></div></Panel><Panel title={selectedModule ? `${selectedModule.moduleName} detail` : 'Module detail'} description="Winning module rule, visibility, blockers, rollback rules, and audit history.">{selectedModule ? <div className="space-y-4 text-sm"><div className="flex flex-wrap gap-2"><Badge label={selectedModule.moduleKey} tone="neutral" />{selectedModule.internalOnly ? <Badge label="internal only" tone="warning" /> : null}{selectedModule.betaOnly ? <Badge label="beta only" tone="warning" /> : null}<button className="rounded border px-2 py-1 text-xs" onClick={() => setActiveTab('preview')}>Preview in module context</button></div><p className="text-muted-foreground">{selectedModule.description}</p><div className="grid gap-3 md:grid-cols-2"><DetailStat label="Enabled" value={selectedModule.effectiveEnabled ? 'Yes' : 'No'} /><DetailStat label="Visible" value={selectedModule.effectiveVisible ? 'Yes' : 'No'} /><DetailStat label="Winning source" value={selectedModule.winningSource} /><DetailStat label="Winning rule" value={selectedModule.winningRuleId ?? 'Definition'} /><DetailStat label="Default landing" value={selectedModule.defaultLanding ?? selectedModule.route} /><DetailStat label="Last changed" value={`${formatDate(selectedModule.lastUpdatedAt)} by ${selectedModule.lastUpdatedBy ?? '—'}`} /></div><SectionTitle title="Runtime blockers" /><div className="flex flex-wrap gap-2">{selectedModule.reasonCodes.length > 0 ? selectedModule.reasonCodes.map((code) => <Badge key={code} label={code} tone="warning" />) : <Badge label="no blockers" tone="success" />}</div><SectionTitle title="Diagnostics" /><div className="space-y-2">{selectedModuleIssues.length > 0 ? selectedModuleIssues.map((issue) => <div key={issue.id} className={`rounded border p-3 ${toneForSeverity(issue.severity)}`}><div className="font-medium">{issue.summary}</div><div className="text-xs">{issue.detail}</div></div>) : <EmptyState text="No diagnostics are raised for this module." />}</div><SectionTitle title="Module rules" /><RuleList items={selectedModuleRules} empty="No module rules for this module." onDisable={props.canManageModules ? disableModuleRule : undefined} onEdit={props.canManageModules ? setEditingModuleRule : undefined} editingId={editingModuleRule?.id} render={(item) => `${item.scopeType}:${item.scopeId} · enabled=${String(item.enabled)} · visible=${String(item.visible)} · v${item.version}`} />{editingModuleRule ? <form action={updateModuleRule} className="space-y-2 rounded border bg-slate-50 p-3"><div className="font-medium">Edit module rule</div><input type="hidden" name="expectedVersion" value={editingModuleRule.version} /><div className="grid grid-cols-2 gap-2"><select name="enabled" defaultValue={String(editingModuleRule.enabled)} className="rounded border px-2 py-1 text-sm"><option value="true">enabled</option><option value="false">disabled</option></select><select name="visible" defaultValue={String(editingModuleRule.visible)} className="rounded border px-2 py-1 text-sm"><option value="true">visible</option><option value="false">hidden</option></select></div><div className="grid grid-cols-2 gap-2"><select name="internalOnly" defaultValue={String(editingModuleRule.internalOnly)} className="rounded border px-2 py-1 text-sm"><option value="false">external ok</option><option value="true">internal only</option></select><select name="betaOnly" defaultValue={String(editingModuleRule.betaOnly)} className="rounded border px-2 py-1 text-sm"><option value="false">not beta only</option><option value="true">beta only</option></select></div><textarea name="reason" defaultValue={editingModuleRule.reason} className="w-full rounded border px-2 py-1 text-sm" /><div className="flex gap-2"><button className="rounded bg-slate-900 px-3 py-1 text-xs text-white">Save edit</button><button type="button" className="rounded border px-3 py-1 text-xs" onClick={() => setEditingModuleRule(null)}>Cancel</button></div></form> : null}<SectionTitle title="Audit history" /><div className="space-y-2">{selectedModuleAudit.length > 0 ? selectedModuleAudit.slice(0, 6).map((item) => <AuditRow key={item.id} item={item} onTarget={goToAuditTarget} />) : <EmptyState text={props.auditVisible ? 'No related audit events.' : 'Audit history is not visible in this session.'} />}</div></div> : <EmptyState text="Select a module to inspect its effective state." />}</Panel><Panel title="Create module rule" description="High-risk module availability changes require explicit confirmation.">{props.canManageModules ? <form action={createModuleRule} className="space-y-3"><input name="moduleKey" defaultValue={selectedModule?.moduleKey ?? ''} className="w-full rounded border px-3 py-2 text-sm" /><div className="grid grid-cols-2 gap-2"><input name="scopeType" defaultValue="tenant" className="rounded border px-3 py-2 text-sm" /><input name="scopeId" className="rounded border px-3 py-2 text-sm" /></div><div className="grid grid-cols-2 gap-2"><select name="enabled" className="rounded border px-3 py-2 text-sm"><option value="true">enabled</option><option value="false">disabled</option></select><select name="visible" className="rounded border px-3 py-2 text-sm"><option value="true">visible</option><option value="false">hidden</option></select></div><div className="grid grid-cols-2 gap-2"><select name="internalOnly" className="rounded border px-3 py-2 text-sm"><option value="false">external ok</option><option value="true">internal only</option></select><select name="betaOnly" className="rounded border px-3 py-2 text-sm"><option value="false">not beta only</option><option value="true">beta only</option></select></div><textarea name="reason" className="w-full rounded border px-3 py-2 text-sm" /><button className="rounded bg-slate-900 px-3 py-2 text-sm text-white">Save module rule</button></form> : <EmptyState text="You do not have permission to manage module rules." />}</Panel></section> : null}

      {activeTab === 'preview' ? (
        <section className="grid gap-6 xl:grid-cols-[1fr,1.2fr]">
          <Panel title="Preview / simulation" description="Run backend-owned evaluations with reasoning, bucket details, and optional unsaved rollout simulation.">
            {props.canPreview ? <form action={runPreview} className="space-y-3"><div className="grid grid-cols-2 gap-2"><input name="tenantId" className="rounded border px-3 py-2 text-sm" /><input name="workspaceId" className="rounded border px-3 py-2 text-sm" /></div><div className="grid grid-cols-2 gap-2"><input name="userId" className="rounded border px-3 py-2 text-sm" /><input name="roleCodes" className="rounded border px-3 py-2 text-sm" /></div><div className="grid grid-cols-2 gap-2"><input name="currentModule" defaultValue={selectedModule?.moduleKey ?? ''} className="rounded border px-3 py-2 text-sm" /><input name="currentRoute" className="rounded border px-3 py-2 text-sm" /></div><input name="featureKeys" defaultValue={selectedFlag?.flagKey ?? ''} className="w-full rounded border px-3 py-2 text-sm" /><div className="rounded border p-3"><div className="mb-2 text-sm font-medium">Optional unsaved rollout comparison</div><div className="grid grid-cols-2 gap-2"><input name="simulateFlagKey" defaultValue={selectedFlag?.flagKey ?? ''} className="rounded border px-3 py-2 text-sm" /><input name="simulateScopeId" className="rounded border px-3 py-2 text-sm" /></div><div className="mt-2 grid grid-cols-2 gap-2"><input name="simulateScopeType" defaultValue="tenant" className="rounded border px-3 py-2 text-sm" /><input name="simulatePercentage" type="number" min={0} max={100} defaultValue={25} className="rounded border px-3 py-2 text-sm" /></div><div className="mt-2 grid grid-cols-2 gap-2"><select name="simulateBucketBy" className="rounded border px-3 py-2 text-sm">{rolloutBucketOptions.map((bucketBy) => <option key={bucketBy} value={bucketBy}>{bucketBy}</option>)}</select><input name="simulateSalt" className="rounded border px-3 py-2 text-sm" /></div><textarea name="simulateReason" className="mt-2 w-full rounded border px-3 py-2 text-sm" /></div><button className="rounded bg-slate-900 px-3 py-2 text-sm text-white">{previewBusy ? 'Running…' : 'Run preview'}</button></form> : <EmptyState text="You do not have permission to run rollout preview." />}
          </Panel>
          <Panel title="Preview results" description="Compare current state against preview results.">{preview ? <div className="space-y-4 text-sm"><div className="rounded border bg-slate-50 p-3 text-xs">Context: {JSON.stringify(preview.contextSummary)}{preview.contextSummary.proposedRolloutRuleCount ? ' · includes simulation-only rules' : ''}</div>{preview.evaluatedFlags.map((item) => { const current = props.evaluations.find((entry) => entry.flagKey === item.flagKey); return <div key={item.flagKey} className="rounded border p-3"><div className="flex items-center justify-between gap-3"><div className="font-medium">{item.flagKey}</div><div className="flex gap-2"><Badge label={`current ${current?.enabled ? 'enabled' : 'disabled'}`} tone="neutral" /><Badge label={`preview ${item.enabled ? 'enabled' : 'disabled'}`} tone={item.enabled ? 'success' : 'warning'} /></div></div><div className="mt-1 text-xs text-muted-foreground">source={item.source} · scope={item.scopeType}{item.scopeId ? `:${item.scopeId}` : ''}</div><div className="mt-2 flex flex-wrap gap-2"><Badge label={item.releaseStage.replaceAll('_', ' ')} tone="neutral" />{item.reasonCodes.length > 0 ? item.reasonCodes.map((code) => <Badge key={code} label={code} tone="warning" />) : <Badge label="no blockers" tone="success" />}</div><div className="mt-3"><ReasonList reasons={item.reasons} empty="No structured reasons were returned for this preview." compact /></div>{item.bucketResult ? <div className="mt-3"><BucketDetailsCard bucketResult={item.bucketResult} /></div> : null}</div>; })}<div className="rounded border p-3"><div className="font-medium">Previewed modules</div><div className="mt-3 space-y-2">{previewModulesWithIssues.length > 0 ? previewModulesWithIssues.map((item) => <div key={item.moduleKey} className="rounded border bg-slate-50 p-3"><div className="flex items-center justify-between gap-3"><div className="font-medium">{item.moduleKey}</div><div className="flex gap-2"><Badge label={item.enabled ? 'enabled' : 'disabled'} tone={item.enabled ? 'success' : 'warning'} /><Badge label={item.visible ? 'visible' : 'hidden'} tone={item.visible ? 'neutral' : 'warning'} /></div></div><div className="mt-2 flex flex-wrap gap-2">{item.reasonCodes.length > 0 ? item.reasonCodes.map((code) => <Badge key={code} label={code} tone="warning" />) : <Badge label="no blockers" tone="success" />}</div></div>) : <EmptyState text="No previewed modules were blocked or hidden for this context." />}</div></div></div> : <EmptyState text="Run a preview to inspect reasoning and compare current versus proposed behavior." />}</Panel>
        </section>
      ) : null}

      {activeTab === 'diagnostics' ? (
        <Panel title="Diagnostics and stale configuration" description="Surface conflicts, expired rules, dependency blockers, and dangerous states before users notice them.">
          <div className="grid gap-3 md:grid-cols-3"><select className="rounded border px-2 py-2 text-sm" value={diagnosticSeverity} onChange={(event) => setDiagnosticSeverity(event.target.value as typeof diagnosticSeverity)}><option value="all">All severities</option><option value="critical">Critical</option><option value="warning">Warning</option><option value="info">Info</option></select><select className="rounded border px-2 py-2 text-sm" value={diagnosticArea} onChange={(event) => setDiagnosticArea(event.target.value as typeof diagnosticArea)}><option value="all">All areas</option><option value="feature_flag">Feature flags</option><option value="module_control">Modules</option></select><input className="rounded border px-2 py-2 text-sm" placeholder="Filter target or issue" value={diagnosticTarget} onChange={(event) => setDiagnosticTarget(event.target.value)} /></div>
          <div className="mt-4 space-y-3">{filteredDiagnostics.map((issue) => <div key={issue.id} className={`rounded border p-3 ${toneForSeverity(issue.severity)}`}><div className="flex items-center justify-between gap-3"><div><div className="font-medium">{issue.summary}</div><div className="text-xs">{issue.detail}</div></div><button className="rounded border bg-white px-2 py-1 text-xs" onClick={() => goToTarget(issue.targetKey, issue.area)}>Inspect {issue.targetKey}</button></div></div>)}{filteredDiagnostics.length === 0 ? <EmptyState text="No diagnostics are currently raised for these filters." /> : null}</div>
        </Panel>
      ) : null}

      {activeTab === 'recent' ? (
        <Panel title="Recent control-plane changes" description="Embedded audit visibility for assignment, rollout, kill switch, and module-control operations.">
          <div className="space-y-3">{props.recentChanges.map((item) => <AuditRow key={item.id} item={item} onTarget={goToAuditTarget} />)}{props.recentChanges.length === 0 ? <EmptyState text={props.auditVisible ? 'No recent changes found.' : 'Audit visibility is not available for this operator.'} /> : null}</div>
        </Panel>
      ) : null}
    </div>
  );
}
