"use client"

import { Button } from "@/components/ui/Button";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductSkeleton } from "@/components/product/ProductSkeleton";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteSettings } from "@/lib/settings";
import { getSiteSettingsAction, getProductsAction, Product } from "@/app/actions";

export default function Home() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHeroLoaded, setIsHeroLoaded] = useState(false);
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);
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
        setFeaturedProducts(productsResult.value.slice(0, 3));
      } else {
        console.error("Failed to load products", productsResult.reason);
      }

      setIsLoading(false);
    }
    loadData();
  }, []);

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-[90vh] w-full overflow-hidden bg-paper">
        <Image
          src={settings?.heroImage || "/hero-bg-v2.jpg"}
          alt="Fuko Tobacco Blend"
          fill
          className={`object-cover brightness-75 transition-all duration-1000 ease-out ${isHeroLoaded ? "opacity-100 blur-0 scale-100" : "opacity-0 blur-xl scale-105"
            }`}
          priority
          onLoad={() => setIsHeroLoaded(true)}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-between pb-12 pt-12 p-6 text-center text-white">
          <div>
            <div className="relative mx-auto mb-6 h-16 w-32">
              <Image src="/fuko-logo-v2.png" alt="Fuko Logo" fill className="object-contain" />
            </div>
            <h1 className={`font-heading text-5xl font-bold leading-tight md:text-7xl drop-shadow-lg transition-opacity duration-350 ${showTitle ? 'opacity-100' : 'opacity-0'}`}>
              {settings?.heroText.title}
            </h1>
            <p className={`mt-4 max-w-md font-body text-lg drop-shadow-md font-medium transition-opacity duration-350 ${showSubtitle ? 'opacity-95' : 'opacity-0'}`}>
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
            Array.from({ length: 3 }).map((_, i) => (
              <ProductSkeleton key={i} className="w-[280px]" />
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
              <p className="text-sm text-muted">We never use &quot;expanded&quot; tobacco or scraps. Only prime leaf structure for a consistent burn.</p>
            </div>
            <div>
              <h4 className="font-bold text-accent">Radical Transparency</h4>
              <p className="text-sm text-muted">From the soil to the pouch, our supply chain is open. You know exactly what you&apos;re smoking.</p>
            </div>
            <div>
              <h4 className="font-bold text-accent">Sovereign Craft</h4>
              <p className="text-sm text-muted">For 500 years, India has grown the world&apos;s best tobacco. We&apos;re finally keeping the best of the harvest right here.</p>
            </div>
            <div>
              <h4 className="font-bold text-accent">Terroir First</h4>
              <p className="text-sm text-muted">We don&apos;t manufacture flavor; we curate it. Whether it&apos;s the bold Regur Black from Guntur or the Kavery Bright from Mysore—prized for its natural sweetness and silky smoothness—the soil does the work.</p>
            </div>
          </div>
        </div>

        {/* About Fuko Section - Collapsible */}
        <div className="rounded-3xl bg-paper p-8 text-center mt-8">
          <button
            onClick={() => setIsAboutExpanded(!isAboutExpanded)}
            className="w-full flex items-center justify-center gap-2 font-heading text-2xl font-bold hover:text-accent transition-colors"
          >
            About Fuko
            <svg
              className={`w-6 h-6 transition-transform ${isAboutExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isAboutExpanded && (
            <div className="mt-6">
              <h4 className="mb-6 font-heading text-xl font-bold text-accent">The 500-Year Leaf</h4>
              <div className="space-y-6 text-left">
                <div>
                  <h5 className="font-bold text-accent mb-2">The Vision</h5>
                  <p className="text-sm text-muted">Fuko was born from a simple observation: India has grown world-class tobacco for over five centuries, yet the modern smoker is often left with industrial, additive-filled commodities. We decided to change the narrative. Based in Goa, we are curators of the Indian terroir, bringing the raw, unadulterated character of our soil back to the ritual of smoking.</p>
                </div>
                <div>
                  <h5 className="font-bold text-accent mb-2">Our Roots: The Goa Connection</h5>
                  <p className="text-sm text-muted">The story of Indian tobacco began where we are today. In the late 1500s, the Portuguese anchored in Goa, bringing with them the first tobacco seeds from the New World. From these Goan shores, the leaf traveled inland, adapting to the diverse microclimates of the subcontinent and becoming an integral part of our agricultural identity.</p>
                  <p className="text-sm text-muted mt-2">Fuko is a post-colonial brand rooted in this gateway. We believe India is no longer just a source of raw materials for global brands. We are a destination for craft. We source our leaves from heritage farms that have perfected their trade over generations, ensuring that the best of the harvest stays exactly where it was grown.</p>
                </div>
                <div>
                  <h5 className="font-bold text-accent mb-2">The Fuko Philosophy</h5>
                  <p className="text-sm text-muted"><strong>Terroir Over Technology:</strong> We don&apos;t manufacture flavor in a lab. We curate it from the land. Whether it&apos;s the punchy intensity of Guntur&apos;s Regur Black or the smooth, river-fed sweetness of Kaveri Bright from Mysore, we let the soil do the talking.</p>
                  <p className="text-sm text-muted mt-2"><strong>The Un-Industrialized Purity:</strong> We define our quality by what we leave out. No chemical additives, no expanded fillers, and no artificial casings. Just 100% whole-leaf tobacco, hand-stripped and slow-cured by the Indian sun.</p>
                  <p className="text-sm text-muted mt-2"><strong>Radical Transparency:</strong> We believe you should know your farmer. Our supply chain is a direct line from the heritage fields of Andhra, Tamil Nadu, and Karnataka straight to your pouch.</p>
                </div>
                <div>
                  <h5 className="font-bold text-accent mb-2">The Ritual</h5>
                  <p className="text-sm text-muted">Fuko is for those who value the process. Rolling your own is an act of mindfulness—a brief pause to engage with a 500-year-old craft that started right here in Goa. We invite you to explore our archives, discover your preferred soil, and reclaim the dignity of the leaf.</p>
                  <p className="text-sm text-muted mt-3 text-center font-medium italic">Know Smoking. Experience Terroir.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
