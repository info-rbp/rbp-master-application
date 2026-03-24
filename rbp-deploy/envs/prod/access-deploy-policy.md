# prod access and deploy policy

## Deploy permissions

- Deploy restricted to release manager, platform SRE, incident commander (emergency only).

## Mutation permissions

- Mutations require owner + SRE + security where applicable.

## Approval requirements

- See `../../ACCESS_MODEL.md` and `../../OWNERSHIP.md`.
- Environment-specific change reviews must include env owner and platform SRE for shared envs.

## Promotion eligibility

- Terminal env; no upward promotion. Rollback only.
