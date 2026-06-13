# FUKO26 — Handover

_Last updated: 2026-06-13_

## TL;DR

The **auth migration is complete and live in production** at **https://okfuko.shop**, plus a batch of desktop/perf/payments/UX work shipped this session. Everything below is deployed. The main things left are **verification** (iOS UPI on a real device) and **hardening** (admin auth) — see **Open TODOs**.

---

## Live / deploy

- **Production:** https://okfuko.shop (canonical) — also serves at `fuko-sigma.vercel.app`.
- **Deploy:** push to `main` → Vercel auto-deploys (project `fuko`, team `kapildas-5794s-projects`). Repo: `github.com/dasparov/Fuko`.
- **Local dev:** `npm run dev` (binds `0.0.0.0`; **open via `localhost:3000`**, not `0.0.0.0`, or Google OAuth breaks).
- **Tests:** `npm test` (vitest, 17 tests). **Build:** `npm run build`.

## Stack

Next.js 16 (Turbopack) · **Auth.js v5** (`next-auth@5.0.0-beta.31`) · **Neon Postgres** (`@vercel/postgres` + `pg`) · **Vercel KV = Upstash Redis** (store `fuko-kv`) · **Resend** (email) · **Twilio** (parked, not active).

## Environment (all set, local `.env.local` + Vercel Production)

| Var | Value / notes |
|---|---|
| `AUTH_SECRET` | set (signs JWT sessions) |
| `AUTH_URL` | `https://okfuko.shop` (prod) / `http://localhost:3000` (local). **Must match the domain** or Google OAuth fails. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | set; consent screen **published**; redirect URIs registered for okfuko.shop + vercel.app + localhost |
| `RESEND_API_KEY` | set (send-only key) |
| `RESEND_FROM_EMAIL` | `Fuko <noreply@send.okfuko.shop>` — verified **subdomain** `send.okfuko.shop` (not the root). The send-only key can't list domains via API. |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Upstash `fuko-kv` (`https://…upstash.io`). The old `fuko-storage` (Redis Cloud / redislabs) was **deleted** — it was NXDOMAIN/dead. |
| `POSTGRES_URL` / `DATABASE_URL` | Neon `fuko-db`. Local and prod point at the **same** Neon DB (so the migration applied to prod too). |
| `TWILIO_*` | kept for the parked phone-OTP flow; not used. |

## Auth + data model

- **Google Sign-In (primary) + email-OTP (fallback)**, Auth.js v5, **JWT** sessions, Postgres adapter. `allowDangerousEmailAccountLinking: true` → one `users` row per email; Google + email-OTP for the same address share it. `session.user.id` is exposed via the jwt/session callbacks in `auth.ts`. **Verified working in prod** (Google sign-in + email-OTP delivery + full checkout → order → profile).
- **`users`** table (Auth.js shape): `id` SERIAL PK, `name`, `email`, `"emailVerified"`, `image`, `phone`, `addresses` (jsonb), `created_at`. Old phone-OTP table renamed to **`users_parked_phone_otp`** (data preserved).
- **Orders ↔ identity:** `orders` keyed by `customer_phone` (schema untouched). Checkout onboarding collects a **phone** → saved to `users.phone` AND `order.customer_phone`. **Profile fetches the profile by `users.id`; order history by `users.phone`.** (`app/actions.ts`: `getUserProfileAction(userId)`, `updateUserProfileAction({name?,phone?,addresses?})` reads identity from `auth()`.)
- **Email-OTP internals** (`lib/email-otp.ts`): 6-digit code, scrypt `salt:derivedHex`, 10-min TTL, 5-attempt cap. The Credentials provider's `authorize` upserts the user (adapter `createUser` is NOT used for this path — keep it that way).
- **Rate limiter** (`app/api/auth/email-otp/send`): KV `incr`+`expire`, 3/email/15min, **fails open** if KV is down (logs a warning, lets sign-in proceed).

## Admin

- **`/fukoadmin`** — single page. Tabs: Orders, Inventory, Analytics, Settings. All backing actions verified working.
- ⚠️ **Auth is a client-side PIN only** (`2026`, hardcoded in the bundle) + a `sessionStorage` flag. **The admin server actions have NO server-side auth** — anyone can call `getOrdersAction`/`deleteOrderAction`/`saveProductAction` etc. directly. See Open TODO #2.

## Parked

- **`_parked/phone-otp/`** — the old Twilio SMS/WhatsApp OTP flow (API routes + a UI archive + revival README). Twilio package + `TWILIO_*` env vars kept. `_parked` is excluded in `tsconfig.json`.

## Shipped this session (all deployed)

Commits: `e1aba9f` (auth migration) → `976d469` (image opt) → `3939241` (desktop layout + iOS UPI + upload compression) → `3178653` (skeletons) → `db3ecb4` (desktop nav).

1. **Auth migration** (above).
2. **Desktop-responsive layout** — `components/layout/PageContainer.tsx` centers/caps content; home has a full-bleed responsive hero (landscape desktop / portrait mobile) + product grid; storefront pages centered; sticky CTAs centered. Mobile unchanged (additive at `md:`).
3. **Image optimization** — every `/public` raster recompressed in place, 8.36 MB → 711 KB.
4. **Upload compression** — `lib/compress-image.ts` downsizes+re-encodes images in the browser before storing (admin uploads + checkout screenshot), so uploads no longer bloat Postgres.
5. **iOS UPI fix** — `upi://` has no app chooser on iOS (claimed by WhatsApp). On iOS: per-app deep-link buttons (GPay/PhonePe/Paytm/BHIM, in checkout's `iosApps` array) + a local QR (`qrcode.react`). Android keeps the native `upi://` chooser.
6. **Skeleton loading** — `components/ui/Skeletons.tsx`; checkout (delivery-address skeleton), admin Orders/Inventory, profile orders/addresses. Removed an artificial 800ms delay in admin `loadAllData`.
7. **Floating desktop nav** — `components/layout/DesktopNav.tsx`, bottom-center pill (Home/Cart/Account), `md+` only (mobile keeps `MobileNav`).

## Gotchas (don't relearn these)

- **`AUTH_URL` must match the host** — dev binds `0.0.0.0`, but Google rejects `0.0.0.0` redirect URIs; `AUTH_URL=http://localhost:3000` pins it. Prod = `https://okfuko.shop`.
- **KV must be the Upstash REST URL** (`*.upstash.io`), not a raw Redis host. `@vercel/kv` needs that. The old store was dead.
- **Resend test sender** (`onboarding@resend.dev`) only emails the account owner; prod uses the verified `send.okfuko.shop` subdomain.
- Auth.js v5 env prefix is `AUTH_*` (not `NEXTAUTH_*`).
- `next-env.d.ts` churns on every build — intentionally left uncommitted.

---

## Open TODOs (next session)

1. **Verify iOS UPI deep links** (UNVERIFIED). On a real iPhone with each app installed, tap GPay/PhonePe/Paytm/BHIM on the checkout payment step. Schemes are guesses (`gpay://upi/pay`, `phonepe://pay`, `paytmmp://pay`) and centralized in the `iosApps` array in `app/checkout/page.tsx`. Fix any that don't open. The QR is the always-works fallback.
2. **Harden admin auth** (security). Gate `/fukoadmin` AND every admin server action with a server-side **admin-email allowlist** via `await auth()` (e.g. `ADMIN_EMAILS` env). Currently it's client-side PIN only + unauthenticated actions = customer PII and order/product mutation are publicly callable.
3. **Check desktop nav overlap.** The bottom-center floating `DesktopNav` may collide with the sticky bottom CTAs on **cart / checkout / product**. Visually verify on desktop; if it overlaps, nudge it (sit above the CTA) or hide it on those pages.
4. **Delete the dead verify route.** `app/api/auth/email-otp/verify/route.ts` was Phase-1 scaffolding; the AuthPanel uses **client-side** `signIn("email-otp", …)` instead, so the route is redundant. Confirm nothing calls it, then delete (+ its test).
5. **(Low) Pre-existing lint debt.** `npm run build` is clean, but standalone `eslint` flags `any`-types in order/product mapping (`app/actions.ts`, `fukoadmin`) and a `setState`-in-effect in `app/page.tsx` — all pre-existing, optional cleanup.
