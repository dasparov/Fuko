# FUKO26 — Handover

_Last updated: 2026-07-27 (evening session)_

## TL;DR

Live at **https://okfuko.shop**. This session shipped: **server-side admin auth**, **paise-fingerprint UPI payment matching + WhatsApp order confirmation**, a **new product (Terracotta Button)**, a full **photography program** (packshots + AI travelogue frames, watermark-free), and a **home-page redesign** (animated archive index + About record over a ghosted Goa engraving). Everything below is deployed and verified except the items in **Open TODOs**.

---

## Live / deploy

- **Production:** https://okfuko.shop (canonical) — also `fuko-sigma.vercel.app`.
- **Deploy:** push to `main` → Vercel auto-deploys (project `fuko`, team `kapildas-5794s-projects`). Repo: `github.com/dasparov/Fuko`.
- **Vercel CLI:** authenticated in this environment via `npx vercel` (project linked, `.vercel/` present). `npx vercel env ls`, `npx vercel inspect <url> --wait` work.
- **Local dev:** `npm run dev` (open via `localhost:3000`, not `0.0.0.0`, or Google OAuth breaks).
- **Tests:** `npm test` (vitest, 18 tests). **Build:** `npm run build`.

## Stack

Next.js 16 (Turbopack) · Auth.js v5 · Neon Postgres (`@vercel/postgres` + `pg`) · Vercel KV = Upstash (`fuko-kv`) · Resend. Twilio parked.

## Environment

All previous vars unchanged (see git history for the old table). Added this session:

| Var | Value / notes |
|---|---|
| `ADMIN_EMAILS` | `kapil.das@gmail.com` — comma-separated allowlist. Set in **Vercel Production + Preview** and `.env.local`. **Fails closed**: unset = nobody is admin. |

## Auth + data model

- Google Sign-In + email-OTP (Auth.js v5, JWT). One `users` row per email. Orders keyed by `customer_phone`; profile by `users.id`. (Unchanged from the auth migration — see git history for details.)
- **`orders.payment_amount`** (NUMERIC, nullable, added): the exact UPI amount requested (total + unique paise suffix).
- **`products.sort_order`** (INT, default 100, added): display order. Queries `ORDER BY sort_order, id`; new products land at the end.

## Admin — now actually secured

- `lib/admin.ts` `isAdmin()`: session email vs `ADMIN_EMAILS` (case-insensitive, fails closed). Tests in `lib/admin.test.ts`.
- All 8 admin server actions in `app/actions.ts` gated (settings save, orders list/status/delete/verify, admin products list/save/delete) — non-admins get `false`/`[]`.
- `/fukoadmin` is a server component (`app/fukoadmin/page.tsx`) that redirects non-admins to `/login`; the client UI lives in `AdminDashboard.tsx`. The old client-side PIN (`2026`) is still in there — redundant now, optional cleanup.

## Payments — paise fingerprint + WhatsApp

- Checkout adds a random **1–99 paise suffix** to the UPI amount (e.g. ₹550 → ₹550.83), embedded in QR + deep links + shown to the customer, saved as `payment_amount`. **Matching a GPay-feed entry to an order is an exact-amount lookup** — no screenshot needed. Verified end-to-end in prod (test order ORD-8389, since deleted).
- Admin order cards show the exact amount and a **"Confirm on WhatsApp"** button — `wa.me` link prefilled with order summary (10-digit numbers get `91` prefixed). The thread doubles as the payment-proof channel; screenshot upload remains optional.
- Twilio WhatsApp API deliberately not used (WABA onboarding + fees overkill at current volume).

## Products (4, in display order)

| # | Product | Price | Gallery (in order) |
|---|---|---|---|
| 1 | Light Soils Blend | ₹550 | `/light-soils-pack3.jpg` (subway packshot, bottom-anchored crop) · `/light-soils-dawn2.jpg` (Chamundi dawn) · `/light-soils-road.jpg` (rickshaw road sunrise) |
| 2 | Turkish Blend | ₹600 | `/turkish-pack2.jpg` (mailbox packshot) · `/turkish-dusk2.jpg` (chai-stop bulb) · `/turkish-wall3.jpg` (wall detail) |
| 3 | Dark Soils Blend | ₹580 | `/dark-soils-band2.jpg` (band practice, AI) · `/dark-soils-river2.jpg` (Godavari bridge) · `/dark-soils-train3.jpg` (moody train window) |
| 4 | Terracotta Button | ₹245 | `/terracotta-piano.jpg` · `/terracotta-press.jpg` · `/terracotta-kiln.jpg` · `/terracotta-pouch.jpg` |

- Copy: terroir descriptions per blend (Karnataka light soils / Deccan sun-cured / Godavari fire-cured). **No organic claims** (removed per Kapil). Terracotta copy: handmade, wood-fired kiln, Portuguese-Goa history, wet/dry usage.
- All AI travelogue images are **Kapil's corrected watermark-free exports** (the generator stamped a sparkle bottom-right; his fixed masters are committed under the original filenames, served under the fresh names above).

## ⚠️ The image-cache rule (learned the hard way, twice)

`next.config.ts` sets 1-year immutable caching on images. **Never replace an image's content under the same filename** — browser + CDN keep serving the old pixels. Always ship changed images under a NEW filename and update the DB `images` array. (That's why filenames have version suffixes. Old files are left in `/public` — harmless, and Kapil prefers keeping them.)

## Frontend state

- **Home**: hero → ticker → "The Archives" grid (ALL products; horizontal scroll on mobile, 2×2 on `md+`) → animated **archive index** (scroll-reveal rows, self-drawing rules, stamping numerals, rows expand via `+` badge into longer notes, press-bounce) → **About record** (big lede, 2-col text, rotated stamp with thump-in) over a **ghosted Goa fort engraving** (`/goa-fort.jpg`, natural width at section bottom, top-only dissolve mask, 16% opacity multiply — do NOT re-add side vignette or a card behind the text; both were tried and rejected).
- **Home/shop module-level cache**: products kept in module scope so client-side back-navigation paints instantly (no skeleton reflash).
- **Product page**: 4:5 centered desktop hero; thin white chevron arrows + white dots (drop shadows, visible on dark frames); touch swipe (instant switch — a drag-follow animation was started and explicitly declined, don't re-add unasked).
- **DesktopNav** hides on `/cart`, `/checkout`, `/product/*` (bottom CTAs live there).

## Gotchas (keep)

- `AUTH_URL` must match the host; dev = `http://localhost:3000`.
- KV must be the Upstash REST URL.
- Auth.js v5 env prefix is `AUTH_*`.
- `next-env.d.ts` churns on every build — intentionally uncommitted.
- The ECC GateGuard hook demands stated facts before Bash/Edit calls in this repo's sessions (`ECC_GATEGUARD=off` disables).

---

## Open TODOs (next session)

1. **Verify iOS UPI deep links** (still UNVERIFIED, carried over). Real iPhone, each app: GPay/PhonePe/Paytm/BHIM buttons on checkout. Schemes are guesses in the `iosApps` array in `app/checkout/page.tsx`. QR is the fallback.
2. **(Low) Pre-existing lint debt.** Build is clean; standalone eslint flags `any`-types in order/product mapping and a `setState`-in-effect in `app/page.tsx`.
3. **(Optional) Remove the client-side PIN** in `app/fukoadmin/AdminDashboard.tsx` — redundant behind the server gate.
4. **(Optional) Prune unused images** in `/public` (superseded versions kept deliberately; a cleanup pass needs Kapil's sign-off — he rejected one before).
