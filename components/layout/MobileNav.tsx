"use client"

import { Home, ShoppingBag, User } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useCart } from "@/context/CartContext"
import { motion } from "framer-motion"

export function MobileNav() {
    const pathname = usePathname()
    const { cartCount } = useCart()

    const navItems = [
        { href: "/", icon: Home, label: "Home" },
        { href: "/cart", icon: ShoppingBag, label: "Cart" },
        { href: "/profile", icon: User, label: "Account" },
    ]

    return (
        <div className="fixed bottom-0 left-0 z-50 w-full border-t border-muted/20 bg-background/80 px-6 py-4 backdrop-blur-lg md:hidden">
            <nav className="flex items-center justify-between">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "relative flex flex-col items-center justify-center gap-1 transition-colors",
                                isActive ? "text-primary" : "text-muted hover:text-primary"
                            )}
                        >
                            <motion.div
                                className="relative"
                                animate={isActive ? { scale: 1.25, y: -4 } : { scale: 1, y: 0 }}
                                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                            >
                                <item.icon className={cn("h-6 w-6", isActive && "fill-current")} />
                                {item.label === "Cart" && cartCount > 0 && (
                                    <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
                                        {cartCount}
                                    </span>
                                )}

                            </motion.div>
                            <motion.span
                                animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0.6, y: 0 }}
                                className="text-[10px] uppercase tracking-wider font-bold relative"
                            >
                                {item.label}
                                {isActive && (
                                    <motion.div
                                        layoutId="nav-indicator"
                                        className="absolute -bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-accent"
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                    />
                                )}
                            </motion.span>
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}
