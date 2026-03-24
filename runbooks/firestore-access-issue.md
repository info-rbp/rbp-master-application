# Firestore Access Issue Runbook

## Purpose
Diagnose and resolve Firestore permission/connectivity failures affecting runtime and admin flows.

## Symptoms / Trigger Conditions
- `/api/health/runtime` reports firestore `fail`.
- Auth/session or admin operations fail with Firestore permission errors.

## Prerequisites
- Access to runtime logs and Firebase/GCP IAM config.

## Required Access / Roles
- Platform engineer
- GCP IAM admin (as-needed)

## Exact Steps
1. Confirm failure via:
   - `GET /api/health/runtime`
   - deployment smoke output.
2. Check deployed project ID and credentials (`FIREBASE_PROJECT_ID`, service account path).
3. Validate IAM/service account roles for Firestore access.
4. Validate environment secrets and credential formatting (private key newline handling).
5. If recently changed, roll back secret/config to last known good.
6. Re-run smoke tests.

## Verification Steps
- Runtime endpoint reports firestore `pass`.
- Affected APIs recover.

## Rollback / Escalation Path
- Roll back deploy/config if issue persists.
- Escalate to GCP platform team for IAM/policy restrictions.

## Related Systems
- Firebase Admin SDK
- Firestore
- GitHub environments

## Related Secrets / Config
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `GOOGLE_APPLICATION_CREDENTIALS`

## Who to Notify
- Platform on-call
- GCP owner

## Links to Adjacent Runbooks / Docs
- `runbooks/secret-setup.md`
- `runbooks/rollback.md`
- `docs/deployment/post-deploy-verification.md`
