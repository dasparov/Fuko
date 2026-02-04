"use client"

import { Button } from "@/components/ui/Button";
import { ArrowLeft, Check, Minus, Plus, Share2, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { getProductsAction, Product } from "@/app/actions";

export default function ProductPage() {
    const params = useParams();
    const slug = params.slug as string;
    const router = useRouter();
    const { addItem } = useCart();

    const [product, setProduct] = useState<Product | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [activeImage, setActiveImage] = useState(0);
    const [isAdding, setIsAdding] = useState(false);

    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

    useEffect(() => {
        // Simulate fetch delay for premium feel
        async function load() {
            try {
                const allProducts = await getProductsAction();
                const found = allProducts.find(p => p.id === slug);

                if (!found) {
                    router.push("/shop");
                    return;
                }
                setProduct(found);
                setRelatedProducts(allProducts.filter(p => !p.isHidden && p.id !== found.id));
            } catch (error) {
                console.error("Failed to load product", error);
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, [slug, router]);

    if (isLoading || !product) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4 text-muted">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p className="font-heading font-bold text-xs uppercase tracking-widest">Loading Archives...</p>
                </div>
            </main>
        );
    }

    // Adapt single image/tag to array format for UI compatibility
    const images = product.images || []

    const tags = product.tag ? [product.tag.label] : [];

    const handleAddToCart = () => {
        if (isAdding) return;

        setIsAdding(true);
        addItem({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: quantity,
            image: product.images[0] || "/placeholder.png"
        });

        setTimeout(() => {
            router.push('/cart');
        }, 800);
    };

    return (
        <main className="min-h-screen bg-background pb-32">
            {/* Header */}
            <div className="fixed top-0 z-40 flex w-full items-center justify-between p-6">
                <Link href="/" className="rounded-full bg-white/50 p-2 backdrop-blur-md">
                    <ArrowLeft className="h-6 w-6" />
                </Link>
                <button className="rounded-full bg-white/50 p-2 backdrop-blur-md">
                    <Share2 className="h-6 w-6" />
                </button>
            </div>

            {/* Image Gallery */}
            <div className="relative h-[60vh] w-full overflow-hidden rounded-b-4xl bg-paper">
                <Image
                    src={images[activeImage]}
                    alt={product.name}
                    fill
                    className="object-cover"
                    priority
                />
                {/* Pagination Dots (Only if > 1 image) */}
                {images.length > 1 && (
                    <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
                        {images.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setActiveImage(i)}
                                className={`h-2 w-2 rounded-full transition-all ${i === activeImage ? "w-6 bg-primary" : "bg-primary/30"}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Product Details */}
            <div className="px-6 pt-8">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="font-heading text-3xl font-bold leading-tight">
                            {product.name}
                        </h1>
                        <div className="mt-2 flex gap-2">
                            {tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="rounded-full bg-paper px-3 py-1 text-xs font-medium text-muted"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="block font-heading text-2xl font-bold">₹{product.price}</span>
                        <span className="text-xs text-muted">Incl. taxes</span>
                    </div>
                </div>

                <div className="mt-8">
                    <h3 className="font-heading text-lg font-bold">Description</h3>
                    <p className="mt-2 text-base leading-relaxed text-muted">
                        {product.description || "No description available for this item."}
                    </p>
                </div>

                <div className="mt-8">
                    <h3 className="font-heading text-lg font-bold">Delivery</h3>
                    <ul className="mt-2 space-y-2 text-sm text-muted">
                        <li className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-nature" />
                            <span>Ships within 24 hours</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-nature" />
                            <span>Free shipping on orders over ₹500</span>
                        </li>
                    </ul>
                </div>

                {/* Related Products / More from Archives */}
                <div className="mt-16 pb-32">
                    <div className="mb-6 flex items-end justify-between">
                        <h3 className="font-heading text-lg font-bold">More from Archives</h3>
                        <Link href="/shop" className="text-xs font-bold text-muted underline">View All</Link>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
                        {relatedProducts.map((p: Product) => (
                            <Link key={p.id} href={`/product/${p.id}`} className="shrink-0 w-48 group">
                                <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-paper mb-3">
                                    <Image
                                        src={p.images[0] || "/placeholder.png"}
                                        alt={p.name}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                </div>
                                <p className="font-bold text-sm line-clamp-1">{p.name}</p>
                                <p className="text-xs text-muted">₹{p.price}</p>
                            </Link>
                        ))}
                    </div>
                </div>

            </div>

            {/* Sticky Bottom Bar */}
            <div className="fixed bottom-[84px] left-0 z-40 w-full border-t border-muted/10 bg-background px-6 py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] md:bottom-0 md:pb-8">
                <div className="flex items-center gap-4">
                    {/* Quantity Stepper */}
                    <div className="flex items-center gap-4 rounded-pill border border-muted/20 bg-paper px-4 py-3">
                        <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="text-muted hover:text-primary"
                        >
                            <Minus className="h-4 w-4" />
                        </button>
                        <span className="min-w-[20px] text-center font-heading font-bold">{quantity}</span>
                        <button
                            onClick={() => setQuantity(quantity + 1)}
                            className="text-muted hover:text-primary"
                        >
                            <Plus className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Add to Cart / Buy Now */}
                    <Button
                        size="pill"
                        className={`flex-1 font-bold overflow-hidden transition-all duration-300 ${isAdding ? 'bg-green-600 scale-105' : ''}`}
                        onClick={handleAddToCart}
                        disabled={isAdding}
                    >
                        {isAdding ? (
                            <span className="flex items-center justify-center gap-2 animate-pulse">
                                <Check className="h-5 w-5" />
                                Added!
                            </span>
                        ) : (
                            <>Add - ₹{product.price * quantity}</>
                        )}
                    </Button>
                </div>
            </div>
        </main >
    );
}
