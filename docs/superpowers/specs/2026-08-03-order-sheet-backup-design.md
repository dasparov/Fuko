# Order backup to Google Sheets — design

**Date:** 2026-08-03
**Status:** Approved (brainstormed with owner; approach A chosen)

## Problem

UPI pays out of band and Neon Postgres is the only order store. A DB glitch at
checkout (or a wiped table) can lose a paid order entirely — it happened with a
₹550.74 payment that arrived with no matching record. Every order must leave a
durable, human-readable record outside the primary Postgres path, complete
enough (items, amount, name, phone, address) to honour the order by hand.

## Approach

Append-only rows to a Google Sheet via a **Google Apps Script web app**
(owner's own account, no service account, no new npm dependency), plus
**Resend email** as both new-order notification and second net. Alternatives
considered and rejected: Sheets API + service account (heavy machinery, silent
credential expiry), third-party bridges (new vendor in the critical path).

## Components

### `lib/order-log.ts` (new)

- `buildOrderRow(event, order, extras, now?)` — pure; returns the 13-cell row.
  Testable; `now` injectable.
- `orderMarkdown(event, order, extras)` — the order + customer rendered as
  markdown; goes in the `details` cell and is the email body.
- `logOrderToSheet(event, order, extras)` — POSTs `{secret, row}` to
  `SHEETS_WEBHOOK_URL`. 3-second abort; **one retry** after 500 ms; never
  throws; returns boolean. **No-ops (returns true) when env is unset** so dev
  and preview don't pollute the sheet.

### `lib/resend.ts` (extend)

- `sendAdminEmail(subject, text)` — sends to every address in `ADMIN_EMAILS`.
  Never throws; returns boolean. Reuses existing Resend config.

### Call sites (both server-side, so no client can skip them)

- `saveOrderAction` — fires the sheet write **before** awaiting the Postgres
  INSERT, so a Neon outage cannot prevent the record. Event derives from
  status: `Awaiting Payment` → `awaiting`, else `paid` (covers the checkout
  fallback insert).
- `confirmOrderPaymentAction` — `UPDATE … RETURNING *`; on success fires a
  `paid` event with the full row.

### Email policy

| Situation | Email? |
| --- | --- |
| `paid` event | Always — this is the new-order alert **and** backup copy |
| `awaiting` event, sheet append OK | No (no pings for abandoned carts) |
| Sheet append failed | Yes |
| Postgres write failed | Yes |

## Row schema (one row per event, never updated)

`timestamp` (IST, `DD Mon YYYY, HH:mm:ss`) · `event` (`awaiting` / `paid`) ·
`order_id` · `amount_requested` (paise-fingerprinted — matches the bank
statement) · `total` · `items` (qty×name, joined) · `customer_name` · `phone` ·
`email` (from session) · `address` (flattened) · `pincode` · `user_id` ·
`details` (markdown).

**Excluded:** payment screenshot (base64 blows the 50k-char cell limit); the
markdown notes whether one was attached.

## Apps Script contract

`doPost` parses JSON, rejects when `secret` !== stored secret (secret travels
in the **body**, never the URL), appends `row` to the first sheet, returns 200.
Deployed as web app, "execute as me", "anyone with the link".

## Config

`SHEETS_WEBHOOK_URL`, `SHEETS_WEBHOOK_SECRET` — Vercel **Production only**, so
preview deploys and local dev never write to the real sheet. Unset = logging
disabled, checkout unaffected.

## Failure handling

Nothing in this path ever blocks or fails checkout. Sheet call: abort at 3 s,
one retry, swallow. Email: swallow. Worst case (Sheets **and** email **and**
Postgres all down) the order is lost only if the buyer's request never reached
the server at all.

## Accepted limits (deliberately not built)

1. **No reconciliation job.** The per-order `paid` email is the divergence
   check: an email with no matching admin row is the alarm.
2. **No sheet→app import.** A rescued order is honoured by hand from the sheet;
   it won't appear in admin analytics.
3. **Client-side gap.** If the buyer's request never reaches the server (signal
   dies mid-checkout), nothing anywhere can record it.

## Testing

Vitest on the pure parts: row shape, IST format, paise amount, missing
phone/address, screenshot exclusion, markdown content. Network paths smoke-
tested live (place a test order, watch the row + email arrive).
