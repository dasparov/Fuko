"use client"

import { useEffect, useState } from "react"
import { getSiteSettings, SiteSettings } from "@/lib/settings"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"

export function AnnouncementBanner() {
    const [settings, setSettings] = useState<SiteSettings | null>(null)

    useEffect(() => {
        setTimeout(() => {
            setSettings(getSiteSettings())
        }, 0)
    }, [])

    if (!settings?.announcementBanner.isVisible) return null

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
