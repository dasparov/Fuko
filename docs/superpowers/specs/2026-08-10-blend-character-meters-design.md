# Blend character meters — design

**Date:** 2026-08-10
**Status:** Approved (brainstormed with owner; fixed perceptual band chosen)

## Problem

Every blend looks the same in the store. A customer browsing four products has
the name, a two-line description and a price, and nothing that answers the only
question they actually have: *how strong is it, and what does it taste like?*
The copy answers it, but only if you read three paragraphs first.

Fuko does not sell strong tobacco — nobody wants it — so the real range is
narrow: roughly 1.2% nicotine (Light Soils) to 1.4% (Turkish). That narrowness
is the selling point, not a problem to hide.

## Approach

A **fixed perceptual band** shared by every blend, positioned by how the smoke
is perceived rather than by lab values.

Two alternatives were rejected:

- **Absolute scale (0–5% nicotine).** Maximally honest and useless: at true
  scale a 1.2 and a 1.4 are visually indistinguishable, and it puts a nicotine
  percentage on a public product page.
- **Relative to Fuko's own range.** Most dramatic, actively misleading — a 17%
  real difference rendered as 0% vs 100%. It also inverts the brand story by
  making Turkish look like the harsh one, and breaks the moment a third blend
  lands between them.

The fixed band keeps the gap real *and* does the marketing work: every Fuko
blend sits in the lower half of the same axis, so "we don't sell harsh" becomes
something the customer sees instead of something we claim.

Deliberately **no number and no "light"/"mild" product descriptor**: descriptors
implying reduced harm are restricted under WHO FCTC Article 11 and India's
COTPA packaging rules. The axis describes the *body of the smoke*, not safety.

## Data

One integer per axis, 1–5, as the single source of truth. Both views derive
from it, so there is no second set of numbers to drift.

```ts
// lib/blend-character.ts (new)
export interface BlendCharacter {
    body: number     // 1 mild → 5 regular
    finish: number   // 1 dry  → 5 sweet
    // A category, not a scale. `name` is the plain process — it is the factual
    // anchor and the phrase people actually search. `note` is the sell.
    curing?: { name: string; note: string }
}

export const BLEND_CHARACTER: Record<string, BlendCharacter> = {
    "light-soils-blend": {
        body: 2,
        finish: 3,
        curing: { name: "Flue-cured", note: "hung in barns, cured on piped heat — no smoke touches the leaf" },
    },
    "turkish-blend": {
        body: 3,
        finish: 1,
        curing: { name: "Sun-cured", note: "strung on bamboo, dried in open Deccan air" },
    },
    "dark-soils-blend": {
        body: 4,
        finish: 4,
        curing: { name: "Fire-cured", note: "hung over smouldering hardwood until it takes the smoke" },
    },
}
```

Kept in code, not in Postgres: blend character changes about as often as a
blend is renamed. If that stops being true, move it to `products` columns plus
admin sliders — the components take a `BlendCharacter`, not a product id, so
only the lookup changes.

**Values are the owner's to tune.** `turkish-blend` is the only one grounded in
existing copy ("sun-cured… a long dry finish"); the rest are first guesses,
approved for shipping and expected to be corrected once rendered.

### The curing label

Two fields, because it does two jobs. `name` is the bare process — "Sun-cured",
"Air-cured" — which is the factual claim and the long-tail search phrase
("sun-cured tobacco India"). `note` is one short clause in the site's existing
voice, drawn from the product copy rather than invented, that turns a spec into
heritage:

```
SUN-CURED
strung on bamboo, dried in open Deccan air
```

Process name in letterspaced caps at label weight; the note beneath it in the
muted body face. The note is a fragment, not a sentence — no full stop, no
adjectives doing sales work the fact already does.

The two notes also do quiet contrast work. Sun-cured is open air and bamboo;
flue-cured is barns and piped heat with no smoke on the leaf. Read side by side
they explain why the blends taste different without the copy having to say so.

All three processes came from the owner or from his own product copy — Dark
Soils is "fire-cured over smouldering hardwood" in its description, Light Soils
is "flue-cured slow". **`curing` is omitted where unknown**: how a leaf was
cured is a factual claim about the product and will not be invented to fill the
slot. The label renders only when the value is present, so a future blend with
no recorded process shows meters and no label.

### Products with no entry render nothing

`terracotta-button` is a clay humidity button, not tobacco. It has no entry, so
it shows no body meter, no finish meter and no curing label. This falls out of
the design rather than needing a special case, and it is the reason lookup
returns `undefined` rather than a zeroed default.

## Components

### `components/product/BlendCharacter.tsx` (new)

- `<BlendDots character>` — the thumbnail line: `BODY ●●○○○`, `body` filled of
  five. Body only; finish and curing do not appear on a thumbnail.
- `<BlendMeters character>` — the product page block: two labelled tracks with
  a dot at `(n − 0.5) / 5` of the track width, end-labelled *mild / regular*
  and *dry / sweet*, plus the curing label when present.

Both render `null` when `character` is undefined.

**Accessibility:** dots and tracks are decorative to a screen reader, so each
meter carries its own text — `Body: 2 of 5, mild to regular` — via a
visually-hidden span. The circles are `aria-hidden`.

### `components/product/ProductCard.tsx` (edit)

`<BlendDots>` between the description and the price row.

**Fixed-height slot.** The thumbnail row is a horizontal scroller whose cards
line up because name and description have fixed heights (`h-7`, `h-10`). The
dots slot reserves its height even when empty, or Terracotta Button's card
comes up short and breaks the row alignment.

### `app/product/[slug]/page.tsx` (edit)

`<BlendMeters>` between the price block and the Description heading.

## Testing

One test file, `lib/blend-character.test.ts`, covering the lookup and the
derived geometry:

- a known id returns its character
- an unknown id (`terracotta-button`) returns `undefined`
- dot count equals `body`
- track position for `body: 2` is `0.3`, and every value 1–5 lands strictly
  inside the track (never at 0 or 1, which would put the dot on the end cap)

Rendering is not unit-tested; there is no component test harness in this
project and adding one is out of scope.

## Out of scope

- Admin editing of blend character.
- Curing on the thumbnail — the badge corner is already spoken for by
  Best Seller / Limited / New.
- Any third axis (aroma, burn rate). Two meters and a label is the whole thing.
