# Runbook: emergency production freeze

## Trigger

Critical incident requiring immediate halt of production changes.

## Actions

1. Disable production deploy pipeline triggers.
2. Announce freeze in incident channel and engineering channels.
3. Restrict repo merge rights for prod-impacting paths.
4. Allow only approved rollback/fix changes tied to incident ID.

## Exit criteria

- incident commander, SRE lead, and service owner jointly approve freeze lift
- post-incident review scheduled
