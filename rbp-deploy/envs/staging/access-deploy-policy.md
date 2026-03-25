# staging access and deploy policy

## Deploy permissions

- Deploy restricted to release managers + platform SRE.

## Mutation permissions

- Mutations via PR with owner + SRE approval.

## Approval requirements

- See `../../ACCESS_MODEL.md` and `../../OWNERSHIP.md`.
- Environment-specific change reviews must include env owner and platform SRE for shared envs.

## Promotion eligibility

- Promotable to prod only after staging validation + sign-off.
