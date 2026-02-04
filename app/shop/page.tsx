"use client"

import { ProductCard } from "@/components/product/ProductCard"
import { ProductSkeleton } from "@/components/product/ProductSkeleton"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { getProductsAction, Product } from "@/app/actions"

export default function ShopPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function load() {
            try {
                const data = await getProductsAction()
                setProducts(data)
            } catch (err) {
                console.error("Failed to load products", err)
            } finally {
                setIsLoading(false)
            }
        }
        load()
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
                    // Show 6 skeleton cards
                    Array.from({ length: 6 }).map((_, i) => (
                        <ProductSkeleton key={i} />
                    ))
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
                                images={product.images}
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
