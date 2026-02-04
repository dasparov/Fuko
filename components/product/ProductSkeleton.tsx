
import { Skeleton } from "@/components/ui/Skeleton"
import { cn } from "@/lib/utils"

interface ProductSkeletonProps {
    className?: string
}

export function ProductSkeleton({ className }: ProductSkeletonProps) {
    return (
        <div className={cn("relative shrink-0 snap-start w-full", className)}>
            {/* Image Skeleton */}
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl bg-paper">
                <Skeleton className="h-full w-full" />
            </div>

            {/* Content Skeleton */}
            <div className="mt-4 flex flex-col gap-2">
                {/* Title */}
                <Skeleton className="h-7 w-3/4 rounded-md bg-muted/30" />

                {/* Description (2 lines) */}
                <div className="space-y-1">
                    <Skeleton className="h-4 w-full rounded-sm bg-muted/20" />
                    <Skeleton className="h-4 w-2/3 rounded-sm bg-muted/20" />
                </div>

                {/* Price and Button */}
                <div className="mt-2 flex items-center justify-between">
                    <Skeleton className="h-6 w-16 rounded-md bg-muted/30" />
                    <Skeleton className="h-9 w-16 rounded-full bg-muted/30" />
                </div>
            </div>
        </div>
    )
}
