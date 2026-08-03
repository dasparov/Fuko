// Type-only: lib/orders is a "use client" module; this file runs in server
// actions, so the import must vanish at compile time.
import type { Order } from "@/lib/orders"

/**
 * Order backup to Google Sheets (append-only) — the safety net for a UPI flow
 * with no payment callback. Each event POSTs one row to an Apps Script web
 * app; nothing here ever throws or blocks checkout. Design:
 * docs/superpowers/specs/2026-08-03-order-sheet-backup-design.md
 */

export type OrderLogEvent = "awaiting" | "paid"

export interface OrderLogExtras {
    email?: string
    userId?: string
}

// Bank statements read in IST — the whole point of the timestamp is matching
// rows against credits, so never log UTC.
export function istTimestamp(now: Date): string {
    return new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Kolkata",
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        hour12: false,
    }).format(now)
}

function flatAddress(order: Order): string {
    const a = order.deliveryAddress
    if (!a) return ""
    return [a.type ? `${a.type}:` : "", a.line1, a.line2, a.city, a.state]
        .filter(Boolean).join(", ").replace(":,", ":")
}

function itemsSummary(order: Order): string {
    return order.items.map(i => `${i.quantity}× ${i.name} @₹${i.price}`).join("; ")
}

// The details cell / email body: everything needed to honour the order by hand.
// The screenshot itself is excluded (base64 blows Sheets' 50k cell limit).
export function orderMarkdown(event: OrderLogEvent, order: Order, extras: OrderLogExtras, now: Date): string {
    const lines = [
        `### Order ${order.id} — ${event === "paid" ? "PAID (buyer confirmed)" : "awaiting payment"}`,
        ``,
        `- **When:** ${istTimestamp(now)} IST`,
        `- **Amount to match in bank:** ₹${order.paymentAmount ?? order.total}`,
        `- **Cart total:** ₹${order.total}`,
        `- **Items:** ${itemsSummary(order) || "—"}`,
        `- **Customer:** ${order.customerName || "—"}`,
        `- **Phone:** ${order.customerPhone || "—"}`,
        `- **Email:** ${extras.email || "—"}`,
        `- **Address:** ${flatAddress(order) || "—"}`,
        `- **Pincode:** ${order.deliveryAddress?.pincode || "—"}`,
        `- **Screenshot attached in app:** ${order.paymentScreenshot ? "yes" : "no"}`,
        `- **Status in app:** ${order.status}`,
    ]
    return lines.join("\n")
}

export function buildOrderRow(event: OrderLogEvent, order: Order, extras: OrderLogExtras, now: Date): (string | number)[] {
    return [
        istTimestamp(now),
        event,
        order.id,
        order.paymentAmount ?? "",
        order.total,
        itemsSummary(order),
        order.customerName || "",
        order.customerPhone || "",
        extras.email || "",
        flatAddress(order),
        order.deliveryAddress?.pincode || "",
        extras.userId || "",
        orderMarkdown(event, order, extras, now),
    ]
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

/**
 * Append one row to the sheet. Never throws; returns whether the append
 * landed. No-ops (true) when the env isn't set, so dev/preview stay silent.
 * One retry after 500ms turns transient Google 5xxs into non-events.
 */
export async function logOrderToSheet(event: OrderLogEvent, order: Order, extras: OrderLogExtras): Promise<boolean> {
    const url = process.env.SHEETS_WEBHOOK_URL
    const secret = process.env.SHEETS_WEBHOOK_SECRET
    if (!url || !secret) return true

    // Secret travels in the body, never the URL — URLs end up in logs.
    const body = JSON.stringify({ secret, row: buildOrderRow(event, order, extras, new Date()) })

    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body,
                signal: AbortSignal.timeout(3000),
                // Apps Script replies via a 302 to a one-time URL; follow it.
                redirect: "follow",
            })
            if (res.ok) return true
        } catch {
            // fall through to retry
        }
        if (attempt === 0) await sleep(500)
    }
    console.error(`Sheet log failed for ${order.id} (${event})`)
    return false
}
