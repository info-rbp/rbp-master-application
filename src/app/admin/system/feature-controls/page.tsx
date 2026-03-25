import { resolveSessionResponse } from '@/lib/platform/session';
import { redirect } from 'next/navigation';
import { FeatureControlsBffService } from '@/lib/bff/services/feature-controls-bff-service';
import { evaluateActionPolicyAccess, evaluateSubFeatureAccess } from '@/lib/access/evaluators';
import FeatureControlsClient from './feature-controls-client';

export default async function FeatureControlsPage() {
  const response = await resolveSessionResponse();
  if (!response.authenticated) redirect('/login?next=/admin/system/feature-controls');
  const context = {
    correlationId: response.session.sessionId,
    session: response.session,
    internalUser: response.session.activeTenant.tenantType === 'internal' || response.session.availableTenants.some((tenant) => tenant.tenantType === 'internal'),
  };
  const accessContext = { environment: process.env.NODE_ENV ?? 'development', tenantId: response.session.activeTenant.id, workspaceId: response.session.activeWorkspace?.id, userId: response.session.user.id, roleCodes: response.session.roles.map((role) => role.code), enabledModules: response.session.enabledModules, effectiveFlags: response.session.featureFlags, effectivePermissions: response.session.effectivePermissions, internalUser: context.internalUser, correlationId: response.session.sessionId, activeRoute: '/admin/system/feature-controls' } as const;
  if (!evaluateActionPolicyAccess('admin.console.view', accessContext).result.allowed) redirect('/access-denied');

  const service = new FeatureControlsBffService();
  const data = await service.getConsoleData(context);
  const canManage = evaluateActionPolicyAccess('admin.feature_assignment.create', accessContext).result.allowed;
  const canManageModules = evaluateActionPolicyAccess('admin.module_rule.create', accessContext).result.allowed;
  const canPreview = evaluateSubFeatureAccess('admin.rollout_preview', accessContext).result.allowed;

  return <FeatureControlsClient {...data} canManage={canManage} canManageModules={canManageModules} canPreview={canPreview} />;
}
