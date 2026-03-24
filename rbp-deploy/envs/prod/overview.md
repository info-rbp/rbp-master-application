# prod environment overview

## Environment role

- Classification: `production`
- Promotion status: `terminal_environment`

## Runtime characteristics

- Public app domain: `https://app.<replace-domain>`
- Admin/control-plane surface: `https://app.<replace-domain>/admin`
- Firebase project: `<replace-prod-firebase-project>`
- GCP project: `<replace-prod-gcp-project>`
- Firestore target: `(default) @ <replace-prod-firebase-project>`
- Monitoring destination: `<replace-prod-monitoring-workspace>`
- Logging destination: `<replace-prod-logging-sink>`

## Data policy

- Data posture: `production_live_data`
- Feature-flag posture: `controlled_changes_only`

## Ownership and operations

- Deploy owners: see `./access-deploy-policy.md`
- Seed/bootstrap expectations: see `./bootstrap-seed-notes.md`
- Config contract: see `./config-contract.yaml`
