# Auth migration handover

Mid-migration from **phone + Twilio SMS/WhatsApp OTP** → **Google Sign-In (primary) + email OTP (fallback)** via Auth.js v5 and Resend. No Firebase. Postgres + Vercel KV stack unchanged.

## STATUS (updated): Phases 1–6 implemented. Pending: user env + migration + manual smoke.

All code phases are done and verified at build/test level: `tsc` clean, `vitest` 16/16, `next build` green. What remains is user-owned (see "Manual ops" + the env list below): add `AUTH_SECRET`, `GOOGLE_CLIENT_ID/SECRET`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL` to `.env.local` (Postgres/KV/Twilio are already there), run the migration, then run the manual sign-in smoke test. No commit/deploy made — diffs are staged for review.

**⚠️ KNOWN INFRA ISSUE — KV/Redis is dead.** `KV_REST_API_URL` points at `redis-10887.…redislabs.com:10887` which returns **NXDOMAIN** (decommissioned), and it's a raw Redis Cloud host, not the Upstash REST URL `@vercel/kv` expects. This breaks the OTP send rate-limiter (and silently degrades `getSiteSettingsAction`, which falls back to defaults). **Mitigation applied:** `app/api/auth/email-otp/send/route.ts` now **fails open** — if KV errors it logs a warning and lets the send proceed (no throttle while KV is down). **TODO (user):** provision a real Vercel KV/Upstash store → set `KV_REST_API_URL=https://….upstash.io` + `KV_REST_API_TOKEN` locally and in Vercel, so rate-limiting actually works.

**Smoke test status:** email-OTP **send** verified end-to-end this session (route 200, OTP row in `email_otp_codes`, Resend accepted the email to kapil.das@gmail.com via `onboarding@resend.dev` test sender). Still to verify (interactive/browser): entering the code to complete sign-in, and Google sign-in.

**Resolved this session (was a handover contradiction): orders ↔ identity.** Orders stay keyed by `customer_phone` (schema untouched). Checkout onboarding now collects a phone (delivery contact), saves it to `users.phone` AND the order's `customer_phone`. Profile fetches the profile by `users.id` and order history by `users.phone`. So "no phone field in onboarding" was overridden — there IS a phone field, just not used for login.

---

## Original plan below — auth wiring written, nothing parked yet, no UI swapped

### Files written this session

- `auth.ts` — Auth.js v5 config. Providers: `Google` (with `allowDangerousEmailAccountLinking: true`) and `Credentials` (id `"email-otp"`, calls `verifyEmailOtpCode`). `session.strategy = "jwt"`. Postgres adapter via `pg.Pool(POSTGRES_URL)`. JWT callback puts `user.id` on the token; session callback exposes it at `session.user.id`.
- `app/api/auth/[...nextauth]/route.ts` — `export const { GET, POST } = handlers`.
- `lib/email-otp.ts` — `generateAndStoreEmailOtp(email)` and `verifyEmailOtpCode(email, code)`. 6-digit code, scrypt with per-code 16-byte salt, stored as `salt:derivedHex` in `email_otp_codes.code_hash`. 10-min TTL, 5-attempt cap, `timingSafeEqual` compare. On success, deletes the OTP row and upserts the user via `INSERT … ON CONFLICT (email) DO UPDATE SET "emailVerified" = COALESCE(..., NOW())`.
- `scripts/migrations/001_nextauth_schema.sql` — idempotent. Conditional rename via `DO $$` block (fires only if `users.phone_number` exists AND `users_parked_phone_otp` does not). All `CREATE`s use `IF NOT EXISTS`. New tables: `users` (Auth.js shape + `phone`, `addresses`, `created_at`), `accounts`, `sessions`, `verification_token`, `email_otp_codes`.
- `scripts/run_migration_001.js` — runs the SQL file in one `pool.query()` (simple query protocol; handles `DO` blocks).
- `package.json` — added `next-auth@5.0.0-beta.31`, `@auth/pg-adapter@^1.7.0`, `pg@^8.13.1`, `resend@^4.0.1`, dev `@types/pg@^8.11.10`. Twilio stays. (Note: next-auth pin bumped beta.29→beta.31 — beta.29's peer dep only allowed Next 14/15; this project is on Next 16.1.6, and beta.31 is the first beta declaring a `^16` peer.)

### Files NOT yet touched

- `app/login/page.tsx`, `app/checkout/page.tsx`, `app/profile/page.tsx` — still on the phone-OTP UI
- `app/api/auth/otp/send/route.ts`, `app/api/auth/otp/verify/route.ts` — still in active path
- `app/actions.ts` — `updateUserProfileAction(phone, …)` still takes phone, still writes to old `users` shape
- No `_parked/phone-otp/` directory yet
- No email-OTP send/verify routes yet
- No Resend integration yet

## What the user needs to do before the next session resumes

1. **`npm install`** — picks up next-auth, @auth/pg-adapter, pg, resend.
2. **Set env vars** in `.env.local`:
   - `AUTH_SECRET` (note: Auth.js v5 renamed from `NEXTAUTH_SECRET`; `openssl rand -base64 32`)
   - `AUTH_URL` (optional in dev; set in prod)
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — from Google Cloud Console OAuth 2.0 client
   - `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
3. **Google Cloud Console** — create OAuth 2.0 client. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (dev)
   - `https://<prod-domain>/api/auth/callback/google` (prod)
4. **Resend** — verify a sending domain (DNS records: SPF, DKIM, optionally DMARC).
5. **Run migration**: `node scripts/run_migration_001.js`. Now idempotent — safe to re-run.
6. **Sanity check**: `npm run dev`, hit `/api/auth/providers` → should return JSON listing `google` and `email-otp`. Hit `/api/auth/signin` → default sign-in page renders Google button.

## Next session — work to do, in order

> ✅ Phases 1–6 are now IMPLEMENTED (see STATUS banner at top). The sections below are kept as the original spec / record of intent. Phase 3 = `components/auth/AuthPanel.tsx` + login/profile/checkout rewrites; Phase 4 = `app/providers.tsx` SessionProvider + `useSession`; Phase 5 = `app/actions.ts` (now by user id + session); Phase 6 = automated checks pass, manual smoke pending env.

### Phase 1 — Email OTP API routes + Resend (small, no UI yet) — ✅ DONE

Built TDD (vitest added as dev harness — `vitest.config.ts`, `test`/`test:watch` scripts, `vite-tsconfig-paths` for the `@/` alias). 11 unit tests pass; `tsc --noEmit` and `eslint` clean. End-to-end NOT yet verified — needs env vars + migration (user-owned, see top of file).

- `lib/resend.ts` — `sendOtpEmail(to, code)`. Reads `RESEND_API_KEY`/`RESEND_FROM_EMAIL`, throws if unset; throws on Resend error. (`lib/resend.test.ts`)
- `app/api/auth/email-otp/send/route.ts` — POST `{ email }`. Validates format, lowercases+trims, rate-limits via KV (`kv.incr` + `kv.expire`, 3 per email per 15 min → 429), calls `generateAndStoreEmailOtp` + `sendOtpEmail`, returns `{ success: true }`. Same shape regardless of account existence (no enumeration). (`route.test.ts`)
- `app/api/auth/email-otp/verify/route.ts` — POST `{ email, code }`. Calls `signIn("email-otp", { email, code, redirect: false })`; `{ success: true }` 200 / `{ success: false }` 401 / missing fields 400. (`route.test.ts`)
  - ⚠️ OPEN: this is server-side `signIn`. In Phase 3 the AuthPanel will likely call `signIn("email-otp", …)` **client-side** (reliable cookie-setting with Credentials), which may make this route redundant. Verify cookie behaviour when wiring the UI; delete the route if the client path supersedes it. A code comment in the route flags this.

### Phase 2 — Park the phone-OTP code — ✅ API DONE / UI folded into Phase 3

Target shape: `_parked/phone-otp/` at project root.

**Done this session:**
- `app/api/auth/otp/send/route.ts` → `_parked/phone-otp/api/send/route.ts` (contents unchanged)
- `app/api/auth/otp/verify/route.ts` → `_parked/phone-otp/api/verify/route.ts` (contents unchanged)
- Empty `app/api/auth/otp/` removed. `_parked` added to `tsconfig.json` exclude so parked code never gates `next build`/`tsc`.
- `_parked/phone-otp/README.md` written (what/why/how-to-revive, env vars, API surface).
- ⚠️ **Known window:** login + profile pages still `fetch("/api/auth/otp/*")`, which now 404 at runtime until Phase 3 swaps their UI. Build stays green. Pre-launch, no deploy, reversible.

**Deferred to Phase 3 (couldn't be done cleanly in isolation):** extracting the inline phone+OTP UI out of the pages. `app/login/page.tsx` is *entirely* the phone→OTP flow; profile's is an embedded block. There's no replacement to put in their place until `AuthPanel` exists, so the extraction (cut the inline JSX, preserve it into `_parked/phone-otp/components/`) happens in Phase 3 as the new UI lands. **Correction:** `app/checkout/page.tsx` does NOT call the OTP endpoints — only login + profile do.

Don't uninstall `twilio` or remove `TWILIO_*` env vars.

### Phase 3 — Unified auth UI component

New component: `components/auth/AuthPanel.tsx`. Matches existing visual system (sonner toasts, same card/button styles as current `app/login/page.tsx`). Flow:

1. Primary "Continue with Google" button → `signIn("google")`
2. Divider "or"
3. "Continue with email" → reveals email input + Send code button
4. After send: 6-digit code input (6 boxes, numeric only, mirrors existing OTP UI pattern in `app/login/page.tsx` lines ~119)
5. On verify success: `signIn("email-otp", { email, code, redirect: false })`, redirect to wherever the user was headed (login → `/`, checkout → next step, profile → reload)

Wire it into:
- `app/login/page.tsx` — replaces the entire current form
- `app/checkout/page.tsx` — replaces the login + OTP steps (lines ~15–293), keeps the onboarding/address/payment flow
- `app/profile/page.tsx` — replaces the embedded login block (lines ~89–328)

### Phase 4 — Replace localStorage with `useSession`

Per-page changes to `app/checkout/page.tsx`, `app/profile/page.tsx`:
- Replace `localStorage.getItem("fuko_user_phone")` reads with `useSession()` from `next-auth/react`.
- Replace `localStorage.removeItem("fuko_user_phone")` (logout in profile) with `signOut()`.
- Keep `localStorage` for non-auth data (cart, name cache) — leave those alone.

Wrap the app: add `<SessionProvider>` in `app/layout.tsx` (note: needs to be in a client component — make a small `app/providers.tsx` "use client" wrapper).

### Phase 5 — `app/actions.ts`

Rewrite `updateUserProfileAction`:
- Drop the `phone` parameter. Read identity server-side via `const session = await auth()`.
- Write to the new `users` table by `id` (integer PK) instead of `phone_number`.
- Field map: `name`, `addresses` stay. `phone` is now an optional column on `users` — populate later from checkout if collected.
- Find every call site of `updateUserProfileAction` and `getUserProfileAction` (currently `app/checkout/page.tsx`, `app/profile/page.tsx`) and update signatures.

Check downstream for any `user.phoneNumber` / `phone_number` reads outside auth — orders table has `customer_phone` (separate, OK to keep — that's checkout-collected). Don't touch the orders schema.

### Phase 6 — Final checks

- Search the codebase for `fuko_user_phone` — should be zero matches outside `_parked/`.
- Search for `phone_number` — should be zero matches in active code outside `users_parked_phone_otp` references and `orders.customer_phone`.
- `npm run lint`, `npm run build`.
- Manual smoke: Google sign-in → user row created → cart → checkout → onboarding (no phone field) → address → order placed → profile shows the order.
- Email OTP smoke: enter email → receive code → enter code → user row created → same flow.

## Decisions already made (do NOT re-litigate)

| Decision | Value |
|---|---|
| Auth library | Auth.js v5 (next-auth@5-beta) |
| Session strategy | JWT (Credentials provider forces this) |
| `allowDangerousEmailAccountLinking` | `true` (both providers verify email ownership) |
| Account linking model | One `users` row per email; Google and email-OTP for the same address share it |
| Email provider | Resend |
| Email OTP UX | Typed 6-digit code (NOT magic link) |
| OTP hash | `crypto.scrypt` with per-code 16-byte salt; stored as `salt:derivedHex` |
| OTP TTL | 10 min |
| OTP attempt cap | 5 |
| Old users table | Renamed to `users_parked_phone_otp`, data preserved, untouched |
| Data migration | None — pre-launch, start fresh |
| Twilio package | Stays installed; env vars stay; code parked, not deleted |
| Route guards | None yet; keep per-page auth checks but switch them from localStorage to `useSession` |
| Phone number collection | Removed from signup; optional `users.phone` column for later checkout-time collection (unverified) |

## Gotchas

- Auth.js v5 env prefix is `AUTH_*`, not `NEXTAUTH_*`. Some Stack Overflow / older docs will mislead.
- The `users` table column names `userId`, `emailVerified`, `providerAccountId`, `sessionToken` are **camelCase, double-quoted** as required by `@auth/pg-adapter`. Don't snake_case them.
- Credentials provider does NOT call the adapter's `createUser` — `verifyEmailOtpCode` in `lib/email-otp.ts` does the upsert itself. Keep it that way.
- Migration runner uses direct `pg.Pool` (not `@vercel/postgres`) because the `DO $$` block contains semicolons that the per-statement splitter would mangle.
- `signIn("email-otp", { redirect: false })` from server code vs client code behaves differently re: cookie setting. Phase 1 may need to be revisited if server-side sign-in doesn't set the session cookie cleanly.
- Don't add a `middleware.ts` yet — per user, route guards come later as a separate piece of work.

## Manual ops the user owns

- Google Cloud Console OAuth client + redirect URIs
- Resend domain DNS + verified sender
- Env vars in `.env.local` (and Vercel project env for prod)
- Running the migration (`node scripts/run_migration_001.js`)
- No deploy — user reviews diffs first
