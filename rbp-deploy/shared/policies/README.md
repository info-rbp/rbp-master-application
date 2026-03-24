# Shared policy conventions

## Policy types

- Access policy (who may change what)
- Deployment policy (promotion and approval gates)
- Security policy (secrets, auth, network)
- Incident policy (freeze, rollback, communication)

## Baseline controls

- PR-only mutation model
- mandatory reviews for protected paths
- production approval gates
- audit linkage between PR, pipeline run, and release

## Recommended Step 3 additions

- CODEOWNERS for path-based approvals
- policy-as-code checks for env parity and secret reference validation
- policy checks in PR validation pipeline


## Step 4 structured contract

- `config-contract.yaml` defines machine-friendly validation groups, key requirements, secret contract, and ownership metadata.
