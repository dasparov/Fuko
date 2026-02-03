"use client"

import { ProductCard } from "@/components/product/ProductCard"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { getProducts, Product } from "@/lib/inventory"

export default function ShopPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // In a real app this might be an async fetch
        setTimeout(() => {
            const data = getProducts()
            setProducts(data.filter(p => !p.isHidden))
            setIsLoading(false)
        }, 0)
    }, [])

    return (
        <main className="min-h-screen bg-background pb-32 pt-16">
            {/* Header */}
            <div className="flex items-center justify-between px-6 mb-12">
                <Link href="/" className="flex items-center gap-2">
                    <button className="rounded-full bg-paper p-2 text-muted hover:text-primary">
                        <ArrowLeft className="h-6 w-6" />
                    </button>
                </Link>
                <h1 className="font-heading text-3xl font-bold uppercase tracking-tight">The Archives</h1>
                <div className="w-10"></div> {/* Spacer for alignment */}
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 gap-8 px-6 sm:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-muted">
                        <Loader2 className="h-8 w-8 animate-spin mb-4" />
                        <p className="font-bold text-xs uppercase tracking-widest">Opening Archives...</p>
                    </div>
                ) : products.length === 0 ? (
                    <div className="col-span-full text-center py-20 text-muted">
                        <p className="font-bold text-xs uppercase tracking-widest">The Archives are currently closed.</p>
                    </div>
                ) : (
                    products.map(product => (
                        <div key={product.id} className={!product.isAvailable ? "opacity-75 grayscale-[0.5]" : ""}>
                            <ProductCard
                                id={product.id}
                                name={product.name}
                                price={product.price}
                                description={product.description}
                                image={product.image}
                                tag={!product.isAvailable ? { label: "Sold Out", color: "nature" } : product.tag}
                                className="w-full"
                            />
                            {!product.isAvailable && (
                                <p className="mt-2 text-center text-[10px] font-black uppercase tracking-widest text-nature">Restocking from the archives soon</p>
                            )}
                        </div>
                    ))
                )}
            </div>
        </main>
    )
}
