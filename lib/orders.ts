"use client"

export type OrderStatus = "Processing" | "Shipped" | "Out for Delivery" | "Delivered" | "Cancelled"

export interface OrderItem {
    id: string
    name: string
    price: number
    quantity: number
    image: string
}

export interface DeliveryAddress {
    type: string
    line1: string
    line2: string
    city: string
    state: string
    pincode: string
}

export interface Order {
    id: string
    date: string
    status: OrderStatus
    items: OrderItem[]
    total: number
    trackingId?: string
    // Delivery info (denormalized - snapshot at order time)
    customerName?: string
    customerPhone?: string
    deliveryAddress?: DeliveryAddress
    paymentScreenshot?: string // Base64 or URL
    isPaymentVerified?: boolean
}

const STORAGE_KEY = "fuko_orders"

export function getOrders(): Order[] {
    if (typeof window === "undefined") return []

    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
        return []
    }

    return JSON.parse(stored)
}

export function getOrderById(id: string): Order | undefined {
    const orders = getOrders()
    return orders.find(o => o.id === id)
}

export function saveOrder(
    items: OrderItem[],
    total: number,
    customerName?: string,
    customerPhone?: string,
    deliveryAddress?: DeliveryAddress,
    paymentScreenshot?: string
) {
    const newOrder: Order = {
        id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' }),
        status: "Processing",
        items,
        total,
        customerName,
        customerPhone,
        deliveryAddress,
        paymentScreenshot
    }

    const orders = getOrders()
    const updated = [newOrder, ...orders]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return newOrder
}

export function updateOrderStatus(orderId: string, newStatus: OrderStatus): boolean {
    const orders = getOrders()
    const orderIndex = orders.findIndex(o => o.id === orderId)

    if (orderIndex === -1) return false

    orders[orderIndex].status = newStatus
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
    return true
}

export function deleteOrder(orderId: string): boolean {
    const orders = getOrders()
    const filtered = orders.filter(o => o.id !== orderId)

    if (filtered.length === orders.length) return false

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    return true
}

export function togglePaymentVerification(orderId: string, verified: boolean): boolean {
    const orders = getOrders()
    const orderIndex = orders.findIndex(o => o.id === orderId)

    if (orderIndex === -1) return false

    orders[orderIndex].isPaymentVerified = verified
    if (verified && orders[orderIndex].status === "Processing") {
        // Automatically move to Shipped or just keep as verified
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
    return true
}
