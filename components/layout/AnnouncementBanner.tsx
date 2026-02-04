"use client"

import { useEffect, useState } from "react"
import { getSiteSettingsAction } from "@/app/actions"
import { SiteSettings, DEFAULT_SETTINGS } from "@/lib/settings"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { usePathname } from "next/navigation"
export function AnnouncementBanner() {
    // Start with defaults so it doesn't "pop" in or hide if fetch fails
    const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS)
    const pathname = usePathname()

    useEffect(() => {
        async function load() {
            try {
                const s = await getSiteSettingsAction()
                setSettings(s)
            } catch (err) {
                console.error("Banner load error:", err)
            }
        }
        load()
    }, [])

    if (!settings?.announcementBanner.isVisible || pathname?.startsWith("/admin") || pathname?.startsWith("/fukoadmin")) return null

    const Content = (
        <div className="bg-accent py-2 px-6 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
                {settings.announcementBanner.text}
            </p>
        </div>
    )

    return (
        <AnimatePresence>
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
            >
                {settings.announcementBanner.link ? (
                    <Link href={settings.announcementBanner.link}>
                        {Content}
                    </Link>
                ) : Content}
            </motion.div>
        </AnimatePresence>
    )
}
