"use client"

import { Button } from "@/components/ui/Button"
import { useCart, CartItem } from "@/context/CartContext"
import { ArrowLeft, Minus, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function CartPage() {
    const { items, addItem, removeItem, cartTotal } = useCart()

    /* Helper to decrease quantity or remove if 1 */
    const decreaseQuantity = (item: CartItem) => {
        if (item.quantity > 1) {
            addItem({ ...item, quantity: -1 })
        } else {
            removeItem(item.id)
        }
    }

    if (items.length === 0) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
                <h2 className="font-heading text-3xl font-bold">Your Bag is Empty</h2>
                <p className="mt-2 text-muted">Time to roll something special.</p>
                <Link href="/shop" className="mt-8">
                    <Button variant="pill" size="pill">Start Shopping</Button>
                </Link>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-background pb-32 pt-20">
            <div className="fixed top-0 z-40 flex w-full items-center justify-between p-6 bg-background/80 backdrop-blur-md">
                <Link href="/" className="flex items-center gap-2 font-heading text-lg font-bold">
                    <ArrowLeft className="h-5 w-5" />
                    Back
                </Link>
                <span className="font-heading text-lg font-bold">My Bag</span>
            </div>

            <div className="px-6 space-y-6">
                {items.map((item) => (
                    <div key={item.id} className="flex gap-4 rounded-3xl bg-paper p-4">
                        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-white">
                            {/* Placeholder logic again */}
                            {item.image.startsWith("/") ? (
                                <Image src={item.image} alt={item.name} fill className="object-cover" />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-muted/20">
                                    {item.name[0]}
                                </div>
                            )}
                        </div>
                        <div className="flex flex-1 flex-col justify-between">
                            <div>
                                <h3 className="font-heading text-lg font-bold leading-tight">{item.name}</h3>
                                <p className="text-sm font-bold text-muted">₹{item.price}</p>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 rounded-full bg-white px-3 py-1 shadow-sm">
                                    <button onClick={() => decreaseQuantity(item)} className="p-1">
                                        <Minus className="h-3 w-3" />
                                    </button>
                                    <span className="min-w-[12px] text-center text-sm font-bold">{item.quantity}</span>
                                    <button onClick={() => addItem({ ...item, quantity: 1 })} className="p-1">
                                        <Plus className="h-3 w-3" />
                                    </button>
                                </div>
                                <button onClick={() => removeItem(item.id)} className="text-muted hover:text-destructive">
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="fixed bottom-20 left-0 w-full border-t border-muted/10 bg-background px-6 py-6">
                <div className="mb-4 flex items-center justify-between font-heading text-xl font-bold">
                    <span>Total</span>
                    <span>₹{cartTotal}</span>
                </div>
                <Link href="/checkout">
                    <Button size="pill" variant="pill" className="w-full">
                        Checkout via UPI
                    </Button>
                </Link>
            </div>

        </main>
    )
}
