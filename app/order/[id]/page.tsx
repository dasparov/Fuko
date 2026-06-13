"use client"

import { Button } from "@/components/ui/Button"
import { Order } from "@/lib/orders"
import { getOrderByIdAction } from "@/app/actions"
import { Skeleton } from "@/components/ui/Skeleton"
import { PageContainer } from "@/components/layout/PageContainer"
import { ArrowLeft, Check, Clock, Package, Truck, Info, MapPin, X } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

// Honest progression for the manual-verification flow (no instant-shipping implication).
const STATUS_STEPS = [
    { label: "Placed", icon: Clock },
    { label: "Payment Verified", icon: Check },
    { label: "Shipped", icon: Truck },
    { label: "Delivered", icon: Package },
]

function statusView(order: Order): { cancelled: boolean; index: number; message: string } {
    if (order.status === "Cancelled") {
        return { cancelled: true, index: -1, message: "This order was cancelled." }
    }
    if (order.status === "Delivered") {
        return { cancelled: false, index: 3, message: "Delivered — thanks for choosing Fuko." }
    }
    if (order.status === "Out for Delivery") {
        return { cancelled: false, index: 2, message: "Out for delivery — almost there." }
    }
    if (order.status === "Shipped") {
        return { cancelled: false, index: 2, message: "Your order has shipped." }
    }
    // Processing
    if (order.isPaymentVerified) {
        return { cancelled: false, index: 1, message: "Payment verified — we're preparing your order." }
    }
    return { cancelled: false, index: 0, message: "We're verifying your payment — we'll confirm shortly." }
}

export default function OrderDetailsPage() {
    const params = useParams()
    const id = params?.id as string
    const [order, setOrder] = useState<Order | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!id) return
        let cancelled = false
        ;(async () => {
            try {
                const data = await getOrderByIdAction(decodeURIComponent(id))
                if (!cancelled) setOrder(data)
            } finally {
                if (!cancelled) setLoading(false)
            }
        })()
        return () => { cancelled = true }
    }, [id])

    if (loading) {
        return (
            <main className="min-h-screen bg-background pb-32 pt-8">
                <PageContainer width="medium">
                    <div className="flex items-center gap-4 px-6 mb-8">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-40" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                    </div>
                    <div className="px-6 space-y-6">
                        <Skeleton className="h-32 w-full rounded-3xl" />
                        <Skeleton className="h-24 w-full rounded-3xl" />
                        <Skeleton className="h-28 w-full rounded-3xl" />
                    </div>
                </PageContainer>
            </main>
        )
    }

    if (!order) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
                <h1 className="font-heading text-2xl font-bold">Order Not Found</h1>
                <p className="mt-2 text-sm text-muted">ID: {id}</p>
                <Link href="/profile" className="mt-4 rounded-full bg-paper px-4 py-2 text-accent hover:underline">Back to Profile</Link>
            </main>
        )
    }

    const sv = statusView(order)

    return (
        <main className="min-h-screen bg-background pb-32 pt-8">
            <PageContainer width="medium">
                {/* Header */}
                <div className="flex items-center gap-4 px-6 mb-8">
                    <Link href="/profile">
                        <button className="rounded-full bg-paper p-2 text-muted hover:text-primary">
                            <ArrowLeft className="h-6 w-6" />
                        </button>
                    </Link>
                    <div>
                        <h1 className="font-heading text-2xl font-bold">Order #{order.id}</h1>
                        <p className="text-sm text-muted">Placed on {order.date}</p>
                    </div>
                </div>

                {/* Order Status */}
                <section className="px-6 mb-8">
                    <div className="rounded-3xl bg-paper p-6">
                        {sv.cancelled ? (
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                                    <X className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-heading font-bold">Cancelled</p>
                                    <p className="text-sm text-muted">{sv.message}</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <h2 className="font-heading text-lg font-bold mb-1">Order Status</h2>
                                <p className="text-sm text-muted mb-8">{sv.message}</p>
                                <div className="relative flex justify-between">
                                    <div className="absolute top-[15px] left-0 h-[2px] w-full bg-muted/10 -z-0"></div>
                                    <div
                                        className={`absolute top-[15px] left-0 h-[2px] transition-all duration-500 -z-0 ${order.status === 'Delivered' ? 'bg-nature' : 'bg-accent'}`}
                                        style={{ width: `${(sv.index / (STATUS_STEPS.length - 1)) * 100}%` }}
                                    ></div>
                                    {STATUS_STEPS.map((step, index) => {
                                        const Icon = step.icon
                                        const isActive = index <= sv.index
                                        const isCurrent = index === sv.index
                                        const activeBg = order.status === 'Delivered' ? 'bg-nature shadow-lg shadow-nature/20' : 'bg-accent shadow-lg shadow-accent/20'
                                        const activeText = order.status === 'Delivered' ? 'text-nature' : 'text-accent'
                                        return (
                                            <div key={step.label} className="relative z-10 flex flex-col items-center gap-2">
                                                <div className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${isActive ? `${activeBg} text-white` : 'bg-white text-muted border border-muted/20'}`}>
                                                    <Icon className="h-4 w-4" />
                                                </div>
                                                <p className={`text-[10px] font-bold uppercase tracking-wider text-center ${isCurrent ? activeText : 'text-muted'}`}>{step.label}</p>
                                            </div>
                                        )
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                </section>

                {/* Delivery Address */}
                {order.deliveryAddress && (
                    <section className="px-6 mb-8">
                        <h3 className="font-heading text-lg font-bold mb-4 flex items-center gap-2">
                            <MapPin className="h-5 w-5" /> Delivery Address
                        </h3>
                        <div className="rounded-3xl bg-paper p-5 text-sm">
                            <p className="font-bold">{order.customerName || "Customer"}</p>
                            {order.customerPhone && <p className="text-muted">+91 {order.customerPhone}</p>}
                            <p className="text-muted mt-2 leading-relaxed">
                                {order.deliveryAddress.line1}{order.deliveryAddress.line2 ? `, ${order.deliveryAddress.line2}` : ""}<br />
                                {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}
                            </p>
                        </div>
                    </section>
                )}

                {/* Order Items */}
                <section className="px-6 mb-8">
                    <h3 className="font-heading text-lg font-bold mb-4">Items Ordered</h3>
                    <div className="space-y-4">
                        {order.items.map((item, idx) => (
                            <div key={idx} className="flex gap-4 rounded-3xl bg-paper p-4">
                                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-white">
                                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                                </div>
                                <div className="flex flex-col justify-between py-1">
                                    <div>
                                        <h4 className="font-heading font-bold leading-tight">{item.name}</h4>
                                        <p className="text-sm text-muted">Quantity: {item.quantity}</p>
                                    </div>
                                    <p className="font-bold">₹{item.price * item.quantity}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Payment Summary */}
                <section className="px-6">
                    <div className="rounded-3xl border border-muted/10 bg-white/50 p-6">
                        <h3 className="font-heading text-lg font-bold mb-4">Payment Details</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted">Subtotal</span>
                                <span className="font-medium">₹{order.total}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted">Shipping</span>
                                <span className="font-medium text-nature">Free</span>
                            </div>
                            <div className="my-2 h-[1px] bg-muted/10"></div>
                            <div className="flex justify-between text-base font-bold">
                                <span>Total</span>
                                <span>₹{order.total}</span>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2 rounded-xl bg-muted/5 p-3 text-xs text-muted">
                            <Info className="h-4 w-4 shrink-0" />
                            <p>{order.isPaymentVerified ? `Payment verified · UPI · ${order.date}` : "Payment submitted via UPI — under verification."}</p>
                        </div>
                    </div>
                </section>

                {/* Support Action */}
                <div className="px-6 mt-8">
                    <Button variant="outline" className="w-full rounded-2xl py-6 font-bold">
                        Need Help with this Order?
                    </Button>
                </div>
            </PageContainer>
        </main>
    )
}
