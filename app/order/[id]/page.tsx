"use client"

import { Button } from "@/components/ui/Button"
import { getOrderById, Order } from "@/lib/orders"
import { ArrowLeft, Check, Clock, Package, Truck, Info } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"

import { useParams } from "next/navigation"

export default function OrderDetailsPage() {
    const params = useParams()
    const id = params?.id as string
    const [order, setOrder] = useState<Order | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!id) return

        setTimeout(() => {
            // Decode ID to handle potential URL encoding issues
            const decodedId = decodeURIComponent(id)
            const data = getOrderById(decodedId)
            if (data) setOrder(data)
            setLoading(false)
        }, 0)
    }, [id])

    if (loading) return <div className="flex min-h-screen items-center justify-center">Loading...</div>

    if (!order) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
                <h1 className="font-heading text-2xl font-bold">Order Not Found</h1>
                <p className="mt-2 text-sm text-muted">ID: {id}</p>
                <Link href="/profile" className="mt-4 text-accent hover:underline bg-paper px-4 py-2 rounded-full">Back to Profile</Link>
            </main>
        )
    }

    const steps = [
        { status: "Processing", icon: Clock },
        { status: "Shipped", icon: Package },
        { status: "Out for Delivery", icon: Truck },
        { status: "Delivered", icon: Check }
    ]

    const currentStepIndex = steps.findIndex(s => s.status === order.status)
    // If status is not in the list (e.g. Cancelled), handle smoothly. For now assume it is.
    const activeIndex = currentStepIndex !== -1 ? currentStepIndex : 0

    return (
        <main className="min-h-screen bg-background pb-32 pt-8">
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

            {/* Tracking Timeline */}
            <section className="px-6 mb-8">
                <div className="rounded-3xl bg-paper p-6">
                    <h2 className="font-heading text-lg font-bold mb-6">Tracking Status</h2>
                    <div className="relative flex justify-between">
                        {/* Progress Bar Background */}
                        <div className="absolute top-[15px] left-0 h-[2px] w-full bg-muted/10 -z-0"></div>
                        {/* Active Progress Bar (approximate width based on step) */}
                        <div
                            className={`absolute top-[15px] left-0 h-[2px] transition-all duration-500 -z-0 ${order.status === 'Delivered' ? 'bg-nature' : 'bg-accent'}`}
                            style={{ width: `${(activeIndex / (steps.length - 1)) * 100}%` }}
                        ></div>

                        {steps.map((step, index) => {
                            const Icon = step.icon
                            const isActive = index <= activeIndex
                            const isCurrent = index === activeIndex

                            // Determine active colors
                            const activeBg = order.status === 'Delivered' ? 'bg-nature shadow-lg shadow-nature/20' : 'bg-accent shadow-lg shadow-accent/20'
                            const activeText = order.status === 'Delivered' ? 'text-nature' : 'text-accent'

                            return (
                                <div key={step.status} className="relative z-10 flex flex-col items-center gap-2">
                                    <div className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${isActive ? `${activeBg} text-white` : 'bg-white text-muted border border-muted/20'}`}>
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    {isCurrent && (
                                        <div className="absolute top-10 w-24 text-center">
                                            <p className={`text-[10px] font-bold uppercase tracking-wider bg-white/80 backdrop-blur px-2 py-1 rounded-full shadow-sm ${activeText}`}>{step.status}</p>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                    {/* Spacing for status label */}
                    <div className="h-4"></div>
                </div>
            </section>

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
                            <span>Total Paid</span>
                            <span>₹{order.total}</span>
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 rounded-xl bg-muted/5 p-3 text-xs text-muted">
                        <Info className="h-4 w-4" />
                        <p>Paid via UPI on {order.date}</p>
                    </div>
                </div>
            </section>

            {/* Support Action */}
            <div className="px-6 mt-8">
                <Button variant="outline" className="w-full rounded-2xl py-6 font-bold">
                    Need Help with this Order?
                </Button>
            </div>

        </main>
    )
}
