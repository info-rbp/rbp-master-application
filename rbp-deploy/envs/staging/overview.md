# staging environment overview

## Environment role

- Classification: `pre_production`
- Promotion status: `eligible_to_prod`

## Runtime characteristics

- Public app domain: `https://app-stg.<replace-domain>`
- Admin/control-plane surface: `https://app-stg.<replace-domain>/admin`
- Firebase project: `<replace-stg-firebase-project>`
- GCP project: `<replace-stg-gcp-project>`
- Firestore target: `(default) @ <replace-stg-firebase-project>`
- Monitoring destination: `<replace-stg-monitoring-workspace>`
- Logging destination: `<replace-stg-logging-sink>`

## Data policy

- Data posture: `masked_production_like`
- Feature-flag posture: `release_candidate_profile`

## Ownership and operations

- Deploy owners: see `./access-deploy-policy.md`
- Seed/bootstrap expectations: see `./bootstrap-seed-notes.md`
- Config contract: see `./config-contract.yaml`
