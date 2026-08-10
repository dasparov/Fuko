"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "./Button"
import Image from "next/image"

export function AgeGate() {
    const [isVisible, setIsVisible] = useState<boolean | null>(null)

    useEffect(() => {
        setTimeout(() => {
            // Check if user has already verified their age
            const isVerified = localStorage.getItem("fuko_age_verified")
            if (isVerified) {
                setIsVisible(false)
            } else {
                setIsVisible(true)
            }
        }, 0)
    }, [])

    const handleConfirm = () => {
        localStorage.setItem("fuko_age_verified", "true")
        setIsVisible(false)
    }

    const handleExit = () => {
        window.location.href = "https://www.google.com"
    }

    if (isVisible === null || !isVisible) return null

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-2xl px-6"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 25 }}
                        className="relative max-w-md w-full rounded-[2.5rem] bg-paper p-8 sm:p-12 text-center shadow-2xl border border-white/20"
                    >
                        <div className="relative mx-auto mb-8 h-12 w-24 grayscale opacity-80">
                            <Image src="/fuko-logo-v2.png" alt="Fuko Logo" fill className="object-contain" />
                        </div>

                        <h2 className="font-heading text-3xl font-bold mb-4 tracking-tight">Access Restricted</h2>
                        <div className="text-muted mb-10 text-sm font-medium space-y-1">
                            <p>Fuko creates premium blends for adults only.</p>
                            <p>Verify you are 21+ to enter the archives.</p>
                        </div>

                        <div className="space-y-4">
                            <Button
                                size="pill"
                                variant="pill"
                                className="w-full bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20 h-14 text-lg"
                                onClick={handleConfirm}
                            >
                                I&apos;m 21+ Enter Site
                            </Button>
                            <button
                                onClick={handleExit}
                                className="w-full text-muted font-bold text-sm hover:text-primary transition-colors py-2 tracking-widest uppercase"
                            >
                                Exit
                            </button>
                        </div>

                        <p className="mt-12 text-[10px] uppercase tracking-[0.2em] text-muted/40 font-bold">
                            Radical Transparency • Raw Tobacco
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
