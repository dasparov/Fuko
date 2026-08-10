import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { BlendCharacter, SCALE_MAX, dotPosition } from "@/lib/blend-character"
import { cn } from "@/lib/utils"

// Screen readers get a sentence; the circles and tracks are decoration and are
// hidden from them. Without this the meters are literally invisible to anyone
// not looking at the screen.
const srText = (label: string, value: number, low: string, high: string) =>
    `${label}: ${value} of ${SCALE_MAX}, ${low} to ${high}`

/**
 * The thumbnail line — body only. Finish and curing belong on the product page:
 * strength is what people browse on, character is what they read about once
 * they are interested.
 */
export function BlendDots({ character, className }: { character?: BlendCharacter; className?: string }) {
    if (!character) return null

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-muted/70">Body</span>
            <span className="flex items-center gap-1" aria-hidden="true">
                {Array.from({ length: SCALE_MAX }, (_, i) => (
                    <span
                        key={i}
                        className={cn(
                            "h-[5px] w-[5px] rounded-full",
                            i < character.body ? "bg-primary" : "bg-muted/25"
                        )}
                    />
                ))}
            </span>
            <span className="sr-only">{srText("Body", character.body, "mild", "regular")}</span>
        </div>
    )
}

function Track({ label, value, low, high }: { label: string; value: number; low: string; high: string }) {
    return (
        <div>
            <div className="flex items-baseline justify-between">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{label}</span>
                <span className="sr-only">{srText(label, value, low, high)}</span>
            </div>
            <div className="relative mt-2 h-[3px] rounded-full bg-muted/20" aria-hidden="true">
                <span
                    className="absolute top-1/2 h-[11px] w-[11px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent ring-4 ring-background"
                    style={{ left: `${dotPosition(value) * 100}%` }}
                />
            </div>
            <div className="mt-2 flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted/70" aria-hidden="true">
                <span>{low}</span>
                <span>{high}</span>
            </div>
        </div>
    )
}

/**
 * The product page block: both axes on the band every blend shares, plus the
 * curing process. Curing is a category rather than a scale, so it is a label —
 * a meter would imply more or less of it.
 */
export function BlendMeters({ character }: { character?: BlendCharacter }) {
    if (!character) return null

    return (
        <div className="mt-8 rounded-3xl bg-paper/60 p-6">
            <div className="grid gap-6 sm:grid-cols-2">
                <Track label="Body" value={character.body} low="mild" high="regular" />
                <Track label="Finish" value={character.finish} low="dry" high="sweet" />
            </div>

            {character.curing && (
                <div className="mt-6 border-t border-muted/15 pt-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                        {character.curing.name}
                    </p>
                    <p className="mt-1 text-sm italic leading-relaxed text-muted">
                        {character.curing.note}
                    </p>
                    <Link
                        href="/field-notes"
                        className="mt-3 inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-[0.15em] text-accent underline-offset-4 hover:underline"
                    >
                        What curing does <ArrowRight className="h-3 w-3" />
                    </Link>
                </div>
            )}
        </div>
    )
}
