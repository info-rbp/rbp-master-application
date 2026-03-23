import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import type { FeatureFlagAssignment, ModuleEnablementRule } from '@/lib/feature-flags/types';

type FeatureFlagStoreState = {
  assignments: FeatureFlagAssignment[];
  moduleRules: ModuleEnablementRule[];
};
const emptyState = (): FeatureFlagStoreState => ({ assignments: [], moduleRules: [] });

export class FeatureFlagStore {
  constructor(private readonly filePath = process.env.RBP_FEATURE_FLAG_STORE_PATH ?? path.join(process.cwd(), '.rbp-data', 'feature-flags-store.json')) {}
  private async ensureFile() { await mkdir(path.dirname(this.filePath), { recursive: true }); try { await readFile(this.filePath, 'utf8'); } catch { await writeFile(this.filePath, JSON.stringify(emptyState(), null, 2), 'utf8'); } }
  async read() { await this.ensureFile(); const raw = await readFile(this.filePath, 'utf8'); return raw ? JSON.parse(raw) as FeatureFlagStoreState : emptyState(); }
  async write(state: FeatureFlagStoreState) { await this.ensureFile(); await writeFile(this.filePath, JSON.stringify(state, null, 2), 'utf8'); }
  async listAssignments() { return (await this.read()).assignments; }
  async saveAssignment(assignment: FeatureFlagAssignment) { const state = await this.read(); const index = state.assignments.findIndex((item) => item.id === assignment.id); if (index >= 0) state.assignments[index] = assignment; else state.assignments.push(assignment); await this.write(state); }
  async getAssignment(id: string) { return (await this.read()).assignments.find((item) => item.id === id) ?? null; }
  async listModuleRules() { return (await this.read()).moduleRules; }
  async saveModuleRule(rule: ModuleEnablementRule) { const state = await this.read(); const index = state.moduleRules.findIndex((item) => item.id === rule.id); if (index >= 0) state.moduleRules[index] = rule; else state.moduleRules.push(rule); await this.write(state); }
  async getModuleRule(id: string) { return (await this.read()).moduleRules.find((item) => item.id === id) ?? null; }
  async reset() { await this.write(emptyState()); }
}

let featureFlagStore: FeatureFlagStore | null = null;
export function getFeatureFlagStore() { featureFlagStore ??= new FeatureFlagStore(); return featureFlagStore; }
export function resetFeatureFlagStoreForTests() { featureFlagStore = null; }
