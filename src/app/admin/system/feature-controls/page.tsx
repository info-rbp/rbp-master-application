import { resolveSessionResponse } from '@/lib/platform/session';
import { redirect } from 'next/navigation';
import { canPermission } from '@/lib/platform/permissions';
import { FeatureControlsBffService } from '@/lib/bff/services/feature-controls-bff-service';
import FeatureControlsClient from './feature-controls-client';

export default async function FeatureControlsPage() {
  const response = await resolveSessionResponse();
  if (!response.authenticated) redirect('/login?next=/admin/system/feature-controls');
  if (!canPermission(response.session.effectivePermissions, 'feature_flags', 'read')) redirect('/access-denied');
  const service = new FeatureFlagService();
  const catalog = await service.getFeatureCatalog();
  const assignments = await service.listAssignments();
  const rolloutRules = await service.listRolloutRules();
  const moduleRules = await service.listModuleRules();
  const featureContext = buildFeatureEvaluationContext({ session: response.session, internalUser: response.session.activeTenant.tenantType === 'internal' || response.session.availableTenants.some((tenant) => tenant.tenantType === 'internal'), correlationId: response.session.sessionId });
  const evaluations = await service.evaluateFlags(catalog.map((item) => item.flagKey), featureContext);
  const modules = await service.getEffectiveModules({ tenant: response.session.activeTenant, workspace: response.session.activeWorkspace, permissions: response.session.effectivePermissions, internalUser: featureContext.isInternalUser, featureContext });

  return <FeatureControlsClient catalog={catalog} assignments={assignments} rolloutRules={rolloutRules} moduleRules={moduleRules} evaluations={evaluations} modules={modules} canManage={canPermission(response.session.effectivePermissions, 'feature_flags', 'manage')} canManageModules={canPermission(response.session.effectivePermissions, 'module_controls', 'manage')} />;
}
