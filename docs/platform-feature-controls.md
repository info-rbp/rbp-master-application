# Platform feature controls

## Architecture

The Sprint 1 hardening rollout system is split into five layers:

1. **Definitions** in `src/lib/feature-flags/definitions.ts` define canonical flags, release stages, scope support, dependencies, conflicts, and kill switch status.
2. **Persistence** uses repository interfaces in `src/lib/feature-flags/repository.ts` with a Firestore-backed runtime implementation in `src/lib/feature-flags/firestore-repository.ts`. The legacy JSON file store remains only as a migration import source in `src/lib/feature-flags/store.ts`.
3. **Evaluation** in `src/lib/feature-flags/service.ts` resolves effective flags and modules for a session-aware context using explicit precedence while remaining storage-agnostic.
4. **Admin control surfaces** in `src/app/api/admin/**` and `src/app/admin/system/feature-controls/**` expose protected operator APIs and the existing internal admin UI.
5. **Integration** flows through `src/lib/platform/session.ts`, search/tasks/workflow services, notifications, and navigation so the backend stays the source of truth.

## Durable runtime data model

### Feature flag assignments

Persisted in Firestore collection:

- `platform_control_plane/runtime/feature_flag_assignments`

Fields:

- `id`
- `flagKey`
- `scopeType`
- `scopeId`
- `value`
- `enabled`
- `reason`
- `releaseStage?`
- `startsAt?`
- `endsAt?`
- `createdAt`
- `updatedAt`
- `createdBy`
- `updatedBy`
- `metadata`
- `version`

### Module enablement rules

Persisted in Firestore collection:

- `platform_control_plane/runtime/module_enablement_rules`

Fields:

- `id`
- `moduleKey`
- `scopeType`
- `scopeId`
- `enabled`
- `visible`
- `internalOnly`
- `betaOnly`
- `defaultLanding?`
- `startsAt?`
- `endsAt?`
- `reason`
- `createdAt`
- `updatedAt`
- `createdBy`
- `updatedBy`
- `metadata`
- `version`

## Precedence rules

Highest to lowest:

1. kill switch assignment
2. user assignment
3. role assignment
4. workspace assignment
5. tenant assignment
6. module assignment
7. environment assignment
8. definition default

Additional fail-safe rules:

- missing dependencies disable the feature
- detected conflicts disable the feature
- `internal` stage features stay off for external users unless explicitly changed in policy later
- `beta`, `limited`, and `experimental` features default to restricted behavior unless targeted

## Validation and concurrency

- `FeatureFlagService` validates flag existence, supported scopes, target identifiers where bootstrap lookup is available, value shape, and activation windows.
- Kill switches and high-risk module changes require a reason.
- Repositories enforce optimistic concurrency with a `version` field.
- Firestore writes use transactions for updates and disables to prevent silent overwrite of concurrent admin edits.

## Migration from the legacy JSON store

The old file-backed store remains readable only to support a controlled migration.

### Run migration

```bash
npm run migrate:feature-controls
```

Useful environment variables:

- `RBP_FEATURE_FLAG_STORE_PATH` — path to the legacy JSON file.
- `RBP_CONTROL_PLANE_COLLECTION` — override the Firestore root collection name.
- `RBP_MIGRATION_ACTOR_ID` — actor id recorded for migrated writes and audit.

### Migration behavior

- Reads assignments and module rules from the legacy JSON file.
- Validates each record against current definitions and module registry.
- Preserves ids, timestamps, actor metadata, and version when present.
- Skips records whose ids are already present in Firestore, making reruns safe.
- Emits `feature.control_plane.migrated` audit metadata through the migration script.

### Verification after migration

Recommended checks:

1. Compare imported counts from the script output with the legacy JSON file counts.
2. Use the admin feature-control page or preview API to confirm known tenant/workspace evaluations.
3. Verify kill switch and module visibility behavior for a known sample tenant.
4. Review audit logs for the migration event and any follow-up mutations.

## Admin API and UI behavior

- Existing feature/module admin routes continue to work, now backed by durable Firestore persistence.
- Update and disable flows accept version-aware writes so conflicting edits can be surfaced instead of silently overwritten.
- The existing admin UI continues to consume the same API shapes; no redesign was introduced in Sprint 1.
- Session bootstrap, navigation visibility, feature preview, and module evaluation now read the durable repository path.

## Operational notes

- Critical changes should generate audit events.
- Kill switch changes may also notify privileged operators.
- Search and task services now re-check kill switches against the durable repository on execution, minimizing stale session behavior.
- Other file-backed stores still exist in unrelated subsystems such as audit and notifications; they remain out of scope for this sprint.

## Rollback guidance

- Because definitions remain code-defined, rollback is primarily a matter of restoring the previous application build and, if necessary, re-importing legacy JSON state into the target environment.
- Runtime control-plane truth should remain in Firestore after cutover; avoid running dual writes.
- If Firestore data must be reverted, restore affected documents from backup/export rather than falling back to the legacy JSON path for runtime reads.

## Sprint 2 intentionally deferred

- Deterministic percentage rollout bucketing.
- Deeper route-level controls built on the same repository abstraction.
- More advanced cache invalidation or distributed control-plane propagation.
