"use client"

import { Button } from "@/components/ui/Button";
import { ProductCard } from "@/components/product/ProductCard";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getSiteSettings, SiteSettings } from "@/lib/settings";
import { getProducts, Product } from "@/lib/inventory";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setSettings(getSiteSettings());
      const products = getProducts();
      // For now, let's say "Best Seller" or "Limited" are featured
      setFeaturedProducts(products.filter(p => !p.isHidden).slice(0, 3));
      setIsLoading(false);
    }, 0)
  }, []);

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-[90vh] w-full overflow-hidden">
        <Image
          src={settings?.heroImage || "/hero-bg-v2.jpg"}
          alt="Fuko Tobacco Blend"
          fill
          className="object-cover brightness-75"
          priority
        />
        <div className="absolute inset-0 flex flex-col items-center justify-between pb-12 pt-12 p-6 text-center text-white">
          <div>
            <div className="relative mx-auto mb-6 h-16 w-32">
              <Image src="/fuko-logo-v2.png" alt="Fuko Logo" fill className="object-contain" />
            </div>
            <h1 className="font-heading text-5xl font-bold leading-tight md:text-7xl drop-shadow-lg">
              {settings?.heroText.title || "Know Smoking."}
            </h1>
            <p className="mt-4 max-w-md font-body text-lg opacity-95 drop-shadow-md font-medium">
              {settings?.heroText.subtitle || "100% Additive-free tobacco. No expanded filler. Just the raw, unadulterated plant."}
            </p>
          </div>

          <div className="mt-auto pt-8">
            <Link href="/shop">
              <Button size="pill" variant="pill" className="shadow-xl">
                Experience Fuko
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Marquee Section */}
      <div className="relative flex overflow-x-hidden bg-accent py-3 text-white">
        <div className="animate-marquee whitespace-nowrap font-heading text-sm font-bold tracking-widest uppercase">
          <span>{settings?.tickerText || "ZERO ADDITIVES • NO EXPANDED VOLUME • 100% WHOLE LEAF"} • </span>
          <span>{settings?.tickerText || "ZERO ADDITIVES • NO EXPANDED VOLUME • 100% WHOLE LEAF"} • </span>
          <span>{settings?.tickerText || "ZERO ADDITIVES • NO EXPANDED VOLUME • 100% WHOLE LEAF"} • </span>
          <span>{settings?.tickerText || "ZERO ADDITIVES • NO EXPANDED VOLUME • 100% WHOLE LEAF"} • </span>
        </div>
      </div>

      {/* Featured Products (Horizontal Scroll) */}
      <section id="shop" className="py-12 pl-6">
        <div className="mb-6 flex items-end justify-between pr-6">
          <h2 className="font-heading text-3xl font-bold text-primary">
            The Archives
          </h2>
          <Link href="/shop" className="font-body text-sm font-medium text-muted underline">
            View All
          </Link>
        </div>

        {/* Scroll Container */}
        <div className="flex gap-4 overflow-x-auto pb-8 pr-6 scrollbar-hide">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 w-full text-muted">
              <Loader2 className="h-6 w-6 animate-spin mb-2" />
              <p className="font-bold text-[10px] uppercase tracking-widest">Opening Archives...</p>
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="py-10 text-muted italic">No blends currently available.</div>
          ) : (
            featuredProducts.map(product => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                price={product.price}
                description={product.description}
                images={product.images}
                tag={product.tag}
              />
            ))
          )}
        </div>
      </section>

      {/* Values Section */}
      <section className="px-6 pb-24">
        <div className="rounded-3xl bg-paper p-8 text-center">
          <h3 className="mb-4 font-heading text-2xl font-bold">The Fuko Archives</h3>
          <div className="space-y-6">
            <div>
              <h4 className="font-bold text-accent">Unadulterated Purity</h4>
              <p className="text-sm text-muted">We define ourselves by what we don&apos;t have. No chemicals. No casings. Just leaf.</p>
            </div>
            <div>
              <h4 className="font-bold text-accent">Whole-Leaf Quality</h4>
              <p className="text-sm text-muted">We never use &quot;expanded&quot; tobacco or scraps. Only the prime leaf structure for a consistent burn.</p>
            </div>
            <div>
              <h4 className="font-bold text-accent">Radical Transparency</h4>
              <p className="text-sm text-muted">From the soil to the pouch, our supply chain is open. You know what you&apos;re smoking.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
