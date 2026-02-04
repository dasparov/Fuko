'use server'

import { kv } from '@vercel/kv'
import { sql } from '@vercel/postgres'
import { SiteSettings, DEFAULT_SETTINGS } from '@/lib/settings'
import { Order, OrderItem, DeliveryAddress, OrderStatus } from '@/lib/orders'
import { revalidatePath } from 'next/cache'

const SETTINGS_KEY = 'site_settings'

// --- Settings Actions ---
export async function getSiteSettingsAction(): Promise<SiteSettings> {
    try {
        const settings = await kv.get<SiteSettings>(SETTINGS_KEY)
        return settings || DEFAULT_SETTINGS
    } catch (error) {
        console.error("KV Read Error:", error)
        return DEFAULT_SETTINGS
    }
}

export async function saveSiteSettingsAction(settings: SiteSettings): Promise<boolean> {
    try {
        await kv.set(SETTINGS_KEY, settings)
        revalidatePath('/')
        revalidatePath('/fukoadmin')
        return true
    } catch (error) {
        console.error("KV Write Error:", error)
        return false
    }
}

// --- Order Actions (Postgres) ---
export async function getOrdersAction(): Promise<Order[]> {
    try {
        const { rows } = await sql`SELECT * FROM orders ORDER BY created_at DESC`
        // Map database rows to Order interface
        return rows.map((row: any) => ({
            id: row.id,
            date: row.date,
            status: row.status as OrderStatus,
            total: row.total,
            items: row.items, // JSONB comes back as object
            customerName: row.customer_name,
            customerPhone: row.customer_phone,
            deliveryAddress: row.delivery_address,
            paymentScreenshot: row.payment_screenshot,
            isPaymentVerified: row.is_payment_verified
        }))
    } catch (error) {
        console.error("Postgres Read Error:", error)
        return []
    }
}

export async function getOrdersForUserAction(phone: string): Promise<Order[]> {
    try {
        const { rows } = await sql`SELECT * FROM orders WHERE customer_phone = ${phone} ORDER BY created_at DESC`
        return rows.map((row: any) => ({
            id: row.id,
            date: row.date,
            status: row.status as OrderStatus,
            total: row.total,
            items: row.items,
            customerName: row.customer_name,
            customerPhone: row.customer_phone,
            deliveryAddress: row.delivery_address,
            paymentScreenshot: row.payment_screenshot,
            isPaymentVerified: row.is_payment_verified
        }))
    } catch (error) {
        console.error("Postgres User Orders Error:", error)
        return []
    }
}

export async function saveOrderAction(order: Order): Promise<boolean> {
    try {
        await sql`
            INSERT INTO orders (id, date, status, total, items, customer_name, customer_phone, delivery_address, payment_screenshot, is_payment_verified)
            VALUES (
                ${order.id}, 
                ${order.date}, 
                ${order.status}, 
                ${order.total}, 
                ${JSON.stringify(order.items)}, 
                ${order.customerName || null}, 
                ${order.customerPhone || null}, 
                ${JSON.stringify(order.deliveryAddress || null)}, 
                ${order.paymentScreenshot || null},
                ${order.isPaymentVerified || false}
            )
        `
        revalidatePath('/fukoadmin')
        return true
    } catch (error) {
        console.error("Postgres Write Error:", error)
        return false
    }
}

export async function updateOrderStatusAction(orderId: string, newStatus: OrderStatus): Promise<boolean> {
    try {
        await sql`UPDATE orders SET status = ${newStatus} WHERE id = ${orderId}`
        revalidatePath('/fukoadmin')
        return true
    } catch (error) {
        console.error("Postgres Update Status Error:", error)
        return false
    }
}

export async function deleteOrderAction(orderId: string): Promise<boolean> {
    try {
        await sql`DELETE FROM orders WHERE id = ${orderId}`
        revalidatePath('/fukoadmin')
        return true
    } catch (error) {
        console.error("Postgres Delete Error:", error)
        return false
    }
}

export async function togglePaymentVerificationAction(orderId: string, verified: boolean): Promise<boolean> {
    try {
        await sql`UPDATE orders SET is_payment_verified = ${verified} WHERE id = ${orderId}`
        revalidatePath('/fukoadmin')
        return true
    } catch (error) {
        console.error("Postgres Verify Payment Error:", error)
        return false
    }
}
