"use client"

import { Button } from "@/components/ui/Button"
import { useCart } from "@/context/CartContext"
import { Check } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { cn } from "@/lib/utils"

import { motion } from "framer-motion"

interface ProductCardProps {
    id: string
    name: string
    price: number
    description: string
    image: string
    tag?: { label: string, color: "accent" | "nature" }
    className?: string
}

export function ProductCard({ id, name, price, description, image, tag, className }: ProductCardProps) {
    const { addItem } = useCart()
    const [isAdding, setIsAdding] = useState(false)

    const handleAdd = (e: React.MouseEvent) => {
        e.preventDefault() // Prevent navigation if clicking the button inside a Link
        e.stopPropagation()

        if (isAdding) return

        setIsAdding(true)
        addItem({
            id,
            name,
            price,
            quantity: 1,
            image
        })

        // Reset after animation
        setTimeout(() => {
            setIsAdding(false)
        }, 1500)
    }

    return (
        <motion.div
            whileHover={{ y: -8 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className={cn("relative shrink-0 snap-start group", className || "w-[280px]")}
        >
            <Link href={`/product/${id}`} className="block">
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl bg-paper">
                    {tag && (
                        <span className={`absolute left-4 top-4 z-10 rounded-full px-3 py-1 text-xs font-bold text-white shadow-sm ${tag.color === 'accent' ? 'bg-accent' : 'bg-nature'}`}>
                            {tag.label}
                        </span>
                    )}

                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.4 }}
                        className="relative h-full w-full"
                    >
                        {image ? (
                            <div className="relative h-full w-full">
                                <Image
                                    src={image}
                                    alt={name}
                                    fill
                                    className="object-cover"
                                    unoptimized={image.startsWith("data:")}
                                />
                            </div>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-muted/20 text-4xl font-bold">
                                ?
                            </div>
                        )}
                    </motion.div>
                </div>
            </Link>

            <div className="mt-4 flex flex-col gap-1">
                <Link href={`/product/${id}`}>
                    <h3 className="font-heading text-xl font-bold line-clamp-1 h-7">{name}</h3>
                </Link>
                <p className="font-body text-sm text-muted line-clamp-2 h-10">{description}</p>
                <div className="mt-2 flex items-center justify-between">
                    <span className="font-heading text-lg font-bold">₹{price}</span>
                    <Button
                        size="sm"
                        className={`rounded-full transition-all duration-300 ${isAdding ? 'bg-green-600 px-4' : ''}`}
                        onClick={handleAdd}
                        disabled={isAdding}
                    >
                        {isAdding ? (
                            <span className="flex items-center gap-1 animate-in fade-in zoom-in duration-300">
                                <Check className="h-3 w-3" />
                                Added
                            </span>
                        ) : (
                            "Add"
                        )}
                    </Button>
                </div>
            </div>
        </motion.div>
    )
}
