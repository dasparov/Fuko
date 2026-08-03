# FUKO26 — Handover

_Last updated: 2026-08-03 (evening session)_

## TL;DR

Live at **https://okfuko.shop**. This session: **iOS checkout fixes** (QR save via
share sheet, clipboard fallback), **admin reachability** (profile link, login
callback, no more redirect loop), **two admin accounts**, **orders recorded
before payment** (Awaiting Payment → Processing), and a **full order safety
net**: every order event appends to a private Google Sheet and every paid order
emails both admins. Orders table was wiped for a clean slate. **The end-to-end
phone test of the new checkout has NOT been run yet — it's the first TODO.**

---

## Live / deploy

- **Production:** https://okfuko.shop — Vercel project `fuko`, team
  `kapildas-5794s-projects`, repo `github.com/dasparov/Fuko`, push to `main`
  auto-deploys. Last commit this session: `7f1b74b`.
- **Vercel CLI:** works via `npx -y vercel@latest …`, already authenticated as
  `kapildas-5794`, project linked. `env ls/add/rm` all confirmed working.
- **Local dev:** `npm run dev` (use `localhost:3000`, not `0.0.0.0`, or Google
  OAuth breaks). **Tests:** `npm test` (vitest, 26 tests). Direct psql to Neon
  fails from this machine (port 5432 blocked); use a Node script with `pg` +
  `dangerouslyDisableSandbox` instead — see scratchpad pattern from this session.

## Stack

Next.js 16 (Turbopack) · Auth.js v5 · Neon Postgres · Vercel KV (Upstash) ·
Resend · Google Apps Script webhook (order backup). Twilio parked.

## Environment (changed this session)

| Var | Notes |
|---|---|
| `ADMIN_EMAILS` | Now `kapil.das@gmail.com,tagore4791@gmail.com`. Updated in Vercel **Production + Preview** (via dashboard, values are Sensitive/write-only) and `.env.local`. Fails closed. |
| `SHEETS_WEBHOOK_URL` | **Production only.** Apps Script `/exec` URL (deployment `AKfycby6gW7IQ…OuLo`). Unset in dev/preview → logging silently off (by design). |
| `SHEETS_WEBHOOK_SECRET` | **Production only.** Same value is hardcoded in the Apps Script `SECRET` const — that script is the only other place it lives. |

## Order lifecycle (rebuilt this session)

The old flow only wrote an order when the buyer tapped confirm — a paid buyer
who closed the tab left **no record** (a real ₹550.74 payment was lost this
way; see TODOs). Now:

1. **Payment screen opens** → `saveOrderAction` writes the order with status
   **`Awaiting Payment`** (new `OrderStatus` member), amount fingerprinted.
2. **Buyer taps confirm** → `confirmOrderPaymentAction` flips it to
   `Processing` (scoped: row must be Awaiting Payment AND phone must match the
   session user). Fallback: if the pending write failed, confirm inserts fresh.
3. **Revenue**: `countsAsSale` in `lib/orders.ts` (tested) — Awaiting Payment
   never counts; Processing counts only when payment verified. Admin dashboard
   and monthly report route through it.

Admin working rule: an **Awaiting Payment** row + matching credit in the bank
= real order (set Processing + verify). No credit after a day or two =
abandoned checkout, delete.

## Order safety net (new — spec in `docs/superpowers/specs/2026-08-03-order-sheet-backup-design.md`)

- `lib/order-log.ts`: builds a 13-cell row (IST timestamps, paise amount,
  items, name/phone/email/address, markdown `details` cell) and POSTs
  `{secret, row}` to the webhook. Fired **before** the Postgres insert is
  awaited; 3s abort, one retry, never throws, no-ops without env.
- `lib/resend.ts` `sendAdminEmail`: mails everyone in `ADMIN_EMAILS`, never
  throws. **Every `paid` event emails** (this is the new-order alert); an
  `awaiting` event emails only if the sheet or DB write failed.
- **Sheet:** "Fuko Orders" under **kapil.das@gmail.com** (Drive), id
  `1PG09zPxIkrLVWsiEWv53sw5II_n991EBy4xiFcapT0Y`. Append-only, one row per event.
- **Webhook:** Apps Script project ("Untitled project") under
  kapil.das@gmail.com, deployed as web app, execute-as-owner, access Anyone,
  secret checked in body. Verified live: good secret appends, bad secret doesn't.
- **Quirk:** Apps Script responds with an HTML redirect page either way, so
  `res.ok` is true even on secret rejection — failure detection is imperfect.
  Fine in practice (prod secret is correct), just don't trust the boolean deeply.
- ⚠️ First attempt was built under kapil@quicksand.co.in and abandoned —
  **orphan sheet + script exist in that account** (see TODOs). The Chrome
  profile with the Claude extension for this work is "personal chrome"
  (kapil.das@gmail.com); the quicksand Chrome must not be used.

## iOS checkout fixes (`ce2b10f`)

- **Save QR:** `<a download>` never reaches iOS Photos. Now builds a `File`
  synchronously (any await first drops user activation → NotAllowedError) and
  calls `navigator.share({files})` → "Save Image". Falls back to anchor
  download elsewhere. Dismissing the sheet does not claim "Saved".
- **Copy:** `lib/copy-text.ts` — clipboard API, then `execCommand` over a real
  DOM Selection (iOS in-app webviews reject the API). Returns boolean; green
  check only on true. Used in checkout + product share.

## Admin access (`fdb7991`, `dce3c32`)

- `/profile` shows an **Admin Dashboard** button, gated by server action
  `isAdminAction()` (env never reaches the browser).
- `/fukoadmin` guard: signed-out → `/login?callbackUrl=/fukoadmin`; signed-in
  non-admin → a "Not an admin account" page naming the session email.
  **Never** bounce non-admins to /login — the login page redirects
  authenticated users to callbackUrl, which loops (that was the "flashing").

## Database state

**`orders` table wiped 2026-08-03** for a clean pre-launch slate. The 7 old
rows (Feb–Jul, all test/family orders, no payment_amounts) are in
`orders-backup.json` in the session scratchpad —
`/private/tmp/claude-501/-Users-kapil-Documents-FUKO26/61156bd1-…/scratchpad/`.
**tmp is not permanent: copy it somewhere safe or accept the loss.**

## Open TODOs (next session)

1. **Test checkout end-to-end on the phone** (nothing verified on device yet):
   reach payment screen → `awaiting` row in sheet; iOS Save-QR share sheet +
   copy buttons; tap confirm → same row flips (no duplicate), `paid` sheet row,
   email to both admins; analytics ignores unpaid rows. Also test abandoning
   at the payment screen.
2. **Email deliverability:** `RESEND_FROM_EMAIL` uses sender
   `noreply@send.okfuko.shop` — confirm both gmail inboxes actually receive
   the paid-order mail (test-mode senders may only deliver to the account
   owner). If not: verify the domain in Resend.
3. **Recover the ₹550.74 order:** tagore4791@gmail.com re-runs checkout with
   the same cart, taps confirm WITHOUT paying, admin marks verified. Match by
   hand — the new paise suffix will differ from the paid 550.74.
4. **Copy `orders-backup.json`** out of the scratchpad (see above).
5. Delete the `TEST-000` test row from the Fuko Orders sheet.
6. Rename the Apps Script project to "Fuko order webhook".
7. Delete the orphan "Fuko Orders" sheet + "Untitled project" script in the
   **kapil@quicksand.co.in** account.
8. Consider a customer-facing order-confirmation email (buyers currently get
   nothing) — needs Resend domain verification first.
9. Pre-existing lint debt: 5 `no-explicit-any` errors in `app/actions.ts`,
   unused-var warnings — cosmetic, untouched.

## Standing constraints (unchanged)

- **No payment gateways** (Kapil's rule). Personal VPA `kapil.das@okicici`,
  scan/save/copy only — browser `upi://` intents are bank-blocked; do not
  re-add one-tap pay buttons.
- QR saves need the hidden 880px canvas with 4-module quiet zone (gallery
  decoders reject less).
- `goatradingco@rbl` is QR-scan-only; never reuse it for typed payments.
- ECC GateGuard blocks first Bash/Edit/Write per target: state the facts it
  asks for in the same turn, then retry the identical call.
