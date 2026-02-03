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
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([])

    // Load cart from local storage on mount
    useEffect(() => {
        setTimeout(() => {
            const savedCart = localStorage.getItem("fuko-cart")
            if (savedCart) {
                try {
                    setItems(JSON.parse(savedCart))
                } catch (e) {
                    console.error("Failed to parse cart", e)
                }
            }
        }, 0)
    }, [])

    // Save cart to local storage whenever it changes
    useEffect(() => {
        localStorage.setItem("fuko-cart", JSON.stringify(items))
    }, [items])

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
            value={{ items, addItem, removeItem, clearCart, cartCount, cartTotal }}
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
