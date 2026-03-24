# dev access and deploy policy

## Deploy permissions

- Platform/app teams can deploy after PR checks.

## Mutation permissions

- Mutations allowed for service owners + platform SRE.

## Approval requirements

- See `../../ACCESS_MODEL.md` and `../../OWNERSHIP.md`.
- Environment-specific change reviews must include env owner and platform SRE for shared envs.

## Promotion eligibility

- Promotable to staging when integration checks pass.
