# Parked: phone-number + Twilio OTP auth

This directory holds the **original phone-number login** (Twilio SMS/WhatsApp OTP), parked during the migration to Auth.js v5 (Google Sign-In + email OTP). See `HANDOVER.md` at the project root for the migration's overall state.

## Why it's parked (not deleted)

Phone/WhatsApp OTP needs **DLT registration** (India SMS regulation) and **Meta Business verification**, both deferred until after launch. The code works and is kept verbatim so it can be revived once that infra is in place. The `twilio` npm package stays installed and the `TWILIO_*` env vars are kept — nothing here was uninstalled.

## What's parked

### API routes (parked now, in this commit)

- `api/send/route.ts` — was `app/api/auth/otp/send/route.ts`. `POST { phoneNumber }`. Creates a Twilio Verify verification over the **whatsapp** channel for `+91<phoneNumber>`. Dev bypass: `phoneNumber === "9999999999"` returns success without sending.
- `api/verify/route.ts` — was `app/api/auth/otp/verify/route.ts`. `POST { phoneNumber, code }`. Runs a Twilio Verify check. Dev bypass: `9999999999` + code `1234`.

Contents are byte-for-byte unchanged from the originals.

### UI components (NOT here yet — parked during Phase 3)

The phone+OTP UI is still inline in the live pages and will be extracted into `components/` here when Phase 3 replaces it with `AuthPanel`:

- `app/login/page.tsx` — the **entire page** is the phone→OTP flow (4-digit code, paste/keyboard handling). Whole thing gets replaced.
- `app/profile/page.tsx` — embedded login block (the logged-out branch) calls the same endpoints.

(Note: `app/checkout/page.tsx` does **not** call the OTP endpoints directly, despite an earlier note in HANDOVER.md.)

## Env vars it needs (kept in `.env.local`, do not remove)

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_VERIFY_SERVICE_SID`

## API surface (for callers)

- `POST /api/auth/otp/send` → `{ success: true, status }` | `{ error }`
- `POST /api/auth/otp/verify` → `{ success: true }` | `{ error }`

## How to revive

1. Copy `api/send/route.ts` back to `app/api/auth/otp/send/route.ts` and `api/verify/route.ts` back to `app/api/auth/otp/verify/route.ts`.
2. Once the Phase 3 UI extraction lands here, copy the components in `components/` back into the relevant pages (or render them behind a feature flag alongside the email/Google flow).
3. Confirm `TWILIO_*` env vars are set and the Twilio Verify service has WhatsApp/SMS enabled (requires DLT + Meta Business verification).
4. Decide how phone login coexists with Auth.js: either bridge a successful Twilio verify into a session, or keep it as a separate path. The original flow set `localStorage["fuko_user_phone"]` directly — that mechanism is being removed in Phase 4 (replaced by `useSession`), so revival will need to mint a real session instead.
