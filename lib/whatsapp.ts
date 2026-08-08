import { Order, OrderStatus } from "./orders"

// Text the admin sends from their own WhatsApp. It follows the order's saved
// status, so the one button carries the payment confirmation first and each
// later status update after it — the customer gets a thread that tracks the
// order, not a repeat of "payment received" every time it moves.
//
// Keyed by status rather than switched on it: adding a member to OrderStatus
// then fails to compile until its copy is written, so no status can ship
// silently sending the wrong message.
export function whatsappMessage(order: Order): string {
    const name = order.customerName || "there"
    const items = order.items.map(i => `${i.name} x${i.quantity}`).join(", ")
    const amount = order.paymentAmount?.toFixed(2) ?? String(order.total)
    // Only mentioned once the admin has actually entered one.
    const tracking = order.trackingId ? ` Tracking number: ${order.trackingId}.` : ""

    const byStatus: Record<OrderStatus, string> = {
        "Awaiting Payment": `Hi ${name}! We're holding your Fuko order ${order.id} — ${items} — but the ₹${amount} payment hasn't reached us yet. Reply here if you ran into trouble paying and we'll sort it out.`,
        "Processing": `Hi ${name}! Your Fuko order ${order.id} is confirmed — ${items}, ₹${amount} received ✅ Shipping in 1-2 days.`,
        "Shipped": `Hi ${name}! Your Fuko order ${order.id} — ${items} — has shipped 📦${tracking} We'll message you again when it's out for delivery.`,
        "Out for Delivery": `Hi ${name}! Your Fuko order ${order.id} is out for delivery today 🛵${tracking} Please keep your phone reachable for the delivery partner.`,
        "Delivered": `Hi ${name}! Your Fuko order ${order.id} has been delivered ✅ Hope you love it — reply here if anything isn't right.`,
        "Cancelled": `Hi ${name}, your Fuko order ${order.id} — ${items} — has been cancelled. Anything you've already paid will be refunded to the same UPI account. Reply here if you have questions.`,
    }

    return byStatus[order.status]
}

// What the admin reads on the button, so which message is about to be sent is
// obvious before tapping it.
export const WHATSAPP_BUTTON_LABEL: Record<OrderStatus, string> = {
    "Awaiting Payment": "Payment reminder",
    "Processing": "Confirm on WhatsApp",
    "Shipped": "Send Shipped update",
    "Out for Delivery": "Send Delivery update",
    "Delivered": "Send Delivered update",
    "Cancelled": "Send Cancellation",
}

export function whatsappUrl(order: Order): string {
    const digits = (order.customerPhone || "").replace(/\D/g, "")
    const to = digits.length === 10 ? `91${digits}` : digits
    return `https://wa.me/${to}?text=${encodeURIComponent(whatsappMessage(order))}`
}
