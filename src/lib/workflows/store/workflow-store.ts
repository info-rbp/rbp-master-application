import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import type { IdempotencyRecord, WorkflowEvent, WorkflowInstance, WorkflowStepExecution, WorkflowStoreSnapshot } from '@/lib/workflows/types';

function defaultSnapshot(): WorkflowStoreSnapshot {
  return { instances: [], steps: [], events: [], idempotency: [] };
}

export class WorkflowStore {
  constructor(private readonly filePath = process.env.RBP_WORKFLOW_STORE_PATH ?? path.join(process.cwd(), '.rbp-data', 'workflow-store.json')) {}

  private async ensureFile() {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    try {
      await readFile(this.filePath, 'utf8');
    } catch {
      await writeFile(this.filePath, JSON.stringify(defaultSnapshot(), null, 2), 'utf8');
    }
  }

  async read(): Promise<WorkflowStoreSnapshot> {
    await this.ensureFile();
    const raw = await readFile(this.filePath, 'utf8');
    return raw ? JSON.parse(raw) as WorkflowStoreSnapshot : defaultSnapshot();
  }

  async write(snapshot: WorkflowStoreSnapshot) {
    await this.ensureFile();
    await writeFile(this.filePath, JSON.stringify(snapshot, null, 2), 'utf8');
  }

  async saveInstance(instance: WorkflowInstance) {
    const snapshot = await this.read();
    const index = snapshot.instances.findIndex((item) => item.id === instance.id);
    if (index >= 0) snapshot.instances[index] = instance; else snapshot.instances.push(instance);
    await this.write(snapshot);
  }

  async saveStep(step: WorkflowStepExecution) {
    const snapshot = await this.read();
    const index = snapshot.steps.findIndex((item) => item.id === step.id);
    if (index >= 0) snapshot.steps[index] = step; else snapshot.steps.push(step);
    await this.write(snapshot);
  }

  async saveEvent(event: WorkflowEvent) {
    const snapshot = await this.read();
    snapshot.events.push(event);
    await this.write(snapshot);
  }

  async saveIdempotency(record: IdempotencyRecord) {
    const snapshot = await this.read();
    const index = snapshot.idempotency.findIndex((item) => item.idempotencyKey === record.idempotencyKey && item.workflowType === record.workflowType && item.tenantId === record.tenantId);
    if (index >= 0) snapshot.idempotency[index] = record; else snapshot.idempotency.push(record);
    await this.write(snapshot);
  }

  async getWorkflowInstance(id: string) {
    const snapshot = await this.read();
    return snapshot.instances.find((item) => item.id === id) ?? null;
  }

  async getWorkflowStatus(id: string) {
    const snapshot = await this.read();
    const workflow = snapshot.instances.find((item) => item.id === id) ?? null;
    if (!workflow) return null;
    return {
      workflow,
      steps: snapshot.steps.filter((item) => item.workflowInstanceId === id).sort((a, b) => a.sequence - b.sequence),
      events: snapshot.events.filter((item) => item.workflowInstanceId === id),
    };
  }

  async findIdempotencyRecord(input: { idempotencyKey: string; workflowType: string; tenantId: string }) {
    const snapshot = await this.read();
    return snapshot.idempotency.find((item) => item.idempotencyKey === input.idempotencyKey && item.workflowType === input.workflowType && item.tenantId === input.tenantId) ?? null;
  }

  async listWorkflowsByEntity(input: { tenantId: string; relatedEntityType?: string; relatedEntityId?: string }) {
    const snapshot = await this.read();
    return snapshot.instances.filter((item) => item.tenantId === input.tenantId)
      .filter((item) => !input.relatedEntityType || item.relatedEntityType === input.relatedEntityType)
      .filter((item) => !input.relatedEntityId || item.relatedEntityId === input.relatedEntityId);
  }

  async reset() {
    await this.write(defaultSnapshot());
  }
}

let workflowStore: WorkflowStore | null = null;
export function getWorkflowStore() {
  workflowStore ??= new WorkflowStore();
  return workflowStore;
}
export function resetWorkflowStoreForTests() { workflowStore = null; }
