# Platform feature controls

## Architecture

The Step 9 platform rollout system is split into five layers:

1. **Definitions** in `src/lib/feature-flags/definitions.ts` define canonical flags, release stages, scope support, dependencies, conflicts, and kill switch status.
2. **Persistence** in `src/lib/feature-flags/store.ts` durably stores runtime feature assignments and module enablement rules in a replaceable file-backed store.
3. **Evaluation** in `src/lib/feature-flags/service.ts` resolves effective flags and modules for a session-aware context using explicit precedence.
4. **Admin control surfaces** in `src/app/api/admin/**` and `src/app/admin/system/feature-controls/**` expose protected operator APIs and an internal admin UI.
5. **Integration** flows through `src/lib/platform/session.ts`, search/tasks/workflow services, notifications, and navigation so the backend stays the source of truth.

## Feature flags vs module controls

- **Feature flags** control behaviors, release stages, previews, integrations, and kill switches.
- **Module controls** control whether a module is visible and enabled for a scope.
- A module may exist in the registry but still be hidden or disabled by a module rule.
- A module may be enabled while a sub-feature inside it stays beta-only or disabled by a feature flag.

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

## Naming rules

Use stable dotted keys:

- `feature.<module>.enabled`
- `feature.module.<module>.enabled`
- `feature.internal.preview.<capability>`
- `feature.kill_switch.<capability>`
- `feature.integration.<system>.<behavior>`

## How to add a new flag

1. Add a `FeatureFlagDefinition` entry in `src/lib/feature-flags/definitions.ts`.
2. Choose a category, release stage, supported scopes, dependencies, and conflicts.
3. Integrate the flag in backend service logic through `FeatureFlagService` rather than ad hoc booleans.
4. Add tests for evaluation, precedence, and any kill-switch or dependency behavior.
5. If the frontend needs visibility, consume the evaluated `session.featureFlags` payload instead of raw assignments.

## How to add a new module rollout rule

1. Ensure the module exists in the platform module registry/bootstrap definitions.
2. Use `FeatureFlagService.saveModuleRule()` from protected admin surfaces.
3. Keep enablement and visibility logic in `FeatureFlagService.evaluateModule()`.
4. Validate the resulting module in session/bootstrap and route access tests.

## Safe backend and frontend usage

- Backend code should build a `FeatureEvaluationContext` and call `evaluateFlag`, `getEffectiveFlags`, `evaluateModule`, or `getEffectiveModules`.
- Frontend code should only consume evaluated session data and admin preview results.
- Search, tasks, workflows, and notifications now respect kill switches or feature availability server-side.

## Preview and rollback guidance

- Use `GET /api/admin/feature-preview` to preview effective state for a target tenant/workspace context.
- Use kill switches for emergency rollback of search, tasks, notifications, and workflows.
- Prefer tenant/workspace-targeted rollout before environment-wide changes.
- Always provide a human-readable reason when changing assignments or module rules.

## Operational notes

- Critical changes should generate audit events.
- Kill switch changes may also notify privileged operators.
- The file-backed store is intentionally replaceable; later platform maturity can move the same service contract to a DB-backed implementation.

## Known limitations / future maturity

- Percentage rollout definitions exist in the model, but deterministic bucketing is not yet implemented.
- The admin UI is intentionally functional and internal-first rather than fully polished.
- Some deeper route-level sub-feature checks can be added over time as more modules are migrated to the central evaluator.
