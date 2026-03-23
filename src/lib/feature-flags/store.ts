import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { getTestControlPlaneRepository, resetTestControlPlaneRepository } from '@/lib/feature-flags/in-memory-repository';
import type { ControlPlaneRepository } from '@/lib/feature-flags/repository';
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
  async reset() { await this.write(emptyState()); }
}

let controlPlaneRepository: ControlPlaneRepository | null = null;

export function getControlPlaneRepository() {
  if (controlPlaneRepository) return controlPlaneRepository;
  if (process.env.NODE_ENV === 'test') {
    controlPlaneRepository = getTestControlPlaneRepository();
  } else {
    const { FirestoreControlPlaneRepository } = require('@/lib/feature-flags/firestore-repository');
    controlPlaneRepository = new FirestoreControlPlaneRepository();
  }
  return controlPlaneRepository;
}

export function setControlPlaneRepository(repository: ControlPlaneRepository | null) {
  controlPlaneRepository = repository;
}

export function resetControlPlaneRepositoryForTests() {
  controlPlaneRepository = null;
  resetTestControlPlaneRepository();
}
