'use client';

import { useMemo, useState } from 'react';
import type { FeatureCatalogEntry, FeatureEvaluationResult, FeatureFlagAssignment, ModuleAccessControlResult, ModuleEnablementRule } from '@/lib/feature-flags/types';

export default function FeatureControlsClient({ catalog, assignments, moduleRules, evaluations, modules, canManage, canManageModules }: { catalog: FeatureCatalogEntry[]; assignments: FeatureFlagAssignment[]; moduleRules: ModuleEnablementRule[]; evaluations: FeatureEvaluationResult[]; modules: ModuleAccessControlResult[]; canManage: boolean; canManageModules: boolean }) {
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('');
  const filteredCatalog = useMemo(() => catalog.filter((item) => `${item.flagKey} ${item.name} ${item.category}`.toLowerCase().includes(filter.toLowerCase())), [catalog, filter]);

  async function createAssignment(formData: FormData) {
    const flagKey = String(formData.get('flagKey') ?? '');
    const scopeType = String(formData.get('scopeType') ?? 'tenant');
    const scopeId = String(formData.get('scopeId') ?? '');
    const value = formData.get('value') === 'true';
    const reason = String(formData.get('reason') ?? '');
    const response = await fetch(`/api/admin/feature-flags/${encodeURIComponent(flagKey)}/assignments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scopeType, scopeId, value, reason, enabled: true, metadata: {} }) });
    setMessage(response.ok ? 'Feature assignment saved. Refresh to see updated evaluations.' : 'Failed to save feature assignment.');
  }

  async function createModuleRule(formData: FormData) {
    const payload = Object.fromEntries(formData.entries());
    const response = await fetch('/api/admin/module-controls', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ moduleKey: payload.moduleKey, scopeType: payload.scopeType, scopeId: payload.scopeId, enabled: payload.enabled === 'true', visible: payload.visible === 'true', internalOnly: payload.internalOnly === 'true', betaOnly: payload.betaOnly === 'true', reason: payload.reason, metadata: {} }) });
    setMessage(response.ok ? 'Module rule saved. Refresh to see updated evaluations.' : 'Failed to save module rule.');
  }

  return (
    <div className="space-y-6 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Feature controls</h1>
          <p className="text-sm text-muted-foreground">Backend-owned feature flags, rollout assignments, kill switches, and module enablement controls.</p>
        </div>
        <input className="rounded border px-3 py-2 text-sm" placeholder="Filter flags" value={filter} onChange={(event) => setFilter(event.target.value)} />
      </div>
      {message ? <div className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm">{message}</div> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Flags" value={catalog.length} />
        <SummaryCard title="Kill switches" value={catalog.filter((item) => item.isKillSwitch).length} />
        <SummaryCard title="Assignments" value={assignments.length} />
        <SummaryCard title="Enabled modules" value={modules.length} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[2fr,1fr]">
        <div className="rounded border bg-white p-4">
          <h2 className="mb-3 text-xl font-semibold">Feature catalog</h2>
          <div className="space-y-3">
            {filteredCatalog.map((item) => {
              const evaluation = evaluations.find((entry) => entry.flagKey === item.flagKey);
              return (
                <div key={item.flagKey} className="rounded border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-muted-foreground">{item.flagKey} · {item.category} · {item.releaseStage}</div>
                    </div>
                    <div className={`rounded px-2 py-1 text-xs ${evaluation?.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>{evaluation?.enabled ? 'Enabled' : 'Disabled'}</div>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                  <div className="mt-2 text-xs text-muted-foreground">Reasons: {evaluation?.reasonCodes.join(', ') || 'none'}{item.isKillSwitch ? ' · Kill switch' : ''}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded border bg-white p-4">
            <h2 className="mb-3 text-lg font-semibold">Create feature assignment</h2>
            {canManage ? <form action={createAssignment} className="space-y-3"> <input name="flagKey" placeholder="feature.search.enabled" className="w-full rounded border px-3 py-2 text-sm" /> <div className="grid grid-cols-2 gap-2"><input name="scopeType" defaultValue="tenant" className="rounded border px-3 py-2 text-sm" /><input name="scopeId" placeholder="ten_acme_customer" className="rounded border px-3 py-2 text-sm" /></div><select name="value" className="w-full rounded border px-3 py-2 text-sm"><option value="true">true</option><option value="false">false</option></select><textarea name="reason" placeholder="Why is this changing?" className="w-full rounded border px-3 py-2 text-sm" /><button className="rounded bg-slate-900 px-3 py-2 text-sm text-white">Save assignment</button></form> : <p className="text-sm text-muted-foreground">You do not have permission to manage feature assignments.</p>}
          </div>

          <div className="rounded border bg-white p-4">
            <h2 className="mb-3 text-lg font-semibold">Create module rule</h2>
            {canManageModules ? <form action={createModuleRule} className="space-y-3"><input name="moduleKey" placeholder="analytics" className="w-full rounded border px-3 py-2 text-sm" /><div className="grid grid-cols-2 gap-2"><input name="scopeType" defaultValue="tenant" className="rounded border px-3 py-2 text-sm" /><input name="scopeId" placeholder="ten_acme_customer" className="rounded border px-3 py-2 text-sm" /></div><div className="grid grid-cols-2 gap-2"><select name="enabled" className="rounded border px-3 py-2 text-sm"><option value="true">enabled</option><option value="false">disabled</option></select><select name="visible" className="rounded border px-3 py-2 text-sm"><option value="true">visible</option><option value="false">hidden</option></select></div><div className="grid grid-cols-2 gap-2"><select name="internalOnly" className="rounded border px-3 py-2 text-sm"><option value="false">external ok</option><option value="true">internal only</option></select><select name="betaOnly" className="rounded border px-3 py-2 text-sm"><option value="false">not beta only</option><option value="true">beta only</option></select></div><textarea name="reason" placeholder="Why is this changing?" className="w-full rounded border px-3 py-2 text-sm" /><button className="rounded bg-slate-900 px-3 py-2 text-sm text-white">Save module rule</button></form> : <p className="text-sm text-muted-foreground">You do not have permission to manage module rules.</p>}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded border bg-white p-4">
          <h2 className="mb-3 text-xl font-semibold">Runtime assignments</h2>
          <div className="space-y-2 text-sm">
            {assignments.map((item) => <div key={item.id} className="rounded border p-3">{item.flagKey} · {item.scopeType}:{item.scopeId} · value={String(item.value)} · {item.enabled ? 'active' : 'disabled'}</div>)}
          </div>
        </div>
        <div className="rounded border bg-white p-4">
          <h2 className="mb-3 text-xl font-semibold">Module controls</h2>
          <div className="space-y-2 text-sm">
            {moduleRules.map((item) => <div key={item.id} className="rounded border p-3">{item.moduleKey} · {item.scopeType}:{item.scopeId} · enabled={String(item.enabled)} · visible={String(item.visible)}</div>)}
          </div>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ title, value }: { title: string; value: number }) {
  return <div className="rounded border bg-white p-4"><div className="text-sm text-muted-foreground">{title}</div><div className="text-2xl font-semibold">{value}</div></div>;
}
