# Push — 19 Sep 2026

## 1. Run the migration FIRST (Supabase SQL editor, "No limit")
- `supabase/device_guard.sql` — new. Creates `account_devices`, `sign_in_events`,
  `users.device_limit`, and the RPCs. Idempotent. Expect four `1`s at the end.
- `supabase/verify_deployment.sql` — updated: now checks the eight device-guard objects.

## 2. Push these files to repo root
- `device-guard.js` **(new root file — must deploy; check its live URL returns 200)**
- `auth.js` — `signIn()` now enforces the device allowance (skippable with `skipDeviceGuard`)
- `app.jsx` — demo-account sign-in is exempt from the cap
- `styles.css` — mobile nav keeps a visible Sign in pill (earlier fix)
- `Haaraya Devices Admin.html` **(new page — staff only)**
- `Haaraya Home.html`, `Haaraya Login.html`, `Haaraya Registration.html`,
  `Haaraya Reviewer.html` — each gained `<script src="device-guard.js"></script>`

## 3. After the push
- Confirm Actions → "pages build and deployment" is green.
- Verify https://haaraya.github.io/haaraya-education/device-guard.js returns 200.
  (`_config.yml`: do NOT add bare folder names to `exclude:` — a bare entry would
  also catch root files starting with that name.)
- Sign in on two browsers, then a third and a fourth: the fourth should show
  "This account is already on 3 devices" with a Remove list.
- Open Haaraya Devices Admin.html as admin@haarayaeducation.org and confirm the
  report loads.

## How it works
- Each browser stores a random device id in localStorage; every sign-in registers it.
- Allowance scales with the family: one device for the grown-up plus one per
  reader on the account, floor 3, ceiling 8. Override per account with
  `admin_set_device_limit('email', n)` or the "Set allowance" button.
- Every sign-in attempt (allowed or refused) is logged with a coarse device label
  and the first hop of x-forwarded-for, so sharing is visible even under the cap.
- The guard never blocks on its own failure — if the RPC errors, sign-in proceeds.
