"use client"

import { Home, ShoppingBag, User } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useCart } from "@/context/CartContext"

/**
 * Floating bottom-center nav for desktop (md+). The mobile bottom bar is
 * `md:hidden`, so this is the desktop equivalent — same destinations, as a
 * centered floating pill.
 */
export function DesktopNav() {
    const pathname = usePathname()
    const { cartCount } = useCart()

    const navItems = [
        { href: "/", icon: Home, label: "Home" },
        { href: "/cart", icon: ShoppingBag, label: "Cart" },
        { href: "/profile", icon: User, label: "Account" },
    ]

    return (
        <nav className="fixed bottom-6 left-1/2 z-50 hidden -translate-x-1/2 items-center gap-1 rounded-full border border-muted/15 bg-background/80 px-2 py-2 shadow-xl backdrop-blur-lg md:flex">
            {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "relative flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-colors",
                            isActive ? "bg-accent text-white" : "text-muted hover:bg-paper hover:text-primary",
                        )}
                    >
                        <item.icon className={cn("h-5 w-5", isActive && "fill-current")} />
                        <span>{item.label}</span>
                        {item.label === "Cart" && cartCount > 0 && (
                            <span
                                className={cn(
                                    "absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ring-2 ring-background",
                                    isActive ? "bg-white text-accent" : "bg-accent text-white",
                                )}
                            >
                                {cartCount}
                            </span>
                        )}
                    </Link>
                )
            })}
        </nav>
    )
}
