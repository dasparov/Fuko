"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

export type CartItem = {
    id: string
    name: string
    price: number
    quantity: number
    image: string
}

type CartContextType = {
    items: CartItem[]
    addItem: (item: CartItem) => void
    removeItem: (id: string) => void
    clearCart: () => void
    cartCount: number
    cartTotal: number
    /** True once the cart has been read from localStorage. Use this before
     *  acting on an "empty" cart so you don't react to the pre-hydration state. */
    hydrated: boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([])
    const [hydrated, setHydrated] = useState(false)

    // Load cart from local storage on mount, then mark as hydrated.
    useEffect(() => {
        const savedCart = localStorage.getItem("fuko-cart")
        if (savedCart) {
            try {
                setItems(JSON.parse(savedCart))
            } catch (e) {
                console.error("Failed to parse cart", e)
            }
        }
        setHydrated(true)
    }, [])

    // Persist cart — but only AFTER the initial load, so we never overwrite
    // saved data with the empty initial state (which wiped the cart on reload).
    useEffect(() => {
        if (!hydrated) return
        localStorage.setItem("fuko-cart", JSON.stringify(items))
    }, [items, hydrated])

    const addItem = (newItem: CartItem) => {
        setItems((prev) => {
            const existing = prev.find((item) => item.id === newItem.id)
            if (existing) {
                return prev.map((item) =>
                    item.id === newItem.id
                        ? { ...item, quantity: item.quantity + newItem.quantity }
                        : item
                )
            }
            return [...prev, newItem]
        })
    }

    const removeItem = (id: string) => {
        setItems((prev) => prev.filter((item) => item.id !== id))
    }

    const clearCart = () => setItems([])

    const cartCount = items.reduce((sum, item) => sum + item.quantity, 0)
    const cartTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

    return (
        <CartContext.Provider
            value={{ items, addItem, removeItem, clearCart, cartCount, cartTotal, hydrated }}
        >
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext)
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider")
    }
    return context
}
