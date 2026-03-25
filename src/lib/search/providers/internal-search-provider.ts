import type { SearchProvider, SearchQuery } from '@/lib/search/types';
import { TaskService } from '@/lib/tasks/service';
import { getWorkflowStore } from '@/lib/workflows/store/workflow-store';

export class InternalSearchProvider implements SearchProvider {
  readonly key = 'platform';
  readonly supportedEntityTypes = ['task', 'workflow'] as const;
  private readonly tasks = new TaskService();
  private readonly workflows = getWorkflowStore();

  supports(query: SearchQuery) {
    return !query.entityTypes || query.entityTypes.some((type) => this.supportedEntityTypes.includes(type as any));
  }

  getEntityTypeSupport() { return [...this.supportedEntityTypes]; }
  async getHealth() { return { key: this.key, status: 'healthy' as const }; }

  async search(query: SearchQuery) {
    const items = [] as any[];
    if (!query.entityTypes || query.entityTypes.includes('task')) {
      const taskList = await this.tasks.listTasks({ session: { activeTenant: { id: query.tenantId }, activeWorkspace: query.workspaceId ? { id: query.workspaceId } : undefined, user: { id: query.currentUserId, displayName: query.currentUserId }, enabledModules: ['dashboard', 'applications', 'support', 'documents', 'finance', 'knowledge', 'loans', 'customers'], effectivePermissions: [{ resource: '*', actions: ['read', 'approve', 'update', 'manage'], scope: 'tenant' }] } as any, internalUser: true, correlationId: query.correlationId }, { search: query.query, page: 1, pageSize: query.pageSize, assignment: 'all' });
      items.push(...taskList.items.map((item) => ({ id: `search:task:${item.id}`, resultType: 'task', entityType: 'task', entityId: item.id, moduleKey: item.moduleKey, title: item.title, subtitle: item.relatedEntityDisplay ?? item.queue, description: item.description, status: item.status, badges: [item.priority, item.sourceSystem], highlights: [item.title], route: `/tasks?task=${encodeURIComponent(item.id)}`, sourceSystem: item.sourceSystem, sourceRefs: item.sourceRef ? [item.sourceRef] : [], score: 25, matchedFields: ['title'], createdAt: item.createdAt, updatedAt: item.updatedAt, accessLevel: 'tenant', meta: { taskType: item.taskType, relatedEntityType: item.relatedEntityType, relatedEntityId: item.relatedEntityId } })));
    }
    if (!query.entityTypes || query.entityTypes.includes('workflow')) {
      const workflows = (await this.workflows.read()).instances
        .filter((item) => item.tenantId === query.tenantId)
        .filter((item) => !query.query || `${item.workflowType} ${item.relatedEntityId}`.toLowerCase().includes(query.query.toLowerCase()))
        .slice(0, query.pageSize * 2);
      items.push(...workflows.map((item) => ({ id: `search:workflow:${item.id}`, resultType: 'workflow', entityType: 'workflow', entityId: item.id, moduleKey: 'dashboard', title: item.workflowType.replace(/_/g, ' '), subtitle: item.relatedEntityId, description: item.currentStep, status: item.status, badges: ['Workflow'], highlights: [item.relatedEntityId], route: `/api/workflows/${item.id}`, sourceSystem: 'platform', sourceRefs: item.sourceSystemRefs, score: item.status === 'failed' ? 30 : 18, matchedFields: ['workflowType', 'relatedEntityId'], createdAt: item.createdAt, updatedAt: item.updatedAt, accessLevel: 'internal', meta: { workflowType: item.workflowType } })));
    }
    return { providerKey: this.key, items };
  }
}
