import type { ReactNode } from 'react';
import type { AuditEvent } from '@/lib/audit/types';
import type { BucketEvaluationResult, FeatureEvaluationReason } from '@/lib/feature-flags/types';
import { formatDate } from './feature-controls-utils';

export function Panel({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <div className="rounded border bg-white p-4"><div className="mb-3"><h2 className="text-xl font-semibold">{title}</h2><p className="text-sm text-muted-foreground">{description}</p></div>{children}</div>;
}

export function SummaryCard({ title, value, helper, tone = 'default' }: { title: string; value: number; helper: string; tone?: 'default' | 'critical' }) {
  return <div className={`rounded border p-4 ${tone === 'critical' ? 'border-red-200 bg-red-50' : 'bg-white'}`}><div className="text-sm text-muted-foreground">{title}</div><div className="text-2xl font-semibold">{value}</div><div className="text-xs text-muted-foreground">{helper}</div></div>;
}

export function Badge({ label, tone }: { label: string; tone: 'neutral' | 'warning' | 'critical' | 'success' }) {
  const className = {
    neutral: 'bg-slate-100 text-slate-700',
    warning: 'bg-amber-100 text-amber-700',
    critical: 'bg-red-100 text-red-700',
    success: 'bg-emerald-100 text-emerald-700',
  }[tone];
  return <span className={`rounded-full px-2 py-1 text-xs ${className}`}>{label}</span>;
}

export function DetailStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded border bg-slate-50 p-3"><div className="text-xs text-muted-foreground">{label}</div><div className="mt-1 font-medium">{value}</div></div>;
}

export function EmptyState({ text }: { text: string }) {
  return <div className="rounded border border-dashed p-4 text-sm text-muted-foreground">{text}</div>;
}

export function SectionTitle({ title }: { title: string }) {
  return <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</div>;
}

export function RowBadge({ title, subtitle, badges }: { title: string; subtitle: string; badges: Array<{ label: string; tone: 'neutral' | 'warning' | 'critical' | 'success' }> }) {
  return <div className="rounded border p-3"><div className="font-medium">{title}</div><div className="text-xs text-muted-foreground">{subtitle}</div><div className="mt-2 flex flex-wrap gap-2">{badges.map((badge) => <Badge key={badge.label} label={badge.label} tone={badge.tone} />)}</div></div>;
}

export function RuleList<T extends { id: string; updatedAt: string; reason: string; version: number }>(props: { items: T[]; empty: string; render: (item: T) => string; onDisable?: (id: string, version: number) => void; onEdit?: (item: T) => void; editingId?: string | null }) {
  return <div className="space-y-2">{props.items.length > 0 ? props.items.map((item) => <div key={item.id} className={`rounded border p-3 ${props.editingId === item.id ? 'border-slate-900 bg-slate-50' : ''}`}><div className="flex items-start justify-between gap-3"><div><div className="font-medium">{props.render(item)}</div><div className="mt-1 text-xs text-muted-foreground">{item.reason || 'No reason recorded.'} · updated {formatDate(item.updatedAt)}</div></div><div className="flex gap-2">{props.onEdit ? <button className="rounded border px-3 py-1 text-xs" onClick={() => props.onEdit?.(item)}>Edit</button> : null}{props.onDisable ? <button className="rounded border px-3 py-1 text-xs" onClick={() => props.onDisable?.(item.id, item.version)}>Disable</button> : null}</div></div></div>) : <EmptyState text={props.empty} />}</div>;
}

export function ReasonList({ reasons, empty, compact = false }: { reasons: FeatureEvaluationReason[]; empty: string; compact?: boolean }) {
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

export function BucketDetailsCard({ bucketResult }: { bucketResult: BucketEvaluationResult }) {
  return <div className="rounded border bg-slate-50 p-3 text-xs">Bucket details: normalized key <code>{bucketResult.normalizedKey}</code>, bucket {bucketResult.bucket}, threshold {bucketResult.threshold}, matched {String(bucketResult.matched)}, salt {bucketResult.saltUsed ?? 'default'}.</div>;
}

export function AuditRow({ item, onTarget }: { item: AuditEvent; onTarget?: (item: AuditEvent) => void }) {
  return <div className="rounded border p-3"><div className="flex items-center justify-between gap-3"><div className="font-medium">{item.eventType}</div><Badge label={item.severity} tone={item.severity === 'critical' ? 'critical' : item.severity === 'warning' ? 'warning' : 'neutral'} /></div><div className="mt-1 text-xs text-muted-foreground">{item.actorDisplay ?? item.actorId ?? 'system'} · {formatDate(item.timestamp)}</div><div className="mt-1 text-xs text-muted-foreground">{item.subjectEntityId ?? item.targetEntityId ?? '—'} · {item.reason ?? String(item.metadata?.reason ?? 'No reason recorded')}</div>{onTarget ? <button className="mt-2 rounded border px-2 py-1 text-xs" onClick={() => onTarget(item)}>Inspect target</button> : null}</div>;
}
