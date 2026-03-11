# Wave 3 UAT Checklist

## Public flow
- Open `/` and verify hero/services/content loads.
- Submit `/contact` form and verify success toast.
- Confirm `contact_enquiries` document is created with `source`.

## Member flow
- Sign up via `/signup` and verify account is created.
- Log in via `/login` and confirm redirect to `/portal`.
- Confirm member notification center loads and can mark notifications read.
- Confirm member announcement banners render and dismiss behavior works.

## Admin flow
- Log in at `/admin/login` with admin role user.
- Confirm dashboard summary cards render.
- Open `/admin/analytics`, `/admin/announcements`, `/admin/notifications`, `/admin/audit-logs`.
- Create, toggle, and delete an announcement.

## Membership & billing flow
- Start checkout from membership subscribe flow.
- Confirm `membership_checkout_started` event exists.
- Validate expected Stripe checkout redirect.

## Notifications flow
- Trigger contact form submission.
- Confirm admin receives in-app alert.
- Confirm email attempt appears in `email_logs`.

## Analytics validation
- Verify events are written for signup/login/contact/checkout.
- Validate analytics dashboard cards and resource usage lists render without runtime errors.
