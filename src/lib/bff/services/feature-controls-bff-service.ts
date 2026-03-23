import { FeatureFlagService, buildFeatureEvaluationContext } from '@/lib/feature-flags/service';
import { AuditService } from '@/lib/audit/service';
import { getTenantById, getWorkspacesForTenant } from '@/lib/platform/bootstrap';
import type { BffRequestContext } from '@/lib/bff/utils/request-context';
import type { FeatureFlagAssignment, PercentageRolloutRule, PreviewEvaluationContext } from '@/lib/feature-flags/types';

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
}
