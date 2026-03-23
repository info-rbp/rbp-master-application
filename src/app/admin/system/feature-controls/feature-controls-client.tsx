'use client';

import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import type { FeatureCatalogEntry, FeatureEvaluationResult, FeatureFlagAssignment, ModuleAccessControlResult, ModuleEnablementRule, PercentageRolloutRule, PreviewEvaluationResult } from '@/lib/feature-flags/types';

export default function FeatureControlsClient({ catalog, assignments, rolloutRules, moduleRules, evaluations, modules, canManage, canManageModules }: { catalog: FeatureCatalogEntry[]; assignments: FeatureFlagAssignment[]; rolloutRules: PercentageRolloutRule[]; moduleRules: ModuleEnablementRule[]; evaluations: FeatureEvaluationResult[]; modules: ModuleAccessControlResult[]; canManage: boolean; canManageModules: boolean }) {
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('');
  const [preview, setPreview] = useState<PreviewEvaluationResult | null>(null);
  const filteredCatalog = useMemo(() => catalog.filter((item) => `${item.flagKey} ${item.name} ${item.category}`.toLowerCase().includes(filter.toLowerCase())), [catalog, filter]);

  async function createAssignment(formData: FormData) {
    const flagKey = String(formData.get('flagKey') ?? '');
    const response = await fetch(`/api/admin/feature-flags/${encodeURIComponent(flagKey)}/assignments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scopeType: String(formData.get('scopeType') ?? 'tenant'), scopeId: String(formData.get('scopeId') ?? ''), value: formData.get('value') === 'true', reason: String(formData.get('reason') ?? ''), enabled: true, metadata: {} }) });
    setMessage(response.ok ? 'Feature assignment saved. Refresh to see updated evaluations.' : 'Failed to save feature assignment.');
  }

  async function createRolloutRule(formData: FormData) {
    const flagKey = String(formData.get('flagKey') ?? '');
    const payload = { scopeType: String(formData.get('scopeType') ?? 'tenant'), scopeId: String(formData.get('scopeId') ?? ''), percentage: Number(formData.get('percentage') ?? 0), bucketBy: String(formData.get('bucketBy') ?? 'tenant'), salt: String(formData.get('salt') ?? ''), reason: String(formData.get('reason') ?? ''), enabled: true, metadata: {} };
    const response = await fetch(`/api/admin/feature-flags/${encodeURIComponent(flagKey)}/rollout-rules`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    setMessage(response.ok ? 'Rollout rule saved. Refresh to see updated evaluations.' : 'Failed to save rollout rule.');
  }

  async function runPreview(formData: FormData) {
    const payload = { tenantId: String(formData.get('tenantId') || ''), workspaceId: String(formData.get('workspaceId') || '') || undefined, userId: String(formData.get('userId') || '') || undefined, roleCodes: String(formData.get('roleCodes') || '').split(',').map((item) => item.trim()).filter(Boolean), featureKeys: String(formData.get('featureKeys') || '').split(',').map((item) => item.trim()).filter(Boolean), includeReasoning: true, includeBucketDetails: true, proposedRolloutRules: formData.get('simulateFlagKey') ? [{ flagKey: String(formData.get('simulateFlagKey')), scopeType: String(formData.get('simulateScopeType') || 'tenant'), scopeId: String(formData.get('simulateScopeId') || formData.get('tenantId') || ''), percentage: Number(formData.get('simulatePercentage') || 0), bucketBy: String(formData.get('simulateBucketBy') || 'tenant'), salt: String(formData.get('simulateSalt') || ''), reason: String(formData.get('simulateReason') || 'preview'), enabled: true, metadata: {}, id: 'preview-rule', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: 'preview', updatedBy: 'preview', version: 1 }] : [] };
    const response = await fetch('/api/admin/feature-preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await response.json();
    setPreview(response.ok ? data.data ?? data : null);
    setMessage(response.ok ? 'Preview refreshed.' : 'Preview failed.');
  }

  async function createModuleRule(formData: FormData) {
    const payload = Object.fromEntries(formData.entries());
    const request = { moduleKey: String(payload.moduleKey), scopeType: String(payload.scopeType), scopeId: String(payload.scopeId), enabled: payload.enabled === 'true', visible: payload.visible === 'true', internalOnly: payload.internalOnly === 'true', betaOnly: payload.betaOnly === 'true', reason: String(payload.reason ?? ''), metadata: {} };
    const risk = highRiskMessage({ kind: 'module', moduleKey: request.moduleKey, enabled: request.enabled, visible: request.visible });
    if (risk && !window.confirm(risk)) return;
    const result = await handleJsonResponse(await fetch('/api/admin/module-controls', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request) }));
    setMessage(result.ok ? { kind: 'success', text: `Saved module rule for ${request.moduleKey}. Refresh to validate the winning state.` } : { kind: 'error', text: result.status === 409 ? `Concurrency conflict while saving ${request.moduleKey}.` : result.message });
  }

  async function disableAssignment(id: string) {
    if (!window.confirm('Disable this assignment? This is the safest rollback path for a stale override.')) return;
    const result = await handleJsonResponse(await fetch(`/api/admin/feature-flags/assignments/${encodeURIComponent(id)}`, { method: 'DELETE' }));
    setMessage(result.ok ? { kind: 'success', text: 'Assignment disabled. Refresh to confirm the new effective state.' } : { kind: 'error', text: result.message });
  }

  async function disableRolloutRule(id: string) {
    if (!window.confirm('Disable this rollout rule? This immediately removes it from matching cohorts.')) return;
    const result = await handleJsonResponse(await fetch(`/api/admin/feature-flags/rollout-rules/${encodeURIComponent(id)}`, { method: 'DELETE' }));
    setMessage(result.ok ? { kind: 'success', text: 'Rollout rule disabled. Refresh to verify the next winning rule.' } : { kind: 'error', text: result.message });
  }

  async function disableModuleRule(id: string) {
    if (!window.confirm('Disable this module rule? This can change navigation visibility and access.')) return;
    const result = await handleJsonResponse(await fetch(`/api/admin/module-controls/rules/${encodeURIComponent(id)}`, { method: 'DELETE' }));
    setMessage(result.ok ? { kind: 'success', text: 'Module rule disabled. Refresh to validate module availability.' } : { kind: 'error', text: result.message });
  }

  async function runPreview(formData: FormData) {
    setPreviewBusy(true);
    const payload = {
      tenantId: String(formData.get('tenantId') || ''),
      workspaceId: String(formData.get('workspaceId') || '') || undefined,
      userId: String(formData.get('userId') || '') || undefined,
      roleCodes: String(formData.get('roleCodes') || '').split(',').map((item) => item.trim()).filter(Boolean),
      currentModule: String(formData.get('currentModule') || '') || undefined,
      currentRoute: String(formData.get('currentRoute') || '') || undefined,
      featureKeys: String(formData.get('featureKeys') || '').split(',').map((item) => item.trim()).filter(Boolean),
      includeReasoning: true,
      includeBucketDetails: true,
      proposedRolloutRules: formData.get('simulateFlagKey') ? [{
        flagKey: String(formData.get('simulateFlagKey')),
        scopeType: String(formData.get('simulateScopeType') || 'tenant'),
        scopeId: String(formData.get('simulateScopeId') || formData.get('tenantId') || ''),
        percentage: Number(formData.get('simulatePercentage') || 0),
        bucketBy: String(formData.get('simulateBucketBy') || 'tenant'),
        salt: String(formData.get('simulateSalt') || ''),
        reason: String(formData.get('simulateReason') || 'preview'),
        enabled: true,
        metadata: {},
        id: 'preview-rule',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'preview',
        updatedBy: 'preview',
        version: 1,
      }] : [],
    };
    const result = await handleJsonResponse(await fetch('/api/admin/feature-preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }));
    setPreviewBusy(false);
    if (result.ok) {
      setPreview(result.payload);
      setMessage({ kind: 'success', text: 'Preview refreshed with reasoning and bucket diagnostics.' });
      return;
    }
    setMessage({ kind: 'error', text: result.message });
  }

  return <div className="space-y-6 p-4 pt-6 md:p-8"><div className="flex items-center justify-between gap-4"><div><h1 className="text-3xl font-bold tracking-tight">Feature controls</h1><p className="text-sm text-muted-foreground">Backend-owned feature flags, rollout assignments, deterministic bucketing previews, kill switches, and module controls.</p></div><input className="rounded border px-3 py-2 text-sm" placeholder="Filter flags" value={filter} onChange={(event) => setFilter(event.target.value)} /></div>{message ? <div className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm">{message}</div> : null}
  <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5"><SummaryCard title="Flags" value={catalog.length} /><SummaryCard title="Kill switches" value={catalog.filter((item) => item.isKillSwitch).length} /><SummaryCard title="Assignments" value={assignments.length} /><SummaryCard title="Rollout rules" value={rolloutRules.length} /><SummaryCard title="Enabled modules" value={modules.length} /></section>
  <section className="grid gap-6 xl:grid-cols-[2fr,1fr]"><div className="rounded border bg-white p-4"><h2 className="mb-3 text-xl font-semibold">Feature catalog</h2><div className="space-y-3">{filteredCatalog.map((item) => { const evaluation = evaluations.find((entry) => entry.flagKey === item.flagKey); return <div key={item.flagKey} className="rounded border p-3"><div className="flex items-center justify-between gap-3"><div><div className="font-medium">{item.name}</div><div className="text-xs text-muted-foreground">{item.flagKey} · {item.category} · {item.releaseStage} · {item.supportsPercentageRollout ? 'rollout-capable' : 'static'}</div></div><div className={`rounded px-2 py-1 text-xs ${evaluation?.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>{evaluation?.enabled ? 'Enabled' : 'Disabled'}</div></div><p className="mt-2 text-sm text-muted-foreground">{item.description}</p><div className="mt-2 text-xs text-muted-foreground">Reasons: {evaluation?.reasonCodes.join(', ') || 'none'}{evaluation?.bucketResult ? ` · bucket ${evaluation.bucketResult.bucket}/${evaluation.bucketResult.threshold}` : ''}</div></div>; })}</div></div>
  <div className="space-y-6"><div className="rounded border bg-white p-4"><h2 className="mb-3 text-lg font-semibold">Create feature assignment</h2>{canManage ? <form action={createAssignment} className="space-y-3"><input name="flagKey" placeholder="feature.search.enabled" className="w-full rounded border px-3 py-2 text-sm" /><div className="grid grid-cols-2 gap-2"><input name="scopeType" defaultValue="tenant" className="rounded border px-3 py-2 text-sm" /><input name="scopeId" placeholder="ten_acme_customer" className="rounded border px-3 py-2 text-sm" /></div><select name="value" className="w-full rounded border px-3 py-2 text-sm"><option value="true">true</option><option value="false">false</option></select><textarea name="reason" placeholder="Why is this changing?" className="w-full rounded border px-3 py-2 text-sm" /><button className="rounded bg-slate-900 px-3 py-2 text-sm text-white">Save assignment</button></form> : <p className="text-sm text-muted-foreground">You do not have permission to manage feature assignments.</p>}</div>
  <div className="rounded border bg-white p-4"><h2 className="mb-3 text-lg font-semibold">Create percentage rollout</h2>{canManage ? <form action={createRolloutRule} className="space-y-3"><input name="flagKey" placeholder="feature.search.enabled" className="w-full rounded border px-3 py-2 text-sm" /><div className="grid grid-cols-2 gap-2"><input name="scopeType" defaultValue="tenant" className="rounded border px-3 py-2 text-sm" /><input name="scopeId" placeholder="ten_acme_customer" className="rounded border px-3 py-2 text-sm" /></div><div className="grid grid-cols-2 gap-2"><input name="percentage" type="number" min={0} max={100} defaultValue={10} className="rounded border px-3 py-2 text-sm" /><select name="bucketBy" className="rounded border px-3 py-2 text-sm"><option value="tenant">tenant</option><option value="workspace">workspace</option><option value="user">user</option><option value="role">role</option><option value="composite">composite</option></select></div><input name="salt" placeholder="optional salt" className="w-full rounded border px-3 py-2 text-sm" /><textarea name="reason" placeholder="Why is this rollout changing?" className="w-full rounded border px-3 py-2 text-sm" /><button className="rounded bg-slate-900 px-3 py-2 text-sm text-white">Save rollout rule</button></form> : <p className="text-sm text-muted-foreground">You do not have permission to manage rollout rules.</p>}</div>
  <div className="rounded border bg-white p-4"><h2 className="mb-3 text-lg font-semibold">Create module rule</h2>{canManageModules ? <form action={createModuleRule} className="space-y-3"><input name="moduleKey" placeholder="analytics" className="w-full rounded border px-3 py-2 text-sm" /><div className="grid grid-cols-2 gap-2"><input name="scopeType" defaultValue="tenant" className="rounded border px-3 py-2 text-sm" /><input name="scopeId" placeholder="ten_acme_customer" className="rounded border px-3 py-2 text-sm" /></div><div className="grid grid-cols-2 gap-2"><select name="enabled" className="rounded border px-3 py-2 text-sm"><option value="true">enabled</option><option value="false">disabled</option></select><select name="visible" className="rounded border px-3 py-2 text-sm"><option value="true">visible</option><option value="false">hidden</option></select></div><div className="grid grid-cols-2 gap-2"><select name="internalOnly" className="rounded border px-3 py-2 text-sm"><option value="false">external ok</option><option value="true">internal only</option></select><select name="betaOnly" className="rounded border px-3 py-2 text-sm"><option value="false">not beta only</option><option value="true">beta only</option></select></div><textarea name="reason" placeholder="Why is this changing?" className="w-full rounded border px-3 py-2 text-sm" /><button className="rounded bg-slate-900 px-3 py-2 text-sm text-white">Save module rule</button></form> : <p className="text-sm text-muted-foreground">You do not have permission to manage module rules.</p>}</div></div></section>
  <section className="grid gap-6 xl:grid-cols-2"><div className="rounded border bg-white p-4"><h2 className="mb-3 text-xl font-semibold">Preview / simulation</h2><form action={runPreview} className="space-y-3"><div className="grid grid-cols-2 gap-2"><input name="tenantId" placeholder="tenant id" className="rounded border px-3 py-2 text-sm" /><input name="workspaceId" placeholder="workspace id" className="rounded border px-3 py-2 text-sm" /></div><div className="grid grid-cols-2 gap-2"><input name="userId" placeholder="user id" className="rounded border px-3 py-2 text-sm" /><input name="roleCodes" placeholder="role codes csv" className="rounded border px-3 py-2 text-sm" /></div><input name="featureKeys" placeholder="feature keys csv" className="w-full rounded border px-3 py-2 text-sm" /><div className="rounded border p-3"><div className="mb-2 text-sm font-medium">Optional simulated rollout rule</div><div className="grid grid-cols-2 gap-2"><input name="simulateFlagKey" placeholder="feature.search.enabled" className="rounded border px-3 py-2 text-sm" /><input name="simulateScopeId" placeholder="scope id" className="rounded border px-3 py-2 text-sm" /></div><div className="mt-2 grid grid-cols-2 gap-2"><input name="simulateScopeType" defaultValue="tenant" className="rounded border px-3 py-2 text-sm" /><input name="simulatePercentage" type="number" min={0} max={100} defaultValue={25} className="rounded border px-3 py-2 text-sm" /></div><div className="mt-2 grid grid-cols-2 gap-2"><select name="simulateBucketBy" className="rounded border px-3 py-2 text-sm"><option value="tenant">tenant</option><option value="workspace">workspace</option><option value="user">user</option><option value="role">role</option><option value="composite">composite</option></select><input name="simulateSalt" placeholder="salt" className="rounded border px-3 py-2 text-sm" /></div><textarea name="simulateReason" placeholder="preview reason" className="mt-2 w-full rounded border px-3 py-2 text-sm" /></div><button className="rounded bg-slate-900 px-3 py-2 text-sm text-white">Run preview</button></form>{preview ? <div className="mt-4 space-y-2 text-sm">{preview.evaluatedFlags.map((item) => <div key={item.flagKey} className="rounded border p-3"><div className="font-medium">{item.flagKey}: {item.enabled ? 'enabled' : 'disabled'}</div><div className="text-xs text-muted-foreground">source={item.source} · scope={item.scopeType}{item.scopeId ? `:${item.scopeId}` : ''}{item.bucketResult ? ` · bucket=${item.bucketResult.bucket} threshold=${item.bucketResult.threshold}` : ''}</div><div className="mt-1 text-xs text-muted-foreground">{item.reasons.map((entry) => entry.code).join(', ') || 'no reasons'}</div></div>)}</div> : null}</div>
  <div className="space-y-6"><div className="rounded border bg-white p-4"><h2 className="mb-3 text-xl font-semibold">Rollout rules</h2><div className="space-y-2 text-sm">{rolloutRules.map((item) => <div key={item.id} className="rounded border p-3">{item.flagKey} · {item.scopeType}:{item.scopeId} · {item.percentage}% by {item.bucketBy}{item.salt ? ` · salt=${item.salt}` : ''}</div>)}</div></div><div className="rounded border bg-white p-4"><h2 className="mb-3 text-xl font-semibold">Runtime assignments</h2><div className="space-y-2 text-sm">{assignments.map((item) => <div key={item.id} className="rounded border p-3">{item.flagKey} · {item.scopeType}:{item.scopeId} · value={String(item.value)} · {item.enabled ? 'active' : 'disabled'}</div>)}</div></div><div className="rounded border bg-white p-4"><h2 className="mb-3 text-xl font-semibold">Module controls</h2><div className="space-y-2 text-sm">{moduleRules.map((item) => <div key={item.id} className="rounded border p-3">{item.moduleKey} · {item.scopeType}:{item.scopeId} · enabled={String(item.enabled)} · visible={String(item.visible)}</div>)}</div></div></div></section></div>;
}

function SummaryCard({ title, value }: { title: string; value: number }) { return <div className="rounded border bg-white p-4"><div className="text-sm text-muted-foreground">{title}</div><div className="text-2xl font-semibold">{value}</div></div>; }
