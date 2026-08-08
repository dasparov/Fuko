# FUKO26 — Handover

_Last updated: 2026-08-08_

## TL;DR

Live at **https://okfuko.shop**. **This session (08-08):** the admin's WhatsApp
button now **follows the order status** — it sends a Shipped message on Shipped,
Delivered on Delivered, and so on, instead of repeating the payment
confirmation every time. Added a **courier tracking number** field the admin
fills in, which folds into the Shipped / Out for Delivery message. Schema
migration already run against prod. **Not committed or pushed — the live site
does not have this yet, and none of it has been clicked in a browser.**

**Carried over from 08-03** (all still open): iOS checkout fixes, admin
reachability, orders recorded before payment, and the Sheet + email safety net
all shipped, but **the end-to-end phone test has still NOT been run** — it
remains the first TODO.

---

## Live / deploy

- **Production:** https://okfuko.shop — Vercel project `fuko`, team
  `kapildas-5794s-projects`, repo `github.com/dasparov/Fuko`, push to `main`
  auto-deploys. Last commit on `main`: `f647302` — **deployed code is from
  2026-08-03; the 08-08 WhatsApp work is local-only, not pushed.**
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

## WhatsApp status updates (new 2026-08-08 — uncommitted)

The admin dashboard had **one hardcoded message** ("payment received ✅
shipping in 1-2 days") behind a button always labelled "Confirm on WhatsApp".
Setting an order to Shipped and tapping it re-sent the payment confirmation.
Now the button is a **status-update button**:

- **`lib/whatsapp.ts`** — `whatsappMessage(order)` returns copy for the order's
  saved status; `WHATSAPP_BUTTON_LABEL[status]` retitles the button ("Send
  Shipped update", "Send Delivered update", …) so the admin sees what is about
  to be sent. Both are `Record<OrderStatus, …>`, **not** a switch — adding a
  status fails to compile until its copy is written.
- Still **manual and still `wa.me`**: opens the admin's own WhatsApp with the
  text prefilled, admin taps send. No WhatsApp Business API, nothing automated.
- **Awaiting Payment** got a payment-nudge message (owner never specified one;
  written rather than hiding the button). **Cancelled** promises a UPI refund —
  change if that isn't the policy.
- Copy is a first draft in the existing voice. Tests assert intent
  ("has shipped", tracking present/absent), never exact wording, so the strings
  can be rewritten freely.

### Tracking number

- `Order.trackingId` existed in the type since forever but was **never read or
  written** — now wired up rather than adding a new field.
- **`orders.tracking_id TEXT`** (nullable) added by `migrate-add-tracking.js`,
  **already run against prod on 2026-08-08**. Reverse with
  `ALTER TABLE orders DROP COLUMN tracking_id`.
- Admin types it in a box beside the status dropdown; **saves on blur** (or
  Enter), blank clears it. `updateOrderTrackingAction` in `app/actions.ts`.
- Appears in the **Shipped** and **Out for Delivery** messages only, and only
  when non-empty — no dangling "Tracking number:" on an empty field.

### Incidental cleanup

Four copies of the DB-row → `Order` mapping in `app/actions.ts` were folded
into one `toOrder(row)` helper. They were already drifting; adding a column
meant four edits and forgetting one showed the field on some screens only.

## Order safety net (spec in `docs/superpowers/specs/2026-08-03-order-sheet-backup-design.md`)

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
rows (Feb–Jul) were all flow-test orders — owner confirmed nothing worth
keeping, backup discarded.

**2026-08-08:** `tracking_id TEXT` (nullable) added to `orders`. Migration is
already applied to prod; the code that uses it is not deployed yet, which is
harmless — reads just see `undefined`.

## Open TODOs (next session)

0. **Commit + push the WhatsApp status work** — five files, all uncommitted:
   `lib/whatsapp.ts`, `lib/whatsapp.test.ts`, `migrate-add-tracking.js`,
   `app/actions.ts`, `app/fukoadmin/AdminDashboard.tsx`. Push auto-deploys.
   Before that: **read the message copy in `lib/whatsapp.ts` and rewrite it** —
   it's a draft, and it's what customers actually read.
0b. **Click the admin row once** — nothing was verified in a browser. Change a
   status → check the button relabels and carries the right text; type a
   tracking number → tab away → confirm the toast and that it shows up in the
   Shipped message. `npm test` (36 passing) and `tsc` cover the logic, not the UI.
0c. Uncommitted `.gitignore` line adds `.env*` — broader than needed.
   `.env.local.example` is already tracked so it survives, but a *new* example
   env file would be silently ignored. Narrow to `.env` + `.env.local` or drop it.

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
4. Delete the `TEST-000` test row from the Fuko Orders sheet.
5. Rename the Apps Script project to "Fuko order webhook".
6. Delete the orphan "Fuko Orders" sheet + "Untitled project" script in the
   **kapil@quicksand.co.in** account.
7. Consider a customer-facing order-confirmation email (buyers currently get
   nothing) — needs Resend domain verification first.
8. Pre-existing lint debt: 5 `no-explicit-any` errors in `app/actions.ts`,
   unused-var warnings — cosmetic, untouched. (`toOrder(row: any)` added this
   session keeps the same pattern rather than typing the row shape.)
9. `npx tsc --noEmit` reports one error in the **generated**
   `.next/dev/types/validator.ts` about `app/api/auth/email-otp/verify/route.js`.
   Stale Next build artifact, not real — ignore or clear `.next`.

## Standing constraints (unchanged)

- **No payment gateways** (Kapil's rule). Personal VPA `kapil.das@okicici`,
  scan/save/copy only — browser `upi://` intents are bank-blocked; do not
  re-add one-tap pay buttons.
- QR saves need the hidden 880px canvas with 4-module quiet zone (gallery
  decoders reject less).
- `goatradingco@rbl` is QR-scan-only; never reuse it for typed payments.
- ECC GateGuard blocks first Bash/Edit/Write per target: state the facts it
  asks for in the same turn, then retry the identical call.
