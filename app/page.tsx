"use client"

import { Button } from "@/components/ui/Button";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductSkeleton } from "@/components/product/ProductSkeleton";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteSettings } from "@/lib/settings";
import { getSiteSettingsAction, getProductsAction, Product } from "@/app/actions";
import { PageContainer } from "@/components/layout/PageContainer";

// Module-level cache: survives client-side navigation, so returning to the home
// page paints instantly from the last fetch instead of re-showing skeletons.
// Refreshed silently on every visit; a full reload starts clean.
let homeCache: { settings: SiteSettings; products: Product[] } | null = null;

// The Archives index — numbered like entries in a register.
const VALUES = [
  { title: "Unadulterated Purity", body: "We define ourselves by what we don't have. No chemicals. No casings. Just leaf." },
  { title: "Whole-Leaf Quality", body: "Never expanded tobacco or scraps — only prime leaf structure, for a consistent burn." },
  { title: "Radical Transparency", body: "From the soil to the pouch, the supply chain is open. You know exactly what you're smoking." },
  { title: "Sovereign Craft", body: "For 500 years India has grown the world's best tobacco. We're keeping the best of the harvest here." },
  { title: "Terroir First", body: "We don't manufacture flavor; we curate it. Regur Black from Guntur, Kavery Bright from Mysore — the soil does the work." },
];

export default function Home() {
  const [settings, setSettings] = useState<SiteSettings | null>(homeCache?.settings ?? null);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>(homeCache?.products ?? []);
  const [isLoading, setIsLoading] = useState(!homeCache);
  const [isHeroLoaded, setIsHeroLoaded] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(false);

  useEffect(() => {
    // Show title immediately on mount
    setShowTitle(true);

    async function loadData() {
      // Load both resources in parallel; if one fails, the other can still succeed.
      const [settingsResult, productsResult] = await Promise.allSettled([
        getSiteSettingsAction(),
        getProductsAction()
      ]);

      if (settingsResult.status === "fulfilled") {
        setSettings(settingsResult.value);
        // Show subtitle after settings load
        setTimeout(() => setShowSubtitle(true), 300);
      } else {
        console.error("Failed to load settings", settingsResult.reason);
      }

      if (productsResult.status === "fulfilled") {
        setFeaturedProducts(productsResult.value);
      } else {
        console.error("Failed to load products", productsResult.reason);
      }

      if (settingsResult.status === "fulfilled" && productsResult.status === "fulfilled") {
        homeCache = { settings: settingsResult.value, products: productsResult.value };
      }

      setIsLoading(false);
    }
    loadData();
  }, []);

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-[90vh] w-full overflow-hidden bg-paper md:h-[70vh]">
        {/* Mobile: portrait hero (admin-configurable). Hidden on desktop. */}
        <Image
          src={settings?.heroImage || "/hero-bg-v2.jpg"}
          alt="Fuko Tobacco Blend"
          fill
          className={`object-cover brightness-75 transition-all duration-1000 ease-out md:hidden ${isHeroLoaded ? "opacity-100 blur-0 scale-100" : "opacity-0 blur-xl scale-105"
            }`}
          priority
          onLoad={() => setIsHeroLoaded(true)}
        />
        {/* Desktop: landscape hero. Hidden on mobile. */}
        <Image
          src="/hero-landscape.jpg"
          alt="Fuko Tobacco Blend"
          fill
          className={`hidden object-cover brightness-75 transition-all duration-1000 ease-out md:block ${isHeroLoaded ? "opacity-100 blur-0 scale-100" : "opacity-0 blur-xl scale-105"
            }`}
          priority
          onLoad={() => setIsHeroLoaded(true)}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-between pb-12 pt-12 p-6 text-center text-white">
          <div>
            <div className="relative mx-auto mb-6 h-16 w-32">
              <Image src="/fuko-logo-v2.png" alt="Fuko Logo" fill className="object-contain" />
            </div>
            <h1 className={`font-heading text-5xl font-bold leading-tight md:text-7xl drop-shadow-lg transition-all duration-500 ease-in-out ${showTitle && settings?.heroText.title ? 'opacity-100' : 'opacity-0'}`}>
              {settings?.heroText.title}
            </h1>
            <p className={`mt-4 max-w-md font-body text-lg drop-shadow-md font-medium transition-all duration-500 ease-in-out ${showSubtitle && settings?.heroText.subtitle ? 'opacity-95' : 'opacity-0'}`}>
              {settings?.heroText.subtitle}
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
          <span>{settings?.tickerText} • </span>
          <span>{settings?.tickerText} • </span>
          <span>{settings?.tickerText} • </span>
          <span>{settings?.tickerText} • </span>
        </div>
      </div>

      <PageContainer>
      {/* Featured Products — horizontal scroll on mobile, grid on desktop */}
      <section id="shop" className="py-12 px-6">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-heading text-3xl font-bold text-primary">
            The Archives
          </h2>
          <Link href="/shop" className="font-body text-sm font-medium text-muted underline">
            View All
          </Link>
        </div>

        {/* Scroll on mobile / grid on desktop */}
        <div className="flex gap-4 overflow-x-auto pb-8 scrollbar-hide md:grid md:grid-cols-2 md:gap-8 md:overflow-visible">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <ProductSkeleton key={i} className="w-[280px] md:w-full" />
            ))
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
                className="w-[280px] md:w-full"
              />
            ))
          )}
        </div>
      </section>

      {/* Values Section — archive index / ledger */}
      <section className="px-6 pb-24">
        <div className="border-t border-primary pt-4">
          <div className="mb-2 flex items-baseline justify-between gap-4">
            <h3 className="font-heading text-sm font-extrabold uppercase tracking-[0.22em]">The Fuko Archives</h3>
            <span className="whitespace-nowrap text-[10px] uppercase tracking-[0.18em] text-muted">Index of principles · No. 01–05</span>
          </div>
          {VALUES.map((v, i) => (
            <div
              key={v.title}
              className={`grid gap-y-1.5 py-7 md:grid-cols-[minmax(240px,4fr)_6fr] md:gap-x-8 ${i === VALUES.length - 1 ? "border-b border-primary" : "border-b border-primary/10"}`}
            >
              <div className="flex items-baseline gap-3.5">
                <span className="text-[15px] font-black tabular-nums tracking-wide text-accent">{`0${i + 1}`}</span>
                <h4 className="text-[13px] font-extrabold uppercase tracking-[0.2em]">{v.title}</h4>
              </div>
              <p className="max-w-[52ch] text-[15px] leading-relaxed text-muted md:-mt-0.5">{v.body}</p>
            </div>
          ))}
        </div>

        {/* About Fuko — the record */}
        <div className="mt-20 border-t border-primary pt-4">
          <div className="mb-2 flex items-baseline justify-between gap-4">
            <h3 className="font-heading text-sm font-extrabold uppercase tracking-[0.22em]">About Fuko</h3>
            <span className="whitespace-nowrap text-[10px] uppercase tracking-[0.18em] text-muted">The record · est. notes</span>
          </div>
          <h4 className="mb-7 mt-4 max-w-[22ch] font-heading text-2xl font-bold leading-tight md:text-4xl" style={{ textWrap: "balance" }}>
            The 500-year leaf, <span className="text-accent">finally kept</span> where it was grown.
          </h4>
          <div className="gap-12 text-[15px] leading-relaxed text-muted md:columns-2">
            <p className="mb-4" style={{ breakInside: "avoid-column" }}>
              Tobacco reached India on Portuguese ships five centuries ago and never left. The plant found its soils — the light sands of the Mysore plateau, the hard tracts of the Deccan, the black alluvium of the Godavari delta — and became something the world quietly built its blends on.
            </p>
            <p style={{ breakInside: "avoid-column" }}>
              The best leaf was always exported. Fuko exists to keep it. Small lots, whole leaf, no casings, packed by hand in paper and clay — the harvest, held back for the people who grew up next to it.
            </p>
          </div>
          <span className="mt-10 inline-block -rotate-2 rounded-sm border border-accent px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.22em] text-accent">
            Know Smoking · Experience Terroir
          </span>
        </div>
      </section>
      </PageContainer>
    </main>
  );
}
