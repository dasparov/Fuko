import { Skeleton } from "@/components/ui/Skeleton"

/** Order card placeholder — used in admin Orders and the Profile order history. */
export function OrderCardSkeleton() {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
        <div className="flex-1 space-y-2 py-1">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
    </div>
  )
}

/** Saved-address card placeholder — used in the Profile "Saved Locations" list. */
export function AddressCardSkeleton() {
  return (
    <div className="space-y-2 rounded-3xl border border-muted/10 bg-white p-5">
      <Skeleton className="h-4 w-16 rounded-md" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  )
}

/**
 * Checkout placeholder shown while the session/profile resolves. Mirrors the
 * "Select Delivery Address" screen a returning user lands on, so the transition
 * doesn't feel like a blank/loading flash.
 */
export function CheckoutLoadingSkeleton() {
  return (
    <div>
      <Skeleton className="mb-4 h-6 w-48 rounded-md" /> {/* "Select Delivery Address" heading */}
      <div className="space-y-4">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-3xl bg-paper p-5">
            <Skeleton className="mb-2 h-5 w-14 rounded-md" /> {/* type badge */}
            <Skeleton className="mb-2 h-4 w-2/3" /> {/* address line 1 */}
            <Skeleton className="h-3 w-5/6" /> {/* line 2 / city / pincode */}
          </div>
        ))}
        {/* "+ Add New Address" placeholder */}
        <div className="rounded-3xl border-2 border-dashed border-muted/20 p-5">
          <Skeleton className="mx-auto h-4 w-40" />
        </div>
      </div>
    </div>
  )
}
