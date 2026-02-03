"use client"

import { Button } from "@/components/ui/Button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function LoginPage() {
    const [step, setStep] = useState<"phone" | "otp">("phone")
    const [phoneNumber, setPhoneNumber] = useState("")
    const [otp, setOtp] = useState(["", "", "", ""])
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])
    const router = useRouter()

    // Reset OTP when switching steps
    useEffect(() => {
        if (step === "otp") {
            setTimeout(() => {
                setOtp(["", "", "", ""])
                // Focus first input after a slight delay to ensure render
                inputRefs.current[0]?.focus()
            }, 100)
        }
    }, [step])

    const handleSendOtp = (e: React.FormEvent) => {
        e.preventDefault()
        setStep("otp")
    }

    const handleVerify = (e: React.FormEvent) => {
        e.preventDefault()
        if (phoneNumber.length === 10) {
            localStorage.setItem("fuko_user_phone", phoneNumber)
            toast.success("Welcome back!")
            router.push("/profile")
        } else {
            toast.error("Please enter a valid phone number first")
            setStep("phone")
        }
    }

    const handleOtpChange = (index: number, value: string) => {
        // Only allow numbers
        if (value && !/^\d+$/.test(value)) return

        const newOtp = [...otp]
        newOtp[index] = value
        setOtp(newOtp)

        // Move to next input if value is entered
        if (value && index < 3) {
            inputRefs.current[index + 1]?.focus()
        }
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        // Move to previous input on Backspace if current is empty
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
    }

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault()
        const pastedData = e.clipboardData.getData("text").slice(0, 4).split("")
        if (pastedData.every(char => /^\d$/.test(char))) {
            const newOtp = [...otp]
            pastedData.forEach((char, index) => {
                if (index < 4) newOtp[index] = char
            })
            setOtp(newOtp)
            // Focus the last filled index or the next empty one
            const focusIndex = Math.min(pastedData.length, 3)
            inputRefs.current[focusIndex]?.focus()
        }
    }

    return (
        <main className="flex min-h-screen flex-col bg-background px-6 pt-8">
            <Link href="/" className="mb-8 block w-fit rounded-full bg-paper p-2">
                <ArrowLeft className="h-6 w-6" />
            </Link>

            <div className="flex-1">
                <h1 className="mb-2 font-heading text-4xl font-bold">
                    {step === "phone" ? "Welcome Back" : "Verify It's You"}
                </h1>
                <p className="mb-8 text-muted">
                    {step === "phone"
                        ? "Enter your number to access your saved blends and addresses."
                        : "We sent a code to +91 98765 43210"}
                </p>

                {step === "phone" ? (
                    <form onSubmit={handleSendOtp} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-muted">Phone Number</label>
                            <input
                                type="tel"
                                placeholder="+91"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                className="w-full rounded-2xl border-none bg-paper px-6 py-4 text-lg font-medium outline-none ring-2 ring-transparent transition-all focus:ring-primary/20"
                                autoFocus
                            />
                        </div>
                        <Button size="pill" className="w-full py-6 text-lg">
                            Get OTP
                        </Button>
                    </form>
                ) : (
                    <form onSubmit={handleVerify} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-muted">Enter OTP</label>
                            <div className="flex gap-4">
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(el) => { if (el) inputRefs.current[index] = el }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        onPaste={handlePaste}
                                        className="h-16 w-16 rounded-2xl border-none bg-paper text-center text-2xl font-bold outline-none ring-2 ring-transparent focus:ring-primary/20 transition-all caret-primary"
                                    />
                                ))}
                            </div>
                        </div>
                        <Button size="pill" className="w-full py-6 text-lg">
                            Verify & Login
                        </Button>
                        <button
                            type="button"
                            onClick={() => setStep("phone")}
                            className="w-full text-sm font-bold text-muted"
                        >
                            Wrong number?
                        </button>
                    </form>
                )}
            </div>
        </main>
    )
}
