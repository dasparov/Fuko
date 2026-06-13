"use client"

import { AuthPanel } from "@/components/auth/AuthPanel"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Suspense, useEffect } from "react"

function LoginInner() {
    const { status } = useSession()
    const router = useRouter()
    const searchParams = useSearchParams()
    const callbackUrl = searchParams.get("callbackUrl") || "/"

    useEffect(() => {
        if (status === "authenticated") router.replace(callbackUrl)
    }, [status, callbackUrl, router])

    return (
        <main className="flex min-h-screen flex-col bg-background px-6 pt-8">
            <Link href="/" className="mb-8 block w-fit rounded-full bg-paper p-2">
                <ArrowLeft className="h-6 w-6" />
            </Link>

            <div className="mx-auto w-full max-w-md flex-1">
                <h1 className="mb-2 font-heading text-4xl font-bold">Welcome to Fuko</h1>
                <p className="mb-8 text-muted">
                    Sign in to access your saved blends, addresses, and orders.
                </p>

                <AuthPanel callbackUrl={callbackUrl} />
            </div>
        </main>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginInner />
        </Suspense>
    )
}
