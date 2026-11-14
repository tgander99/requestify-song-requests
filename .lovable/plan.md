# Connecting your existing Stripe account (research only)

## Two different Lovable options
- **"Try Stripe" (built-in payments):** Lovable creates and runs a Stripe account for the app. You don't use your own key. Don't use this option, because tips would go into Lovable's account rather than to each DJ.
- **"Connect your own Stripe account":** You give Lovable a key from your existing Stripe account through a secure form. A project uses one option or the other, never both.

## Exact steps to connect your existing account securely
1. In Stripe, turn on **Test mode** and go to **Developers → API keys**. Create a **restricted key** (starts `rk_test_`) with only the access needed. A test secret key (`sk_test_`) also works. A publishable key (`pk_`) is rejected.
2. In the **normal Lovable editor chat** (not this session), say you want to use **your own Stripe account**, not built-in payments.
3. Lovable shows a **Connect Stripe** form. Paste the key into **Stripe restricted API key** and click **Submit**. Lovable checks the key and saves it as a hidden secret. Never paste it in chat.

## Does the own-account option cover Stripe Connect?
- **No, it doesn't say it does.** The docs cover one-time checkout, subscriptions, products/prices and the customer portal. Stripe Connect, Express accounts, signing up DJs, direct charges and payouts to DJs aren't mentioned. Lovable doesn't say Connect is blocked, but doesn't say it's supported either.
- The docs give no list of key permissions. For Connect, the key will also need access to connected accounts, account sign-up links, payments and webhook events.
- **So DJ tipping has to be built custom** on top of your connected key:
  - a "Set up payouts" page where each DJ signs up with Stripe
  - direct charges on that DJ's account, where the server picks the DJ from the party
  - signed Stripe notifications to confirm each tip
- Your Stripe account must also have **Connect enabled** (in the Stripe dashboard under Connect). Stripe may take days to review it.

## Next step
Connect the test key using the steps above, and turn on Connect in Stripe. Then approve the build, and I'll confirm the key works with a harmless test call before writing any tipping code. Nothing has been changed or published.
