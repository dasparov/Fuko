// How a blend is perceived, on a band shared by every blend in the store.
// Design: docs/superpowers/specs/2026-08-10-blend-character-meters-design.md
//
// Deliberately NOT nicotine percentages. The real spread is narrow — about 1.2%
// to 1.4% — because Fuko does not sell harsh tobacco. Drawn to true scale those
// two are indistinguishable; drawn relative to each other a 17% difference
// becomes 0% vs 100%. A shared perceptual band keeps the gap real and lets the
// whole range read as approachable, which is the actual selling point.
//
// No number is ever shown and no blend is labelled "light" or "mild" as a
// product descriptor: descriptors implying reduced harm are restricted under
// WHO FCTC Article 11 and India's COTPA rules. These axes describe the body of
// the smoke, not safety.

export interface BlendCharacter {
    /** 1 mild → 5 regular. Fuko sells nothing above 4. */
    body: number
    /** 1 dry → 5 sweet. */
    finish: number
    /**
     * A category, not a scale — so it renders as a label, never a meter.
     * `name` is the bare process: the factual claim, and the phrase people
     * search for. `note` is one fragment in the site's voice, taken from the
     * product copy rather than invented.
     */
    curing?: { name: string; note: string }
}

export const SCALE_MAX = 5

// Every value here comes from the owner or from his own product copy. A curing
// process is a factual claim about how the leaf was made — never fill this in
// by guessing; leave it out and the label simply does not render.
export const BLEND_CHARACTER: Record<string, BlendCharacter> = {
    "light-soils-blend": {
        body: 2,
        finish: 3,
        curing: {
            name: "Flue-cured",
            note: "hung in barns, cured slow on piped heat — no smoke touches the leaf",
        },
    },
    "turkish-blend": {
        body: 3,
        finish: 1,
        curing: {
            name: "Sun-cured",
            note: "strung on bamboo, dried in the open Deccan air",
        },
    },
    "dark-soils-blend": {
        body: 4,
        finish: 4,
        curing: {
            name: "Fire-cured",
            note: "hung over smouldering hardwood until it takes the smoke",
        },
    },
    // terracotta-button is a clay humidity button, not tobacco. No entry, so it
    // shows no meters — which is why this lookup returns undefined rather than
    // a zeroed default.
}

export const characterOf = (productId: string): BlendCharacter | undefined =>
    BLEND_CHARACTER[productId]

/**
 * Where the marker sits along the track, 0–1. Centred in its band so a 1 never
 * pins to the left end cap and a 5 never pins to the right — both would read as
 * "off the scale", which is the opposite of the point.
 */
export const dotPosition = (value: number) => (value - 0.5) / SCALE_MAX
