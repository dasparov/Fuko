"use client"

import { Button } from "@/components/ui/Button"
import { signIn } from "next-auth/react"
import { useRef, useState } from "react"
import { toast } from "sonner"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface AuthPanelProps {
  /** Where Google redirects back to, and where to send the user after a successful email sign-in. */
  callbackUrl?: string
  /**
   * Called after a successful email-OTP sign-in instead of navigating to callbackUrl.
   * If omitted, AuthPanel navigates to callbackUrl with a full load so useSession() picks up the new session.
   */
  onSuccess?: () => void
}

export function AuthPanel({ callbackUrl = "/", onSuccess }: AuthPanelProps) {
  const [mode, setMode] = useState<"choices" | "email" | "code">("choices")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const codeRef = useRef<HTMLInputElement>(null)

  const handleGoogle = () => {
    setLoading(true)
    // Full OAuth redirect; control leaves the page.
    signIn("google", { callbackUrl })
  }

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!EMAIL_RE.test(email)) {
      toast.error("Please enter a valid email address")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/auth/email-otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        toast.success("Code sent! Check your email.")
        setMode("code")
        setCode("")
        setTimeout(() => codeRef.current?.focus(), 100)
      } else if (res.status === 429) {
        toast.error("Too many requests. Please try again in a little while.")
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || "Failed to send code")
      }
    } catch {
      toast.error("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length < 6) {
      toast.error("Please enter the 6-digit code")
      return
    }
    setLoading(true)
    try {
      // Client-side sign-in so next-auth sets the session cookie in the browser.
      const result = await signIn("email-otp", { email, code, redirect: false })
      if (result?.error) {
        toast.error("Invalid or expired code")
        setCode("")
        codeRef.current?.focus()
      } else {
        toast.success("Signed in!")
        if (onSuccess) onSuccess()
        else window.location.assign(callbackUrl)
      }
    } catch {
      toast.error("Verification failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // CODE ENTRY
  if (mode === "code") {
    return (
      <form onSubmit={handleVerify} className="space-y-6">
        <div className="text-center">
          <h2 className="font-heading text-xl font-bold">Enter the code</h2>
          <p className="text-sm text-muted">We sent a 6-digit code to {email}</p>
        </div>

        <div className="relative flex justify-center gap-2">
          {/* Hidden real input drives the segmented display */}
          <input
            ref={codeRef}
            type="tel"
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="absolute inset-0 z-10 cursor-default opacity-0"
            maxLength={6}
            autoFocus
            disabled={loading}
          />
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <div
              key={index}
              className={`flex h-14 w-11 items-center justify-center rounded-2xl bg-paper text-2xl font-bold transition-all ring-2 ${
                code.length === index ? "ring-accent/50 scale-105 bg-white" : "ring-transparent"
              }`}
            >
              {code[index] || ""}
            </div>
          ))}
        </div>

        <Button size="pill" className="w-full py-6 text-lg" disabled={loading || code.length < 6}>
          {loading ? "Verifying..." : "Verify & Continue"}
        </Button>
        <button
          type="button"
          onClick={() => setMode("email")}
          className="w-full text-sm font-bold text-muted hover:text-accent transition-colors"
          disabled={loading}
        >
          Use a different email
        </button>
      </form>
    )
  }

  // EMAIL ENTRY
  if (mode === "email") {
    return (
      <form onSubmit={handleSendCode} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-muted">Email address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-2xl border-none bg-paper px-6 py-4 text-lg font-medium outline-none ring-2 ring-transparent transition-all focus:ring-accent/20"
            autoFocus
            disabled={loading}
          />
        </div>
        <Button size="pill" className="w-full py-6 text-lg" disabled={loading || !EMAIL_RE.test(email)}>
          {loading ? "Sending..." : "Send code"}
        </Button>
        <button
          type="button"
          onClick={() => setMode("choices")}
          className="w-full text-sm font-bold text-muted hover:text-accent transition-colors"
          disabled={loading}
        >
          Back
        </button>
      </form>
    )
  }

  // CHOICES
  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={handleGoogle}
        disabled={loading}
        className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white py-4 text-base font-bold shadow-sm ring-2 ring-muted/10 transition-all hover:ring-accent/20 disabled:opacity-50"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
        </svg>
        Continue with Google
      </button>

      <div className="flex items-center gap-4">
        <div className="h-[1px] flex-1 bg-muted/15" />
        <span className="text-xs font-bold uppercase tracking-wider text-muted">or</span>
        <div className="h-[1px] flex-1 bg-muted/15" />
      </div>

      <Button
        size="pill"
        variant="outline"
        className="w-full rounded-2xl py-6 text-lg"
        disabled={loading}
        onClick={() => setMode("email")}
      >
        Continue with email
      </Button>
    </div>
  )
}
