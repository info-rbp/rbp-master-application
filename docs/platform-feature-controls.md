# Platform feature controls

## Architecture

The control-plane rollout system now has five active layers:

1. **Definitions** in `src/lib/feature-flags/definitions.ts` keep the flag catalog, default values, release stages, dependencies, conflicts, and kill-switch designation in code.
2. **Durable persistence** stores explicit assignments, percentage rollout rules, and module enablement rules in Firestore through the repository interfaces under `src/lib/feature-flags/repository.ts`.
3. **Deterministic evaluation** in `src/lib/feature-flags/service.ts` applies precedence, release-stage gating, dependency/conflict checks, and percentage rollout bucketing.
4. **Preview / simulation** flows through `FeatureControlsBffService` and `/api/admin/feature-preview`, including support for unsaved rollout-rule simulation.
5. **Integration** continues through session bootstrap, admin APIs/UI, navigation, and backend feature checks so the frontend only consumes evaluated state.

## Durable runtime collections

- `platform_control_plane/runtime/feature_flag_assignments`
- `platform_control_plane/runtime/percentage_rollout_rules`
- `platform_control_plane/runtime/module_enablement_rules`

## Deterministic bucketing strategy

The system uses deterministic bucketing for percentage rollout.

### Algorithm

1. Build a stable target identity string.
2. Concatenate `flagKey | normalizedKey | saltUsed`.
3. Hash with `sha256`.
4. Convert the first 8 hex chars to an integer.
5. Compute `bucket = hashValue % 100`.
6. Mark the target as included when `bucket < percentage`.

This yields a stable bucket range of **0-99**.

### Target identity normalization

- `tenant` → `tenant:<tenantId>`
- `workspace` → `tenant:<tenantId>|workspace:<workspaceId>`
- `user` → `tenant:<tenantId>|user:<userId>`
- `role` → `tenant:<tenantId>|roles:<sorted role codes>`
- `composite` → `tenant + workspace + user + sorted roles`

If a required identifier for the chosen `bucketBy` mode is missing, the rollout rule fails safely and does not match.

## Precedence with rollout

Effective precedence remains:

1. kill switch assignment
2. user assignment
3. role assignment
4. workspace assignment
5. tenant assignment
6. module assignment
7. environment assignment
8. definition default

Within a given scope:

- explicit assignment beats percentage rollout
- one matching rollout rule may apply
- conflicting rollout rules at the same winning scope fail safe and surface reasoning
- dependencies, conflicts, and release-stage gating still apply after rollout match

## Explainability model

Feature evaluation now exposes:

- `reasonCodes[]`
- structured `reasons[]`
- winning source / scope
- bucket details when a percentage rollout rule is involved
- dependency/conflict failures
- release-stage blockers
- kill-switch override reasoning

This is available to runtime evaluation and admin preview.

## Preview and simulation

### Current live preview

Use:

- `GET /api/admin/feature-preview`

Supported query fields include:

- `tenantId`
- `workspaceId`
- `userId`
- `roleCodes` as comma-separated values
- `featureKeys` as comma-separated values
- `includeReasoning`
- `includeBucketDetails`

### Simulated preview

Use:

- `POST /api/admin/feature-preview`

This supports proposed unsaved rollout changes through request payload fields such as:

- `proposedAssignments[]`
- `proposedRolloutRules[]`

The preview response returns context summary, evaluated flags, evaluated modules, warnings, dependency/conflict summaries, and metadata about reasoning inclusion.

## Admin APIs

Existing admin APIs remain, with rollout additions:

- `GET /api/admin/feature-flags` now includes `rolloutRules`
- `POST /api/admin/feature-flags/:key/rollout-rules`
- `PUT /api/admin/feature-flags/rollout-rules/:id`
- `DELETE /api/admin/feature-flags/rollout-rules/:id`
- `GET /api/admin/feature-preview`
- `POST /api/admin/feature-preview`

## Admin UI usage

The feature-controls admin screen now supports:

- viewing rollout-capable flags
- creating percentage rollout rules
- selecting `bucketBy`
- optional salt input
- previewing target contexts
- simulating an unsaved rollout rule
- seeing bucket details and reason codes in the preview output

## Validation rules

- rollout percentage must be an integer in `0..100`
- scope must be supported by the flag
- scope identifiers must be valid where bootstrap lookup is available
- `startsAt <= endsAt`
- a reason is required for rollout changes
- release-stage and kill-switch safeguards remain enforced by evaluation

## Salt guidance

- Keep salt empty to preserve the current cohort definition.
- Change salt only when you intentionally want a new deterministic cohort cut.
- Treat salt changes like user-impacting rollout changes and audit them carefully.

## Migration / local bootstrap

Legacy JSON import remains available:

```bash
npm run migrate:feature-controls
```

The importer now supports assignments, percentage rollout rules, and module rules, while remaining idempotent by id.

## Safe rollout guidance

- Start with tenant or workspace rollout before broader user/composite targeting.
- Use preview before saving high-risk changes.
- Keep kill switches available for emergency rollback.
- Prefer changing percentage before changing salt; changing salt intentionally reshuffles cohorts.

## Rollback guidance

- Disable or reduce the percentage rollout rule.
- Apply an explicit assignment override for emergency scoped disable.
- Use a kill switch if immediate broad shutdown is required.
- Avoid falling back to legacy JSON reads for runtime truth.

## Sprint 3 deferred

- deeper route-level rollout controls
- broader rollout analytics / observability
- richer operator notifications for threshold crossings and rollout conflicts
