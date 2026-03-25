import { FeatureFlagService, buildFeatureEvaluationContext } from '@/lib/feature-flags/service';
import { AuditService } from '@/lib/audit/service';
import { getTenantById, getWorkspacesForTenant } from '@/lib/platform/bootstrap';
import type { BffRequestContext } from '@/lib/bff/utils/request-context';
import type { FeatureFlagAssignment, PercentageRolloutRule, PreviewEvaluationContext } from '@/lib/feature-flags/types';
import { evaluateSubFeatureAccess, toAccessContext } from '@/lib/access/evaluators';

export class FeatureControlsBffService {
  private readonly flags = new FeatureFlagService();
  private readonly audit = new AuditService();

  async getCatalog() { return { items: await this.flags.getFeatureCatalog() }; }
  async getAssignments(flagKey?: string) { return await this.flags.listAssignments(flagKey); }
  async getRolloutRules(flagKey?: string) { return await this.flags.listRolloutRules(flagKey); }
  async getModuleRules(moduleKey?: string) { return await this.flags.listModuleRules(moduleKey); }

  async evaluateFlag(context: BffRequestContext, flagKey: string) {
    return this.flags.evaluateFlag(flagKey, buildFeatureEvaluationContext({ session: context.session, internalUser: context.internalUser, correlationId: context.correlationId }));
  }

  async evaluateModule(context: BffRequestContext, moduleKey: string) {
    const featureContext = buildFeatureEvaluationContext({ session: context.session, internalUser: context.internalUser, correlationId: context.correlationId, currentModule: moduleKey });
    return this.flags.evaluateModule(moduleKey, { tenant: context.session.activeTenant, workspace: context.session.activeWorkspace, permissions: context.session.effectivePermissions, internalUser: context.internalUser, featureContext });
  }

  async preview(context: BffRequestContext, input: { tenantId?: string; workspaceId?: string; currentModule?: string; currentRoute?: string; userId?: string; roleCodes?: string[]; featureKeys?: string[]; includeReasoning?: boolean; includeBucketDetails?: boolean; proposedAssignments?: FeatureFlagAssignment[]; proposedRolloutRules?: PercentageRolloutRule[]; }) {
    const tenant = getTenantById(input.tenantId ?? context.session.activeTenant.id) ?? context.session.activeTenant;
    const workspace = input.workspaceId ? getWorkspacesForTenant(tenant.id).find((item) => item.id === input.workspaceId) : context.session.activeWorkspace;
    const featureContext: PreviewEvaluationContext = { ...buildFeatureEvaluationContext({ session: context.session, internalUser: context.internalUser, correlationId: context.correlationId, currentModule: input.currentModule, currentRoute: input.currentRoute }), tenantId: tenant.id, workspaceId: workspace?.id, userId: input.userId ?? context.session.user.id, roleCodes: input.roleCodes ?? context.session.roles.map((role) => role.code), featureKeys: input.featureKeys, includeReasoning: input.includeReasoning ?? true, includeBucketDetails: input.includeBucketDetails ?? true };
    return this.flags.preview(featureContext, { proposedAssignments: input.proposedAssignments, proposedRolloutRules: input.proposedRolloutRules, tenant, workspace, permissions: context.session.effectivePermissions });
  }

  async getConsoleData(context: BffRequestContext) {
    const featureContext = buildFeatureEvaluationContext({ session: context.session, internalUser: context.internalUser, correlationId: context.correlationId });
    const [catalog, assignments, rolloutRules, moduleRules, evaluations, modules, flagSummaries, moduleSummaries, diagnostics, recentChanges] = await Promise.all([
      this.flags.getFeatureCatalog(),
      this.flags.listAssignments(),
      this.flags.listRolloutRules(),
      this.flags.listModuleRules(),
      this.flags.evaluateFlags((await this.flags.getFeatureCatalog()).map((item) => item.flagKey), featureContext),
      this.flags.getEffectiveModules({ tenant: context.session.activeTenant, workspace: context.session.activeWorkspace, permissions: context.session.effectivePermissions, internalUser: context.internalUser, featureContext }),
      this.flags.getFlagOperationalSummaries(featureContext),
      this.flags.getModuleOperationalSummaries({ tenant: context.session.activeTenant, workspace: context.session.activeWorkspace, permissions: context.session.effectivePermissions, internalUser: context.internalUser, featureContext }),
      this.flags.getControlPlaneDiagnostics(featureContext),
      this.getRecentChanges(context),
    ]);

    return {
      catalog,
      assignments,
      rolloutRules,
      moduleRules,
      evaluations,
      modules,
      flagSummaries,
      moduleSummaries,
      diagnostics,
      recentChanges,
      auditVisible: evaluateSubFeatureAccess('admin.audit_history', toAccessContext(context)).result.allowed,
    };
  }

  async getRecentChanges(context: BffRequestContext, limit = 20) {
    if (!evaluateSubFeatureAccess('admin.audit_history', toAccessContext(context)).result.allowed) return [];
    const query = await this.audit.query({ tenantId: context.session.activeTenant.id, limit } as any);
    return query.items.filter((item) =>
      item.eventType.startsWith('feature.')
      || item.eventType.startsWith('module.')
      || item.eventType.startsWith('access.')
    );
  }
}
