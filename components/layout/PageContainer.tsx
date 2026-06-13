import { cn } from "@/lib/utils"

/**
 * Centers page content and caps its width on desktop so the mobile-first layout
 * doesn't stretch edge-to-edge on large screens. On phones the max-width is wider
 * than the viewport, so this is a no-op there (mobile layout is unchanged).
 */
export function PageContainer({
  children,
  width = "wide",
  className,
}: {
  children: React.ReactNode
  width?: "narrow" | "medium" | "wide"
  className?: string
}) {
  const max =
    width === "narrow" ? "max-w-xl" : width === "medium" ? "max-w-3xl" : "max-w-6xl"
  return <div className={cn("mx-auto w-full", max, className)}>{children}</div>
}
