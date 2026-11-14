# Stripe Connect tipping: what Lovable's Stripe options can do

## What I found (from Lovable's official docs)
- **Built-in Stripe (the "Try Stripe" button, Lovable sets up the account for you):** The docs only cover checkout and ordinary payments into one Stripe account that Lovable creates for the app. They say nothing about Stripe Connect Express, signing up DJs, direct charges or transfers to DJs. The docs don't say Connect is impossible, but they don't say it's supported either. You can later link this account to an existing Stripe account when you claim it, but that doesn't give you your own platform key.
- **"Connect your own Stripe account" (you supply your own secret key):** This is a separate option. A project uses one option or the other, never both. Its docs cover checkout, subscriptions and the customer portal. Connect isn't mentioned.
- **Conclusion:** No Lovable Stripe option is documented to support Connect Express, signing up each DJ, or direct charges to a DJ. "Try Stripe" is the wrong choice for tips that go straight to each DJ, because tips would land in the account Lovable creates, not with the DJ.

## Recommended setup
1. Use **your own Stripe account as the platform**, with Connect turned on (Express accounts, test mode first). Apply for Connect in your Stripe account. Approval can take days.
2. Save your Stripe test secret key, and later the webhook signing secret, as secrets in Project Settings → Secrets (suggested names: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`). Never paste them in chat. Don't click "Try Stripe" in this project, since it would block the own-key route.
3. Then build, all of it server-side:
   - DJ: a "Set up payouts" button on the dashboard. It creates a Stripe Express account and sends the DJ to Stripe's sign-up page. The DJ's account ID and ready status are saved against the DJ.
   - Guest: a Tip button on `/e/<party-code>` offering £1, £2, £5 or a custom amount. The server takes the DJ's account from the party, not from the guest's browser, and charges directly on that DJ's account with no platform fee. Card and Apple/Google Pay go through Stripe's own payment form.
   - A tips record is marked paid only when a signed Stripe notification arrives, and repeat notifications are ignored. Each DJ sees only their own party's tips.
4. Check end to end with Stripe test cards and a test payout before calling anything live.

## Risks and blockers
- Building on your own key isn't a Lovable-documented path for Connect. It should work, but Lovable doesn't confirm it.
- Stripe's Connect approval and DJ identity checks are outside our control. That makes 21 November tight.
- Only the first account is a DJ today. More DJs need a separate change to who gets DJ access.

## Next step
Approve this plan only once you've saved your Stripe test key in Secrets and Connect is on. Nothing has been changed, set up or published.
