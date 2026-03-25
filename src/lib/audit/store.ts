import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import type { AuditEvent } from '@/lib/audit/types';

type AuditStoreState = { items: AuditEvent[] };
const emptyState = (): AuditStoreState => ({ items: [] });

export class AuditStore {
  constructor(private readonly filePath = process.env.RBP_AUDIT_STORE_PATH ?? path.join(process.cwd(), '.rbp-data', 'audit-store.json')) {}

  private async ensureFile() {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    try { await readFile(this.filePath, 'utf8'); } catch { await writeFile(this.filePath, JSON.stringify(emptyState(), null, 2), 'utf8'); }
  }

  async read() { await this.ensureFile(); return JSON.parse(await readFile(this.filePath, 'utf8')) as AuditStoreState; }
  async write(state: AuditStoreState) { await this.ensureFile(); await writeFile(this.filePath, JSON.stringify(state, null, 2), 'utf8'); }
  async append(event: AuditEvent) { const state = await this.read(); state.items.push(event); await this.write(state); }
  async getById(id: string) { return (await this.read()).items.find((item) => item.id === id) ?? null; }
  async query() { return (await this.read()).items; }
  async reset() { await this.write(emptyState()); }
}

let auditStore: AuditStore | null = null;
export function getAuditStore() { auditStore ??= new AuditStore(); return auditStore; }
export function resetAuditStoreForTests() { auditStore = null; }
