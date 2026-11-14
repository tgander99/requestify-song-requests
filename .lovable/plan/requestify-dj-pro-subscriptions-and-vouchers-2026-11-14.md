# Requestify DJ Pro: subscriptions and vouchers

Guest tipping is dropped. Guests stay free and never need an account. DJs pay for "DJ Pro": a 14-day free trial, then £5.99 a month. Friends can get free lifetime access with a voucher.

## Which Stripe option to use
- **Recommended: Lovable's built-in Stripe payments ("Try Stripe").** We no longer need Stripe Connect, so the one gap that ruled it out is gone. According to Lovable's docs, it supports:
  - subscriptions with free trials
  - Stripe's own self-service billing page, where DJs can see invoices, change their payment method and cancel
  - test mode in the preview, plus automatic payment notifications to the app
- **Prerequisites you need to know about:**
  - It needs a **Lovable Pro plan or higher**. That conflicts with "free tiers only", so please confirm that's acceptable.
  - It can only be turned on from the **normal Lovable editor chat**. Say "add payments", accept the **Enable payments** dialog and finish Stripe's account setup. No keys go in chat.
- **Alternative:** connect your own Stripe account through Lovable's secure **Connect Stripe** form, using a restricted test key. This also supports subscriptions and the billing page, but means more work to set up and test.

## Payment methods: what's actually supported
- **Cards:** yes.
- **Apple Pay and Google Pay:** yes, once switched on in your Stripe dashboard. Apple Pay also needs your website domain registered with Stripe. They show up at checkout automatically.
- **UK Bacs Direct Debit:** not confirmed for Lovable's integration. Stripe itself only offers it to approved UK accounts, after Stripe reviews them, and payments take about 3 working days to clear. So treat it as optional and check it later, not a launch promise.

## What DJs see (on the dashboard, on a new "Plan" page)
- A status badge: **Trial**, **Active**, **Payment problem** (a 7-day grace period), **Cancelled**, **Expired**, or **Lifetime (voucher)**.
- The trial end date or next payment date.
- A **Manage billing** button that opens Stripe's billing page, which has invoices, payment method and cancel. It opens in a new tab and won't work inside the preview panel.
- A **Redeem voucher** box.

## Vouchers (for the app owner only)
- On an owner-only Vouchers page you can create a code, with a maximum number of redemptions and an optional expiry date.
- You can revoke a code at any time and see each redemption (who and when).
- Redeeming is checked by the server in one step: the code must be valid, not expired, not revoked and under its limit, and each DJ can use only one.
- A redeemed voucher gives lifetime Pro with no card needed.

## How Pro access is enforced
- The server decides who has access, never the browser. Access is allowed for **Trial, Active, Lifetime**, and **Payment problem** while the grace period lasts.
- When access lapses, the DJ is **blocked from creating new parties** and from managing their queue. They see a clear "Renew to continue" message.
- **Guest request pages always keep working**, so a party in progress never breaks for guests. The DJ just needs to renew to see the queue.
- Subscription status changes only when Stripe sends a signed payment notification. The browser can't set it.

## Who counts as a DJ (needed for paying DJs)
- Today only the first account ever made becomes a DJ. For subscriptions to work, every new sign-up must be able to become a DJ and start their own trial. That account stays the **owner** and gets the voucher pages.
- Each DJ can already only see their own parties and requests. That stays the same.

## Phases, in the lowest-credit order
1. **You, outside this chat:** confirm the Lovable Pro plan. Then in the editor chat, enable built-in Stripe payments in test mode. Nothing is built until this is done.
2. **Data and access (one change):** let any sign-up become a DJ, add subscription and voucher records, and add server-side Pro checks on creating parties and managing queues. Existing parties carry on unchanged.
3. **Checkout and notifications:** set up the £5.99 monthly plan with the 14-day trial, a **Start trial** button, and record status from Stripe's notifications.
4. **Plan page:** status badge, dates, **Manage billing**, and blocked or grace messages.
5. **Vouchers:** owner pages to create, revoke and view codes, plus the DJ's **Redeem voucher** box.
6. **Testing in test mode:** start a trial, a successful payment, a failed payment leading to grace then blocked, cancel, voucher limit and expiry, and confirm guest pages still work. Nothing is called live until these pass and Stripe's notifications are confirmed.

Nothing is published at any stage. The live app stays as it is.

## Technical details
- New tables:
  - `dj_subscriptions` (user_id, stripe customer and subscription IDs, status, trial_end, current_period_end, grace_until)
  - `vouchers` (code hash, max_redemptions, expires_at, revoked_at)
  - `voucher_redemptions` (voucher_id, user_id unique, redeemed_at)
- Each new table comes with the required access grants and row rules: DJs read only their own row, and only the owner can manage vouchers. Webhook and redemption writes run server-side with full privileges.
- Roles: add a `dj` role assigned on sign-up. The existing `admin` role stays the platform owner. Existing data is moved over so the current owner keeps their parties.
- `has_pro_access(uid)` is a protected database check, used in the event insert rule and in server functions for queue changes. The guest `submit_event_song_request` path is not gated.
- Payment notifications arrive through the built-in integration's webhook route, which verifies signatures and safely ignores repeats.
