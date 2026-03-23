import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import type { TaskRecord } from '@/lib/tasks/types';

type TaskStoreState = { tasks: TaskRecord[] };
const emptyState = (): TaskStoreState => ({ tasks: [] });

export class TaskStore {
  constructor(private readonly filePath = process.env.RBP_TASK_STORE_PATH ?? path.join(process.cwd(), '.rbp-data', 'task-store.json')) {}

  private async ensureFile() {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    try { await readFile(this.filePath, 'utf8'); } catch { await writeFile(this.filePath, JSON.stringify(emptyState(), null, 2), 'utf8'); }
  }

  async read() { await this.ensureFile(); return JSON.parse(await readFile(this.filePath, 'utf8')) as TaskStoreState; }
  async write(state: TaskStoreState) { await this.ensureFile(); await writeFile(this.filePath, JSON.stringify(state, null, 2), 'utf8'); }
  async listTasks() { return (await this.read()).tasks; }
  async getTask(id: string) { return (await this.read()).tasks.find((item) => item.id === id) ?? null; }
  async saveTask(task: TaskRecord) { const state = await this.read(); const idx = state.tasks.findIndex((item) => item.id === task.id); if (idx >= 0) state.tasks[idx] = task; else state.tasks.push(task); await this.write(state); }
  async reset() { await this.write(emptyState()); }
}

let taskStore: TaskStore | null = null;
export function getTaskStore() { taskStore ??= new TaskStore(); return taskStore; }
export function resetTaskStoreForTests() { taskStore = null; }
