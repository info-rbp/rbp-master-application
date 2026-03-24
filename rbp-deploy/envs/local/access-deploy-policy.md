# local access and deploy policy

## Deploy permissions

- Local developer access only; no shared deployment rights.

## Mutation permissions

- Local-only mutation by developer workstation.

## Approval requirements

- See `../../ACCESS_MODEL.md` and `../../OWNERSHIP.md`.
- Environment-specific change reviews must include env owner and platform SRE for shared envs.

## Promotion eligibility

- No promotion. Local artifacts must be rebuilt in dev pipeline before shared use.
