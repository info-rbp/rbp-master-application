# Staging Setup (Wave 3)

## Required staging variables
- Firebase client and admin credentials
- `NEXT_PUBLIC_APP_URL` pointing to staging host
- `EMAIL_PROVIDER_API_KEY` + `EMAIL_FROM_ADDRESS`
- `ADMIN_ALERT_EMAIL`
- `SQUARE_ACCESS_TOKEN` (staging)
- `NEXT_PUBLIC_USE_FIREBASE_EMULATOR` as needed

## Staging validation
- Seed at least one admin role in `roles_admin`.
- Seed one active announcement and one notification.
- Verify analytics, audit logs, and email logs are writable.
