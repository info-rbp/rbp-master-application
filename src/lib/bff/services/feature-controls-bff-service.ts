import { FeatureFlagService, buildFeatureEvaluationContext } from '@/lib/feature-flags/service';
import { getTenantById, getWorkspacesForTenant } from '@/lib/platform/bootstrap';
import type { BffRequestContext } from '@/lib/bff/utils/request-context';

export class FeatureControlsBffService {
  private readonly flags = new FeatureFlagService();

  async getCatalog() { return { items: await this.flags.getFeatureCatalog() }; }
  async getAssignments(flagKey?: string) { return await this.flags.listAssignments(flagKey); }
  async getModuleRules(moduleKey?: string) { return await this.flags.listModuleRules(moduleKey); }

  async evaluateFlag(context: BffRequestContext, flagKey: string) {
    return this.flags.evaluateFlag(flagKey, buildFeatureEvaluationContext({ session: context.session, internalUser: context.internalUser, correlationId: context.correlationId }));
  }

  async evaluateModule(context: BffRequestContext, moduleKey: string) {
    const featureContext = buildFeatureEvaluationContext({ session: context.session, internalUser: context.internalUser, correlationId: context.correlationId, currentModule: moduleKey });
    return this.flags.evaluateModule(moduleKey, { tenant: context.session.activeTenant, workspace: context.session.activeWorkspace, permissions: context.session.effectivePermissions, internalUser: context.internalUser, featureContext });
  }

  async preview(context: BffRequestContext, input: { tenantId?: string; workspaceId?: string; currentModule?: string; currentRoute?: string }) {
    const tenant = getTenantById(input.tenantId ?? context.session.activeTenant.id) ?? context.session.activeTenant;
    const workspace = input.workspaceId ? getWorkspacesForTenant(tenant.id).find((item) => item.id === input.workspaceId) : context.session.activeWorkspace;
    const featureContext = { ...buildFeatureEvaluationContext({ session: context.session, internalUser: context.internalUser, correlationId: context.correlationId, currentModule: input.currentModule, currentRoute: input.currentRoute }), tenantId: tenant.id, workspaceId: workspace?.id };
    const evaluations = await this.flags.evaluateFlags((await this.flags.getFeatureCatalog()).map((item) => item.flagKey), featureContext);
    const modules = await this.flags.getEffectiveModules({ tenant, workspace, permissions: context.session.effectivePermissions, internalUser: context.internalUser, featureContext });
    return { flags: Object.fromEntries(evaluations.map((item) => [item.flagKey, item.enabled])), evaluations, modules };
  }
}
