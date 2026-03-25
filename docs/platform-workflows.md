# Platform workflow orchestration

This layer gives the platform backend ownership of workflow initiation, state, idempotency, and status tracking.

## Architecture

- `src/lib/workflows/types.ts` defines platform workflow instance, step, event, command, idempotency, and action-result models.
- `src/lib/workflows/store/workflow-store.ts` persists instances, steps, events, and idempotency records in a replaceable file-backed store.
- `src/lib/workflows/services/orchestration-service.ts` provides the shared orchestration base: workflow creation, step recording, event publishing, idempotency handling, completion, and failure persistence.
- Workflow-specific services implement:
  - application submission
  - document upload
  - support escalation
  - billing event processing
  - review / approval start + action
- `src/app/api/workflows/**` contains thin route handlers that validate payloads, resolve request context, and delegate to orchestration services.

## Implemented endpoints

- `POST /api/workflows/application-submission`
- `POST /api/workflows/document-upload`
- `POST /api/workflows/support-escalation`
- `POST /api/workflows/billing-event`
- `POST /api/workflows/review-approval/start`
- `POST /api/workflows/review-approval/:id/action`
- `GET /api/workflows/:id`

## Idempotency

Relevant start/action endpoints accept `idempotencyKey`.

The orchestration service stores tenant + workflow type + idempotency key + request hash. Replays with the same request return the existing workflow result. Replays with the same key but a different request are rejected with a conflict.

## Failure and retry model

- Every workflow failure is persisted on the workflow instance with a canonical failure category.
- Every step execution is persisted with its own status and error reference.
- Retry scheduling metadata is modeled through the step structure even though a background retry scheduler is not implemented yet.
- Optional downstream failures can mark workflows as `partially_completed` or leave them in a waiting state rather than losing visibility.

## n8n's role

n8n is used only as an executor for downstream automation steps. The platform remains the owner of:

- workflow instance state
- step history
- idempotency
- event history
- status queries

## Adding a new workflow

1. Define or extend the command/result DTOs.
2. Add a workflow service that extends `WorkflowOrchestrationService`.
3. Use `executeStep` for every named step that should be visible in workflow history.
4. Persist source refs returned by adapters.
5. Add a route handler and tests.

## What remains for later maturity

- background workers and scheduled retries
- richer task and notification persistence integration
- database-backed workflow store
- event subscribers for audit/notifications/search
- webhook-driven workflow progression and resumable waiting states
