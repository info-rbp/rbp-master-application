import { resolveSessionResponse } from '@/lib/platform/session';
import { redirect } from 'next/navigation';
import { canPermission } from '@/lib/platform/permissions';
import { FeatureControlsBffService } from '@/lib/bff/services/feature-controls-bff-service';
import FeatureControlsClient from './feature-controls-client';

export default async function FeatureControlsPage() {
  const response = await resolveSessionResponse();
  if (!response.authenticated) redirect('/login?next=/admin/system/feature-controls');
  if (!canPermission(response.session.effectivePermissions, 'feature_flags', 'read')) redirect('/access-denied');
  const context = {
    correlationId: response.session.sessionId,
    session: response.session,
    internalUser: response.session.activeTenant.tenantType === 'internal' || response.session.availableTenants.some((tenant) => tenant.tenantType === 'internal'),
  };
  const service = new FeatureControlsBffService();
  const data = await service.getConsoleData(context);

  return <FeatureControlsClient {...data} canManage={canPermission(response.session.effectivePermissions, 'feature_flags', 'manage')} canManageModules={canPermission(response.session.effectivePermissions, 'module_controls', 'manage')} canPreview={canPermission(response.session.effectivePermissions, 'rollout', 'preview')} />;
}
