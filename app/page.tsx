"use client"

import { Button } from "@/components/ui/Button";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductSkeleton } from "@/components/product/ProductSkeleton";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SiteSettings } from "@/lib/settings";
import { getSiteSettingsAction, getProductsAction, Product } from "@/app/actions";
import { PageContainer } from "@/components/layout/PageContainer";

// Module-level cache: survives client-side navigation, so returning to the home
// page paints instantly from the last fetch instead of re-showing skeletons.
// Refreshed silently on every visit; a full reload starts clean.
let homeCache: { settings: SiteSettings; products: Product[] } | null = null;

// The Archives index — numbered like entries in a register. Each entry opens
// into a longer archival note (the former long-form About copy, redistributed).
const VALUES = [
  {
    title: "Unadulterated Purity",
    body: "We define ourselves by what we don't have. No chemicals. No casings. Just leaf.",
    note: "We define our quality by what we leave out. No chemical additives, no expanded fillers, no artificial casings. Whole-leaf tobacco, hand-stripped, cured slowly under the Indian sun.",
  },
  {
    title: "Whole-Leaf Quality",
    body: "Never expanded tobacco or scraps. Only prime leaf, chosen for structure and an even burn.",
    note: "India has grown world-class tobacco for five centuries, and the smoker still ends up with an industrial commodity. Fuko is the other option: prime leaf chosen for structure and burn, never scraps.",
  },
  {
    title: "Radical Transparency",
    body: "The supply chain is open from the field to the pouch. You know exactly what you're smoking.",
    note: "You should know your farmer. Ours runs a direct line from fields in Andhra, Tamil Nadu and Karnataka to the pouch in your hand.",
  },
  {
    title: "Sovereign Craft",
    body: "For 500 years India has grown the world's best tobacco. We're keeping the best of the harvest here.",
    note: "In the late 1500s the Portuguese anchored in Goa carrying the first tobacco seeds from the New World. The leaf moved inland from there and stayed. Fuko starts at that same gateway, treating India as somewhere craft comes from rather than raw material.",
  },
  {
    title: "Terroir First",
    body: "We don't manufacture flavor, we pick it. Regur Black from Guntur, Kavery Bright from Mysore. The soil does the work.",
    note: "Rolling your own is a short pause inside a 500-year-old craft that started right here in Goa. Find the soil you like best, and give the leaf its due.",
  },
];

// Fires once when the element scrolls into view.
function useInView<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function IndexRow({ v, i, open, onToggle }: { v: (typeof VALUES)[number]; i: number; open: boolean; onToggle: () => void }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const delay = (extra = 0) => ({ transitionDelay: inView ? `${i * 90 + extra}ms` : "0ms" });
  return (
    <div
      ref={ref}
      className={`relative transition-all duration-700 motion-reduce:transition-none ${inView ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}
      style={delay()}
    >
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="group relative grid w-full gap-y-1.5 py-7 pr-10 text-left transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-[0.985] md:grid-cols-[minmax(240px,4fr)_6fr] md:gap-x-8"
      >
        <span
          aria-hidden
          className={`absolute right-1 top-7 flex h-6 w-6 items-center justify-center rounded-full border border-accent/40 text-[15px] font-black leading-none text-accent transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:border-accent ${open ? "rotate-45 bg-accent text-white" : "rotate-0"}`}
        >
          +
        </span>
        <div className="flex items-center gap-3.5 transition-transform duration-300 md:group-hover:translate-x-1.5">
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[15px] font-black tabular-nums transition-all duration-500 motion-reduce:transition-none ${open ? "bg-accent text-white" : "text-accent"} ${inView ? "scale-100 opacity-100" : "scale-[1.15] opacity-0"}`}
            style={delay(150)}
          >
            {`0${i + 1}`}
          </span>
          <h4 className="text-[13px] font-extrabold uppercase leading-snug tracking-[0.2em] transition-all duration-300 group-hover:tracking-[0.24em]">{v.title}</h4>
        </div>
        <p className="max-w-[52ch] text-[15px] leading-relaxed text-muted transition-colors duration-300 group-hover:text-primary md:-mt-0.5">{v.body}</p>
      </button>
      <div className={`grid transition-[grid-template-rows] duration-500 motion-reduce:transition-none ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <p className="max-w-[62ch] pb-7 pl-[42px] text-sm leading-relaxed text-muted">{v.note}</p>
        </div>
      </div>
      <span
        className={`absolute bottom-0 left-0 h-px bg-primary/10 transition-[width] duration-700 ease-out motion-reduce:transition-none`}
        style={{ width: inView ? "100%" : "0%", ...delay() }}
      />
    </div>
  );
}

function ArchiveIndex() {
  const [openEntry, setOpenEntry] = useState<number | null>(null);
  const { ref, inView } = useInView<HTMLDivElement>(0.1);
  return (
    <div className="border-t border-primary pt-4">
      <div ref={ref} className={`mb-2 flex items-baseline justify-between gap-4 transition-opacity duration-700 motion-reduce:transition-none ${inView ? "opacity-100" : "opacity-0"}`}>
        <h3 className="font-heading text-sm font-extrabold uppercase tracking-[0.22em]">The Fuko Archives</h3>
        <span className="whitespace-nowrap text-[10px] uppercase tracking-[0.18em] text-muted">Index of principles · No. 01–05</span>
      </div>
      {VALUES.map((v, i) => (
        <IndexRow key={v.title} v={v} i={i} open={openEntry === i} onToggle={() => setOpenEntry(openEntry === i ? null : i)} />
      ))}
    </div>
  );
}

function AboutRecord() {
  const { ref, inView } = useInView<HTMLDivElement>(0.2);
  const shown = inView ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0";
  return (
    <div ref={ref} className="relative mt-20 border-t border-primary pb-80 pt-4">
      {/* Old engraving of the Goa fort, ghosted into the paper (multiply melts the
          white away, leaving faint ink lines behind the record). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0"
        style={{
          maskImage: "linear-gradient(to bottom, transparent 30%, black 75%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 30%, black 75%)",
        }}
      >
        <Image src="/goa-fort.jpg" alt="" width={1400} height={793} className="h-auto w-full opacity-[0.16] mix-blend-multiply" />
      </div>
      <div className={`relative mb-2 flex items-baseline justify-between gap-4 transition-opacity duration-700 motion-reduce:transition-none ${inView ? "opacity-100" : "opacity-0"}`}>
        <h3 className="font-heading text-sm font-extrabold uppercase tracking-[0.22em]">About Fuko</h3>
        <span className="whitespace-nowrap text-[10px] uppercase tracking-[0.18em] text-muted">The record · est. notes</span>
      </div>
      <div className="relative mt-4">
        <h4 className={`mb-7 max-w-[22ch] font-heading text-2xl font-bold leading-tight transition-all duration-700 motion-reduce:transition-none md:text-4xl ${shown}`} style={{ textWrap: "balance" }}>
          The 500-year leaf, <span className="text-accent">finally kept</span> where it was grown.
        </h4>
        <div className={`gap-12 text-[15px] leading-relaxed text-muted transition-all delay-150 duration-700 motion-reduce:transition-none md:columns-2 ${shown}`}>
          <p className="mb-4" style={{ breakInside: "avoid-column" }}>
            Tobacco reached India on Portuguese ships five centuries ago and never left. The plant found its soils — the light sands of the Mysore plateau, the hard tracts of the Deccan, the black alluvium of the Godavari delta — and became something the world quietly built its blends on.
          </p>
          <p style={{ breakInside: "avoid-column" }}>
            The best leaf was always exported. Fuko exists to keep it. Small lots, whole leaf, no casings, packed by hand in paper and clay — the harvest, held back for the people who grew up next to it.
          </p>
        </div>
        <span
          className={`mt-10 inline-block rounded-sm border border-accent px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.22em] text-accent transition-all delay-[400ms] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none ${inView ? "-rotate-2 scale-100 opacity-100" : "rotate-0 scale-[1.3] opacity-0"}`}
        >
          Know Smoking · Experience Terroir
        </span>
      </div>
    </div>
  );
}

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
        {/* Mounted only once the text is here. The bullet is a literal, so
            rendering during the settings fetch painted a row of bare dots —
            and the animation would have burned part of its cycle against
            empty content, so the text jumped in mid-scroll instead of
            starting from the right. The bar keeps its height either way, so
            nothing shifts when the text arrives. */}
        {settings?.tickerText && (
          <div className="animate-marquee whitespace-nowrap font-heading text-sm font-bold tracking-widest uppercase">
            <span>{settings.tickerText} • </span>
            <span>{settings.tickerText} • </span>
            <span>{settings.tickerText} • </span>
            <span>{settings.tickerText} • </span>
          </div>
        )}
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
                isAvailable={product.isAvailable}
                className="w-[280px] md:w-full"
              />
            ))
          )}
        </div>
      </section>

      {/* Values + About — animated archive index / record */}
      <section className="px-6 pb-24">
        <ArchiveIndex />
        <AboutRecord />
      </section>
      </PageContainer>
    </main>
  );
}
