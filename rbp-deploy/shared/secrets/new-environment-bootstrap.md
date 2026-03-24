# New environment bootstrap (config + secrets)

Use this checklist when adding a new environment (for example `qa` or `perf`).

## 1) Create environment contract files

- Add `envs/<env>/overview.md`
- Add `envs/<env>/service-endpoints.yaml`
- Add `envs/<env>/config-contract.yaml`
- Add `envs/<env>/access-deploy-policy.md`
- Add `envs/<env>/bootstrap-seed-notes.md`

## 2) Provision non-secret config

- Domain and callback URLs
- Firebase/GCP project IDs
- Firestore target
- Storage bucket names
- Monitoring/logging destination refs

## 3) Provision secret manager paths

Create all required secret paths following naming standard:

`rbp/<env>/<service>/<SECRET_KEY>`

Populate required secrets from `shared/secrets/secrets-catalog.md`.

## 4) Wire CI/CD injection

- Grant deploy/runtime identities minimal read scope for `<env>` paths.
- Update pipeline environment mapping and validation checks.

## 5) Validate and promote readiness

- Run config-contract validation.
- Execute smoke checks for auth/session/integration reachability.
- Validate seeded tenant/workspace bootstrap.
- Record environment readiness sign-off.

## 6) Governance

- Add/update environment in `envs/environment-matrix.md`.
- Update approval model in `ACCESS_MODEL.md` if needed.
- Attach owner approvals and security review.
