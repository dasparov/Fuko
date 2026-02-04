"use client"

export interface SiteSettings {
    announcementBanner: {
        text: string
        isVisible: boolean
        link?: string
    }
    heroText: {
        title: string
        subtitle: string
    }
    heroImage?: string
    tickerText?: string
}

const STORAGE_KEY = "fuko_settings_v3"

const DEFAULT_SETTINGS: SiteSettings = {
    announcementBanner: {
        text: "Experience the Archives: Free shipping on orders over ₹1500",
        isVisible: true,
        link: "/shop"
    },
    heroText: {
        title: "know Smoking",
        subtitle: "Premium Indian Tobacco defined by its soil. Experience true terroir character."
    },
    heroImage: "/hero-bg-v2.jpg",
    tickerText: "ZERO ADDITIVES • NO EXPANDED VOLUME • 100% WHOLE LEAF • NATIVE CURING PROCESS • HAND SELECTED"
}

export const getSiteSettings = (): SiteSettings => {
    if (typeof window === "undefined") return DEFAULT_SETTINGS
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS))
        return DEFAULT_SETTINGS
    }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
}

export const saveSiteSettings = (settings: SiteSettings): boolean => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
        return true
    } catch {
        return false
    }
}
