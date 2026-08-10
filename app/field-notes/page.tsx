import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { PageContainer } from "@/components/layout/PageContainer"

export const metadata: Metadata = {
    title: "Field Notes | Fuko",
    description:
        "How leaf becomes tobacco: flue, air, fire and sun curing, and the four soils of India that grow it. Plain notes from the archives.",
}

// Static copy only — no product data, no database. This page exists to be read
// and repeated at a table, so every section is built around one fact a person
// can carry away rather than a paragraph they have to summarise.

const CURES = [
    {
        name: "Flue-cured",
        also: "Virginia · Bright Leaf",
        blend: "Light Soils Blend",
        body: "Leaf hangs in a sealed barn while heat travels through metal pipes — flues — running along the floor. The fire never shares air with the tobacco. Five to seven days, climbing slowly, and the leaf goes gold.",
        fact: "Because no smoke ever reaches it, everything you taste is the leaf's own sugar. Heat locks that sugar in before the plant can burn it off. Bright, grassy, clean — and the reason it is called Bright Leaf.",
    },
    {
        name: "Air-cured",
        also: "Burley",
        blend: null,
        body: "No fire at all. The barn is built to be leaky on purpose: slatted walls that open and close with the weather, and the leaf hangs for four to eight weeks doing nothing but losing water.",
        fact: "Left alone that long, the plant spends its own sugars. Air-cured leaf comes out almost sugarless and tastes of the leaf itself — nutty and dry, nothing sweet to hide behind.",
    },
    {
        name: "Fire-cured",
        also: "Dark Fired",
        blend: "Dark Soils Blend",
        body: "Hardwood smoulders on the barn floor for days or weeks — never flaming, just breathing smoke up through the racks. The oldest method still in use, and the slowest.",
        fact: "This is the only cure where smoke is an ingredient rather than an accident. The leaf takes it on the way real food takes smoke, which is why fire-cured tobacco reads as deep and tarry next to anything else.",
    },
    {
        name: "Sun-cured",
        also: "Oriental · Turkish",
        blend: "Turkish Blend",
        body: "Strung on cord or bamboo and left in the open. No barn, no fire, no control beyond where you hang it and when you bring it in.",
        fact: "Oriental plants are kept small and thirsty on hard ground — a stressed plant makes fewer, smaller leaves and pours its energy into aromatic oils instead of size. Small leaf, loud smell. The stress is the recipe.",
    },
]

const SOILS = [
    {
        name: "Black cotton",
        local: "regur",
        where: "the Deccan",
        body: "Ground-up lava. The Deccan Traps went up around 66 million years ago in one of the largest volcanic events the planet has on record, and what is left is a deep black clay that holds water like a sponge.",
        fact: "In the dry months it cracks open so wide and so deep that the cracks turn the soil over on their own. Farmers call it self-ploughing ground.",
    },
    {
        name: "Alluvial",
        local: "the delta soils",
        where: "the Godavari and Krishna deltas",
        body: "Not local rock at all — silt carried down off the plateau and dropped where the rivers slow and fan out to meet the sea. Heavy, dark, and topped up every flood.",
        fact: "The ground a delta blend grows in was somewhere else entirely a few hundred kilometres upstream. The river is still delivering it.",
    },
    {
        name: "Light sandy loam",
        local: "the light soils",
        where: "the Karnataka plateau",
        body: "Quick-draining, low in nutrition, and warm. Water runs straight through instead of sitting around the roots.",
        fact: "Poor ground makes better tobacco. A plant that has to work for water puts less into bulk and more into what you actually smoke — the same reason thin, stony soil is prized in a vineyard.",
    },
    {
        name: "Red laterite",
        local: "lateritic soil",
        where: "the coast and the Western Ghats",
        body: "Rust. Monsoon rain has washed everything soluble out of this ground for millennia and left the iron behind, which is exactly why it is that colour.",
        fact: "Cut it wet and it slices like cheese; leave it in the sun and it sets hard as brick. Laterite blocks quarried this way are holding up buildings across the coast that are centuries old.",
    },
]

export default function FieldNotesPage() {
    return (
        <main className="min-h-screen bg-background pb-24 pt-8">
            {/* PageContainer only centres and caps width — it adds no horizontal
                padding by design, so every page supplies its own. */}
            <PageContainer className="px-6">
                <Link
                    href="/shop"
                    className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-muted transition-colors hover:text-primary"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to the Archives
                </Link>

                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-accent">
                    Field Notes
                </p>
                <h1 className="mt-3 font-heading text-4xl font-bold leading-tight sm:text-5xl">
                    How leaf becomes tobacco
                </h1>
                <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
                    Four ways to cure a leaf and four kinds of ground to grow it in. None of
                    this is proprietary and none of it is complicated — it is just rarely
                    written down anywhere you would actually read it.
                </p>

                {/* The season. Sits first because it is the thing that explains an empty
                    shelf, and a customer who lands here from an out-of-season blend is
                    looking for exactly this. */}
                <section className="mt-14 rounded-3xl bg-paper/60 p-8">
                    <h2 className="font-heading text-2xl font-bold">Two seasons, one field</h2>
                    <p className="mt-4 leading-relaxed text-muted">
                        The Indian farming year splits in two.{" "}
                        <span className="font-bold text-primary">Kharif</span> goes into the
                        ground with the monsoon in June and comes off in autumn — it drinks
                        the rain as it falls.{" "}
                        <span className="font-bold text-primary">Rabi</span> goes in as the
                        monsoon pulls back in October, lives on the water the soil kept behind,
                        and is cut through the winter.
                    </p>
                    <p className="mt-4 leading-relaxed text-muted">
                        Both names are borrowed Arabic, and both describe the gathering rather
                        than the sowing: <span className="italic">kharif</span> is autumn,{" "}
                        <span className="italic">rabi</span> is spring. Two harvests, the same
                        field, twice a year.
                    </p>
                    <p className="mt-4 leading-relaxed text-muted">
                        Tobacco grows in both, and the season shows up in the leaf. Rain-grown
                        leaf and leaf raised on what the ground held back are not the same
                        thing, even from the same seed in the same soil — which is why a blend
                        belongs to the season that made it. When that season's leaf is gone we
                        do not reconstitute it and we do not pad it with the last crop to keep
                        a shelf full. It comes back when the crop does.
                    </p>
                </section>

                {/* Curing */}
                <section className="mt-16">
                    <h2 className="font-heading text-3xl font-bold">The four cures</h2>
                    <p className="mt-3 max-w-2xl leading-relaxed text-muted">
                        Every leaf comes off the field green, wet and inedible. Curing is
                        controlled drying — and how you control it decides almost everything
                        about how the tobacco ends up tasting. Same plant, four answers.
                    </p>

                    <div className="mt-8 grid gap-5 md:grid-cols-2">
                        {CURES.map((c, i) => (
                            <article key={c.name} className="rounded-3xl border border-muted/15 p-7">
                                <div className="flex items-baseline gap-3">
                                    <span className="font-heading text-2xl font-bold text-accent">
                                        {String(i + 1).padStart(2, "0")}
                                    </span>
                                    <div>
                                        <h3 className="font-heading text-xl font-bold">{c.name}</h3>
                                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted/70">
                                            {c.also}
                                        </p>
                                    </div>
                                </div>

                                <p className="mt-5 leading-relaxed text-muted">{c.body}</p>

                                <p className="mt-4 border-l-2 border-accent/40 pl-4 leading-relaxed text-primary">
                                    {c.fact}
                                </p>

                                {c.blend && (
                                    <p className="mt-5 text-[10px] font-black uppercase tracking-[0.15em] text-muted/70">
                                        In the archives · {c.blend}
                                    </p>
                                )}
                            </article>
                        ))}
                    </div>
                </section>

                {/* Soils */}
                <section className="mt-16">
                    <h2 className="font-heading text-3xl font-bold">The ground it came from</h2>
                    <p className="mt-3 max-w-2xl leading-relaxed text-muted">
                        India grows more tobacco than almost anywhere on earth, on ground that
                        changes completely every few hundred kilometres. The soil is not
                        background detail — it is the first thing that decides what the leaf
                        can become.
                    </p>

                    <div className="mt-8 space-y-4">
                        {SOILS.map(s => (
                            <article key={s.name} className="rounded-3xl bg-paper/60 p-7">
                                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                                    <h3 className="font-heading text-xl font-bold">{s.name}</h3>
                                    <span className="text-sm italic text-muted">{s.local}</span>
                                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted/70">
                                        {s.where}
                                    </span>
                                </div>
                                <p className="mt-4 leading-relaxed text-muted">{s.body}</p>
                                <p className="mt-4 border-l-2 border-nature/40 pl-4 leading-relaxed text-primary">
                                    {s.fact}
                                </p>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="mt-16 rounded-3xl bg-primary p-8 text-background sm:p-10">
                    <h2 className="font-heading text-2xl font-bold">
                        All of that is on the label
                    </h2>
                    <p className="mt-3 max-w-xl leading-relaxed opacity-80">
                        Every blend in the archives says which soil it came off and how it was
                        cured. Now it means something.
                    </p>
                    <Link
                        href="/shop"
                        className="mt-6 inline-flex items-center gap-2 rounded-full bg-background px-6 py-3 font-bold text-primary transition-transform hover:scale-105"
                    >
                        See the blends <ArrowRight className="h-4 w-4" />
                    </Link>
                </section>
            </PageContainer>
        </main>
    )
}
