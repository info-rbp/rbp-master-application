# Wave 3 Rollback Plan

1. Revert application deployment to the previous successful build.
2. Revert Firestore rules to previous known-good ruleset.
3. Disable outbound email by clearing `EMAIL_PROVIDER_API_KEY` (service will fail gracefully and log skipped attempts).
4. Disable notification triggers by toggling feature flag (`FEATURE_NOTIFICATIONS_ENABLED=false`) if used.
5. If announcement issues occur, mark all announcement documents `active=false`.
6. If analytics write pressure occurs, temporarily disable analytics route writes in API handlers.
7. Run post-rollback smoke checks (public/member/admin login + portal load).
