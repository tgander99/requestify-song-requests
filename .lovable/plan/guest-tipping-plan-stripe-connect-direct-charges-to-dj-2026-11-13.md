# Guest tipping plan (Stripe Connect, direct charges to DJ)

## Current state (checked)
- No Stripe code, packages, or tip tables exist in the app.
- No Stripe connection exists in the workspace, and built-in payments are not enabled. **Implementation is blocked until one of these is set up.**
- Built-in Lovable payments are not confirmed to support Stripe Connect payouts to each DJ's own account. Sending tips straight to each DJ needs the Connect setup below.

## What guests will see
- On each party's request page (`/e/<party-code>`), after the request form and on the "Request sent!" screen: a "Tip the DJ" card with £1 / £2 / £5 / custom (£1–£100).
- Payment opens Stripe's secure checkout page: card always, Apple Pay on Safari/iOS and Google Pay on Chrome/Android when the device supports them.
- Returns to the party page with "Thanks for the tip!" or "Payment cancelled". Song requests are unchanged; tipping is optional.
- Tip card only appears if that party's DJ has finished Stripe setup and can accept charges.

## What the DJ will see
- Dashboard "Tips" section: "Connect Stripe" button → Stripe-hosted onboarding (identity, bank account); status shows Not connected / Pending / Ready.
- Per-party list of paid tips (amount, time, guest note optional later).

## How money moves securely
1. Guest picks amount → server function checks the party exists and is open, the amount is a whole number of pence within limits, and the DJ's account is ready.
2. Server creates a Stripe Checkout session **on the DJ's connected account** (direct charge), GBP, no platform fee. The browser never sets the amount or destination account.
3. Stripe sends a signed webhook to a public endpoint; the server verifies the signature and marks the tip paid (idempotent by Stripe event/session ID). The success page never marks anything paid.
4. Stripe pays out to the DJ's bank on Stripe's schedule. Refunds/disputes are handled in the DJ's Stripe account.

## Database changes
- `dj_stripe_accounts`: DJ user, Stripe account ID, charges/payouts enabled flags, updated time. DJ can read own row; writes server-only.
- `tips`: party, Stripe session/payment ID (unique), amount in pence, currency, status (pending/paid/failed/refunded), timestamps. DJ reads tips for own parties only; guests have no access; writes server-only.
- `stripe_webhook_events`: processed event IDs (prevents double-processing).

## What you need to do (cannot be done by me here)
1. Create/connect a Stripe account and enable **Stripe Connect** (Standard accounts recommended — the DJ owns the account, platform never holds funds). Use this link to add a Stripe connection to the workspace: https://lovable.dev/connectors/stripe/connect?workspace=9ccd535cd5c233e0adff — or ask the Lovable editor chat whether built-in payments support Connect direct charges.
2. In Stripe test mode, enable Apple Pay/Google Pay and register the published domain for Apple Pay.
3. Add the webhook endpoint (I'll give the exact URL) in Stripe and save its signing secret as `STRIPE_WEBHOOK_SECRET` in Project Settings → Secrets (never paste it in chat). The Stripe secret key comes from the connection, or as `STRIPE_SECRET_KEY` if you use your own key.
4. Each DJ completes Stripe onboarding from the dashboard.

## Testing before claiming it works
- Automated: amount validation, party/owner checks, webhook signature rejection, duplicate-event handling, DJ A cannot see DJ B's tips.
- Manual in Stripe test mode: card tip, Apple Pay (real iPhone on published site), Google Pay, cancelled payment, test payout. Not "live" until these pass.

## Scope / risks
- In scope: tipping only. No subscriptions, vouchers, platform fees.
- Risks: Connect approval and DJ identity checks can take days — tight for 21 Nov; Apple Pay needs the published domain and cannot be tested in preview; Stripe charges its own processing fees to the DJ; refunds/chargebacks fall on the DJ.
- Existing request, cooldown, dashboard and party behaviour stays untouched (tip UI is additive).

## Technical details
- Server functions: `createTipCheckout` (public, Zod-validated), `startStripeOnboarding` / `getStripeStatus` (requireSupabaseAuth, owner-only).
- Webhook route: `src/routes/api/public/stripe-webhook.ts`, verifies `Stripe-Signature` with Web Crypto (Worker-compatible); handles `checkout.session.completed`, `checkout.session.async_payment_failed`, `account.updated`, `charge.refunded`.
- Calls Stripe via the connector gateway if connected that way, otherwise via fetch with `Stripe-Account` header; no Node-only SDK features.
