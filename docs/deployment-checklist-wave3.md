# Wave 3 Deployment Checklist

1. Validate environment variables from `.env.example` are set in target environment.
2. Verify Firebase Auth providers and email verification settings.
3. Deploy Firestore rules (`firestore.rules`) and required indexes.
4. Verify `roles_admin` documents exist for all admin operators.
5. Configure email provider (`EMAIL_PROVIDER_API_KEY`, `EMAIL_FROM_ADDRESS`, `ADMIN_ALERT_EMAIL`).
6. Validate Square secrets/webhooks are configured (`SQUARE_ACCESS_TOKEN`).
7. Deploy app and run smoke checks:
   - public page
   - login flows
   - admin analytics page
   - notifications endpoints
8. Validate Firestore collections receive writes:
   - `notifications`, `announcements`, `analytics_events`, `audit_logs`, `content_revisions`, `membership_history`, `email_logs`.

- Review /admin/system/launch-readiness and resolve warnings before release cut.
