# Beauty Meet — QA Checklist (Hybrid marketplace + pro software)

This checklist is meant to be run:
- before deploying to production
- after major feature changes
- on a schedule (weekly)

## 0) Quick automated checks (run first)

### Link integrity (public, same-origin)
- [ ] `BASE_URL=https://beautymeetapp.com npm run check:links`

### Build + typecheck
- [ ] `npm run build`

### E2E smoke tests (Playwright)
- [ ] `BASE_URL=https://beautymeetapp.com npx playwright test`

> Note: Some tests require production to have at least 1 provider with at least 1 active service in the searched ZIP.

---

## 1) Customer QA

### Discovery
- [ ] Homepage loads and primary CTAs visible
- [ ] Hero search (ZIP + category) works and navigates to `/book?zip=...`
- [ ] `/book` search returns results for known-supply ZIPs
- [ ] Provider cards show name, mode, distance, services list

### Booking funnel
- [ ] `/p/:providerId` loads provider + services
- [ ] Intake questions show per-service and required validation works
- [ ] Mobile toggle affects travel fee estimate (if implemented)
- [ ] Booking submit succeeds and returns Stripe Checkout URL

### Payments
- [ ] Stripe Checkout session created successfully
- [ ] Success & cancel pages render (`/book/success`, `/book/cancel`)

### Account / session (if applicable)
- [ ] Customer login works (if customer accounts exist)
- [ ] Customer can view upcoming/past appointments (route & UI)

---

## 2) Tech (Provider) QA

### Application
- [ ] `/tech/apply` submits successfully
- [ ] Admin can view application in `/admin`
- [ ] Admin approve creates provider account with access token

### Dashboard
- [ ] `/tech/:token` loads
- [ ] Provider can set mode (FIXED / MOBILE / BOTH)
- [ ] Provider can add service (name, category, duration, price)
- [ ] Provider can activate/deactivate service
- [ ] Provider can configure intake questions per service

### Booking management
- [ ] Provider sees new booking requests
- [ ] Approve/Decline works
- [ ] Confirm/done/cancel flows work as designed

### Stripe Connect
- [ ] Tech can start onboarding from dashboard
- [ ] Dashboard clearly indicates restricted vs enabled
- [ ] Booking payments: 
  - [ ] If transfers enabled → uses destination transfer + application fee
  - [ ] If not enabled → graceful fallback or clear error (decide policy)

---

## 3) Affiliate QA

### Registration + login
- [ ] `/affiliate/register` creates account
- [ ] Login works
- [ ] `/affiliate/dashboard` loads

### Attribution
- [ ] Affiliate referral code validates (`/api/affiliate/validate`)
- [ ] First-time booking records affiliate attribution
- [ ] Commission reporting is correct

---

## 4) Admin QA
- [ ] Login as admin works
- [ ] Applications list loads
- [ ] Approve creates provider, reject marks declined
- [ ] Ability to inspect bookings/payments

---

## 5) Monitoring / “things that should never break”
- [ ] Stripe API keys present in environment
- [ ] Twilio is optional or installed (build should not fail)
- [ ] Rate limiting / abuse protection on application endpoints
- [ ] No PII leaks on public pages

---

## Stripe readiness checklist (before switching to LIVE)
- [ ] STRIPE_SECRET_KEY is correct (no placeholders), and matches intended mode (test vs live)
- [ ] STRIPE_WEBHOOK_SECRET configured in prod
- [ ] Webhook endpoint verifies signature and is **idempotent** (dedupe Stripe event IDs)
- [ ] Checkout sessions include `setup_future_usage=off_session` so remainder can be charged
- [ ] Deposit-only policy confirmed (25% deposit) + customer messaging updated
- [ ] Remainder charge flow:
  - [ ] Saved customer + payment method stored after deposit payment
  - [ ] Tech marks complete + customer confirm works
  - [ ] Auto-charge remainder after 12h if no issue reported
  - [ ] If issue reported → remainder charge paused + support notified
- [ ] Refund paths tested:
  - [ ] Customer cancel early → deposit refunded
  - [ ] Late cancel/no-show → deposit retained
  - [ ] Tech cancel/decline → deposit refunded
- [ ] Stripe Connect tested (if using destination charges):
  - [ ] Connected account onboarding works
  - [ ] Destination charges succeed
  - [ ] Application fees match policy
- [ ] Admin visibility: can inspect a booking + its payments + Stripe ids
