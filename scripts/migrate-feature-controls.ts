require('ts-node/register/transpile-only');
require('./register-alias.cjs');

const { FirestoreControlPlaneRepository } = require('../src/lib/feature-flags/firestore-repository');
const { importLegacyFeatureControlStore } = require('../src/lib/feature-flags/migration');
const { getLegacyFeatureFlagStoreForMigration } = require('../src/lib/feature-flags/store');
const { AuditService } = require('../src/lib/audit/service');

(async () => {
  const correlationId = `feature-control-migration-${Date.now()}`;
  const repository = new FirestoreControlPlaneRepository();
  const legacyStore = getLegacyFeatureFlagStoreForMigration(process.env.RBP_FEATURE_FLAG_STORE_PATH);
  const result = await importLegacyFeatureControlStore({ repository, store: legacyStore, actorId: process.env.RBP_MIGRATION_ACTOR_ID || 'system:migration' });
  await new AuditService().record({ eventType: 'feature.control_plane.migrated', action: 'migrate', category: 'configuration', tenantId: 'ten_rbp_internal', actorType: 'system', actorId: process.env.RBP_MIGRATION_ACTOR_ID || 'system:migration', actorDisplay: 'System Migration', subjectEntityType: 'feature_control_store', subjectEntityId: 'platform_control_plane/runtime', sourceSystem: 'platform', correlationId, outcome: 'success', severity: 'info', metadata: result, sensitivity: 'internal' });
  console.log(JSON.stringify({ correlationId, ...result }, null, 2));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
