# dev environment overview

## Environment role

- Classification: `shared_integration`
- Promotion status: `eligible_to_staging`

## Runtime characteristics

- Public app domain: `https://app-dev.<replace-domain>`
- Admin/control-plane surface: `https://app-dev.<replace-domain>/admin`
- Firebase project: `<replace-dev-firebase-project>`
- GCP project: `<replace-dev-gcp-project>`
- Firestore target: `(default) @ <replace-dev-firebase-project>`
- Monitoring destination: `<replace-dev-monitoring-workspace>`
- Logging destination: `<replace-dev-logging-sink>`

## Data policy

- Data posture: `synthetic_or_masked`
- Feature-flag posture: `fast_iteration_with_guardrails`

## Ownership and operations

- Deploy owners: see `./access-deploy-policy.md`
- Seed/bootstrap expectations: see `./bootstrap-seed-notes.md`
- Config contract: see `./config-contract.yaml`
