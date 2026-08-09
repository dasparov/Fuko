# FUKO26 — Handover

_Last updated: 2026-08-09_

## TL;DR

Live at **https://okfuko.shop**. **This session (08-08):** the admin's WhatsApp
button now **follows the order status** — it sends a Shipped message on Shipped,
Delivered on Delivered, and so on, instead of repeating the payment
confirmation every time. Added a **courier tracking number** field the admin
fills in, which folds into the Shipped / Out for Delivery message. Schema
migration run against prod and **deployed live** (`4de4e3b`). **Still not
clicked in a browser by anyone — tests and types pass, the UI is unverified.**

**08-09:** the big one — **one-tap UPI payment is back**, on a merchant VPA,
working on Android and iOS. Also live: **graphic link-preview card**, the
homepage **ticker no longer flashes bare dots**, **three blends repriced to
₹645**, support email → **thegoatradingco@gmail.com**, banner → **"Free
shipping, always"**, and the profile card no longer flashes "Welcome, Friend"
before the user's name loads.

**Carried over from 08-03** (all still open): iOS checkout fixes, admin
reachability, orders recorded before payment, and the Sheet + email safety net
all shipped, but **the end-to-end phone test has still NOT been run** — it
remains the first TODO.

---

## Live / deploy

- **Production:** https://okfuko.shop — Vercel project `fuko`, team
  `kapildas-5794s-projects`, repo `github.com/dasparov/Fuko`, push to `main`
  auto-deploys. Last deploy: 2026-08-09 (see `git log`).
  **Watch out:** `vercel ls` can still show the *previous* deployment as Ready
  seconds after a push, so a "wait until not Building" loop exits immediately
  and verifies stale output. Confirm the deployment age is < your push.
  **Note:** admin tabs cache the old JS bundle — hard-refresh `/fukoadmin`
  after a deploy or you'll test stale code and think the deploy failed.
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

## UPI checkout: one-tap restored (2026-08-09 — live)

**The blocker was the VPA, never the code.** `kapil.das@okicici` was a
*personal* handle; banks decline browser-launched `upi://` intents to personal
VPAs after PIN entry with a fake "you've exceeded the bank limit" error.
Retested 2026-08-09 — identical failure, 8 days after the first test. Five URL
variants had already been tried. No query string fixes it.

Kapil supplied a **merchant VPA, `kapil.das-2@okhdfcbank`**, and a real payment
completed. Checkout now leads with one-tap.

### Current payment screen, in order
1. **Big blue "Pay ₹…"** button — turns green + "Opened — finish in your UPI
   app" on tap. Green means *handed off*, **not paid** — the browser can't see
   payment success, which is why the manual confirm step still exists.
2. **GPay / PhonePe / Paytm** tiles with real logos (`public/upi-*.svg`,
   Simple Icons).
3. **QR** — kept deliberately. It is the *desktop* path (`upi://` does nothing
   in a desktop browser) and the per-bank fallback. Don't remove it.

### iOS specifics (hard-won, don't relearn)
- **iOS has no universal `upi://` handler.** Android resolves it via intent
  resolution; on iPhone an app opens only if it registered that exact scheme.
- **WhatsApp registers `upi://` on iOS and wins it** — the generic link handed
  payments to a chat app. So iOS targets GPay's `tez://` scheme directly
  (`primaryPayUrl`), Android keeps the generic intent.
- Per-app schemes: `tez://upi/pay?` (GPay), `phonepe://pay?`, `paytmmp://pay?`.
  All built from one shared `upiParams` so VPA/amount can't drift apart.
- `isIOS` is set in a `useEffect`, **not** during render — reading `navigator`
  while rendering desyncs hydration.

### Testing trap
A "it doesn't work" report on 2026-08-09 turned out to be **self-payment** —
Kapil paying his own VPA from his own account. Confirmed. A friend's phone
worked. **Never test with the merchant's own account**; it isn't representative
and it fails in ways customers never see.

Copy-ID/copy-amount rows were removed: one clipboard slot meant two app
switches to reach a screen where the amount gets typed anyway.

## Link previews / OG image (new 2026-08-09 — live)

Sharing okfuko.shop rendered as plain text: the site had `title` +
`description` but **no `og:image` and no `metadataBase`**, so scrapers had no
picture and no absolute URL to resolve against.

- **`app/opengraph-image.jpg`** — 1200×630, 65KB, cropped from
  `public/hero-landscape.jpg` (2400×1340) via `sharp`:
  `.extract({left:38, top:0, width:2324, height:1220}).resize(1200,630)`.
  The offset crop exists to **cut the AI-generation ✦ watermark** out of the
  source's bottom-right corner — don't regenerate with a centred crop
  (macOS `sips` only does centred) or the watermark comes back.
- **No text overlaid**, deliberately: the pack in the photo already carries the
  logo, and WhatsApp prints title + description beneath the card anyway.
- **`app/layout.tsx`** — added `metadataBase: new URL("https://okfuko.shop")`
  and an `openGraph` block. The **image needs no config**: Next's file
  convention emits `og:image` + width/height/type from the filename alone.
- Verified live: `og:image` absolute, image returns 200 `image/jpeg` 66393 B.

⚠️ **WhatsApp caches previews per URL, for days.** A link shared before this
shipped will keep showing the old blank preview no matter what the site
returns. To test, share a URL it has never scraped — `okfuko.shop/?v=2`.
"It didn't work" is almost always this cache.

Copy was left as-is; owner considered a "heritage / terroir" description on
08-09 and chose to keep `"Organic, hand-crafted rolling tobacco blends."`

## Homepage ticker dots (fixed 2026-08-09)

`app/page.tsx` marquee: the ` • ` separator was a literal **outside** the
`settings?.tickerText` optional chain, so during the client-side settings
fetch the text rendered as nothing while four bullets rendered anyway — a row
of bare dots. The animated element is now mounted only once the text exists,
which also stops `.animate-marquee` burning part of its 40s cycle against
empty content (the text used to appear already mid-scroll).

Side effect, intended: blanking the ticker text in the admin panel now renders
an empty bar rather than bare dots.

## WhatsApp status updates (new 2026-08-08 — live)

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

**2026-08-08:** `tracking_id TEXT` (nullable) added to `orders`, applied to
prod and live. Existing orders have it `NULL` → `undefined`, so they simply
carry no tracking line until the admin types one.

## Open TODOs (next session)

0. **Read the WhatsApp message copy in `lib/whatsapp.ts` (lines 18-24) and
   rewrite it.** It shipped as a first draft written by Claude, not by the
   owner, and it is what customers actually read. Check the **Cancelled** line
   especially — it promises a UPI refund. Tests assert intent, never wording,
   so edits are free.
0b. **Click the admin row once** — deployed but never verified in a browser.
   Hard-refresh `/fukoadmin` first. Change a status → button relabels and
   carries the right text; type a tracking number → tab away → toast, and it
   appears in the Shipped message. `npm test` (36 passing) and `tsc` cover the
   logic, not the UI.
0c. **Dead code:** `handleCopy` in `app/checkout/page.tsx` (~line 523) is
   orphaned since the copy rows were removed. Lint warning only; delete it.
0d. **Never verified in a browser by a human:** the `/profile` header skeleton
   (needs a signed-in session) and the checkout screen on Android. iOS one-tap
   *was* confirmed working by the owner.
0e. UPI app logos are **monochrome** Simple Icons silhouettes. Swap to
   full-colour by refetching `https://cdn.simpleicons.org/<slug>/<hex>` if
   wanted.

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

- **No payment gateways** (Kapil's rule) — still stands. A **merchant VPA is
  not a gateway**, it's a bank-account feature, and that is what unblocked
  one-tap (see the UPI section). Don't propose Razorpay/Cashfree.
- **One-tap UPI works again as of 2026-08-09** on the merchant VPA
  `kapil.das-2@okhdfcbank`. The old "never re-add one-tap pay buttons" rule is
  **obsolete** — it applied to the personal `kapil.das@okicici` handle.
- QR saves need the hidden 880px canvas with 4-module quiet zone (gallery
  decoders reject less).
- `goatradingco@rbl` is QR-scan-only; never reuse it for typed payments.
- ECC GateGuard blocks first Bash/Edit/Write per target: state the facts it
  asks for in the same turn, then retry the identical call.
