"use client"

import { Button } from "@/components/ui/Button"
import { AuthPanel } from "@/components/auth/AuthPanel"
import { useCart } from "@/context/CartContext"
import { saveOrderAction, getUserProfileAction, updateUserProfileAction } from "@/app/actions"
import { Order, OrderStatus, DeliveryAddress } from "@/lib/orders"
import { ArrowLeft, Check, Copy, MapPin, CreditCard, ChevronRight, User, Image as ImageIcon, ChevronDown } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { compressImageToDataUrl } from "@/lib/compress-image"
import { copyText } from "@/lib/copy-text"
import { QRCodeCanvas } from "qrcode.react"
import { CheckoutLoadingSkeleton } from "@/components/ui/Skeletons"
import { toast } from "sonner"
import { INDIAN_STATES } from "@/lib/constants"

type CheckoutStep = "auth" | "onboarding" | "address" | "payment" | "confirmation"

interface Address extends DeliveryAddress {
    id: number
}

export default function CheckoutPage() {
    const { items, cartTotal, clearCart, hydrated } = useCart()
    const router = useRouter()

    const { data: session, status } = useSession()
    const isLoggedIn = status === "authenticated"
    const userId = (session?.user as { id?: string } | undefined)?.id

    // Start on the auth step; advances once the session + profile resolve.
    const [step, setStep] = useState<CheckoutStep>("auth")
    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)
    const [orderId, setOrderId] = useState("")
    const [isProcessing, setIsProcessing] = useState(false)

    // Identity / profile
    const [userName, setUserName] = useState("")
    const [userPhone, setUserPhone] = useState("")

    // Payment Proof
    const [paymentScreenshot, setPaymentScreenshot] = useState<string | null>(null)
    const [fileName, setFileName] = useState("")
    const fileInputRef = useRef<HTMLInputElement>(null)
    const qrRef = useRef<HTMLCanvasElement>(null)

    // Addresses
    const [addresses, setAddresses] = useState<Address[]>([])

    // Unique paise suffix (1–99) added to the UPI amount so each payment is
    // identifiable in the merchant's UPI feed by amount alone (no screenshot needed).
    const [paiseSuffix] = useState(() => Math.floor(1 + Math.random() * 99))
    const [copied, setCopied] = useState<string | null>(null)

    // Once authenticated, load the profile and route to the right step.
    useEffect(() => {
        if (!isLoggedIn || !userId) return
        let cancelled = false

        ;(async () => {
            const profile = await getUserProfileAction(userId)
            if (cancelled) return

            if (profile?.name) setUserName(profile.name)
            if (profile?.phone) setUserPhone(profile.phone)

            if (profile && profile.name && profile.phone) {
                // Returning, fully-onboarded user → straight to address selection.
                if (profile.addresses.length > 0) {
                    const dbAddresses = profile.addresses.map((addr, idx) => ({ ...addr, id: idx + 1 }))
                    setAddresses(dbAddresses)
                }
                setStep("address")
            } else {
                // Signed in but missing name/phone → collect them.
                setStep("onboarding")
            }
        })()

        return () => { cancelled = true }
    }, [isLoggedIn, userId])

    // Redirect if cart is empty (except on the final confirmation screen).
    // Wait for the cart to hydrate first, otherwise the brief pre-load empty
    // state bounces us to /cart on every full page load (e.g. returning from OAuth).
    useEffect(() => {
        if (hydrated && items.length === 0 && step !== "confirmation") {
            router.push("/cart")
        }
    }, [hydrated, items, step, router])

    const handleUploadClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 10 * 1024 * 1024) {
            toast.error("File size should be less than 10MB")
            return
        }

        setFileName(file.name)
        try {
            // Compress before storing — payment screenshots get saved with the order.
            const compressed = await compressImageToDataUrl(file, { maxDim: 1400, quality: 0.82 })
            setPaymentScreenshot(compressed)
            toast.success("Screenshot uploaded successfully")
        } catch {
            toast.error("Couldn't process that screenshot")
        }
    }

    const steps = [
        { id: "auth", label: "Sign in", icon: User },
        { id: "address", label: "Address", icon: MapPin },
        { id: "payment", label: "Payment", icon: CreditCard },
        { id: "confirmation", label: "Done", icon: Check }
    ]

    const currentStepIndex = steps.findIndex(s => s.id === (step === "onboarding" ? "address" : step))

    // Step Indicator
    const renderStepIndicator = () => (
        <div className="flex items-center justify-center gap-2 mb-8">
            {steps.map((s, index) => {
                const Icon = s.icon
                const isActive = index <= currentStepIndex
                const isCurrent = s.id === step

                return (
                    <div key={s.id} className="flex items-center gap-2">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${isActive ? 'bg-accent text-white' : 'bg-muted/10 text-muted'} ${isCurrent ? 'ring-4 ring-accent/20' : ''}`}>
                            <Icon className="h-4 w-4" />
                        </div>
                        {index < steps.length - 1 && (
                            <div className={`h-[2px] w-8 transition-colors ${index < currentStepIndex ? 'bg-accent' : 'bg-muted/10'}`}></div>
                        )}
                    </div>
                )
            })}
        </div>
    )

    // AUTH STEP
    if (step === "auth") {
        return (
            <main className="min-h-screen bg-background pb-40 pt-8">
                <div className="px-6 mb-6">
                    <Link href="/cart" className="flex items-center gap-2 text-muted font-bold text-sm">
                        <ArrowLeft className="h-4 w-4" /> Back to Cart
                    </Link>
                </div>

                <div className="mx-auto w-full max-w-xl px-6">
                    {status === "unauthenticated" ? (
                        <>
                            <h1 className="font-heading text-4xl font-bold mb-2">Sign in to checkout</h1>
                            <p className="text-muted mb-10 text-lg">Access your saved addresses and keep track of your order.</p>
                            {renderStepIndicator()}
                            <AuthPanel callbackUrl="/checkout" />
                        </>
                    ) : (
                        // Authenticated but profile is still loading (step hasn't advanced).
                        // Mirror the address screen it's resolving into — no blank flash.
                        <>
                            <h1 className="font-heading text-3xl font-bold mb-2">Checkout</h1>
                            {renderStepIndicator()}
                            <CheckoutLoadingSkeleton />
                        </>
                    )}
                </div>
            </main>
        )
    }

    // ONBOARDING STEP
    if (step === "onboarding") {
        const handleCompleteOnboarding = async (e: React.FormEvent) => {
            e.preventDefault()
            const form = e.currentTarget as HTMLFormElement
            const onboardingName = (form.elements.namedItem("name") as HTMLInputElement).value
            const phone = (form.elements.namedItem("phone") as HTMLInputElement).value
            const line1 = (form.elements.namedItem("line1") as HTMLInputElement).value
            const line2 = (form.elements.namedItem("line2") as HTMLInputElement).value
            const city = (form.elements.namedItem("city") as HTMLInputElement).value
            const state = (form.elements.namedItem("state") as HTMLSelectElement).value
            const pincode = (form.elements.namedItem("pincode") as HTMLInputElement).value

            if (!onboardingName || phone.length < 10 || !line1 || !pincode || !city || !state) {
                toast.error("Please fill in your name, a 10-digit phone, and the address.")
                return
            }

            const firstAddress: Address = {
                id: Date.now(),
                type: "Home",
                line1,
                line2,
                city,
                state,
                pincode
            }

            setAddresses([firstAddress])
            setSelectedAddress(firstAddress)
            setUserName(onboardingName)
            setUserPhone(phone)

            // Persist name, phone, and the first address to the user's profile.
            const { id, ...cleanAddress } = firstAddress
            await updateUserProfileAction({
                name: onboardingName,
                phone,
                addresses: [cleanAddress]
            })

            toast.success(`Perfect, ${onboardingName.split(' ')[0]}! Ready for delivery.`)
            setStep("payment")
        }

        return (
            <main className="min-h-screen bg-background pb-40 pt-8">
                <div className="mx-auto w-full max-w-xl px-6 mb-6">
                    <h1 className="font-heading text-4xl font-bold mb-2">About You</h1>
                    <p className="text-muted mb-8 italic">We just need a few details to get your order moving.</p>

                    <form onSubmit={handleCompleteOnboarding} className="space-y-6">
                        {/* Name Section */}
                        <div className="space-y-4">
                            <label className="text-xs font-bold text-muted uppercase tracking-widest px-2">Your Name</label>
                            <div className="flex items-center gap-4 rounded-[2rem] bg-paper p-6 border border-muted/5 shadow-sm focus-within:ring-2 focus-within:ring-accent/20 transition-all">
                                <User className="h-6 w-6 text-accent" />
                                <input
                                    name="name"
                                    type="text"
                                    placeholder="Full Name"
                                    defaultValue={userName}
                                    className="w-full bg-transparent text-xl font-bold outline-none placeholder:text-muted/20"
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Phone Section (delivery contact; not used for login) */}
                        <div className="space-y-4">
                            <label className="text-xs font-bold text-muted uppercase tracking-widest px-2">Contact Number</label>
                            <div className="flex items-center gap-4 rounded-[2rem] bg-paper p-6 border border-muted/5 shadow-sm focus-within:ring-2 focus-within:ring-accent/20 transition-all">
                                <span className="text-accent font-bold text-xl border-r border-muted/10 pr-4">+91</span>
                                <input
                                    name="phone"
                                    type="tel"
                                    inputMode="numeric"
                                    placeholder="Mobile Number"
                                    defaultValue={userPhone}
                                    maxLength={10}
                                    onChange={(e) => { e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10) }}
                                    className="w-full bg-transparent text-xl font-bold outline-none placeholder:text-muted/20"
                                    required
                                />
                            </div>
                        </div>

                        {/* Address Section */}
                        <div className="space-y-4 pt-4">
                            <label className="text-xs font-bold text-muted uppercase tracking-widest px-2">Primary Delivery Address</label>
                            <div className="rounded-[2.5rem] bg-paper p-6 border border-muted/5 shadow-sm space-y-4 transition-all">
                                <div className="flex items-center gap-4 rounded-2xl bg-white px-5 py-4 border border-muted/5">
                                    <MapPin className="h-5 w-5 text-accent shrink-0" />
                                    <input
                                        name="line1"
                                        type="text"
                                        placeholder="Flat / Building / Landmark"
                                        className="w-full bg-transparent font-bold outline-none placeholder:text-muted/20"
                                        required
                                    />
                                </div>
                                <div className="flex items-center gap-4 rounded-2xl bg-white px-5 py-4 border border-muted/5 font-medium text-sm">
                                    <input
                                        name="line2"
                                        type="text"
                                        placeholder="Area / Street Name (Optional)"
                                        className="w-full bg-transparent outline-none placeholder:text-muted/40"
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-1 flex items-center gap-4 rounded-2xl bg-white px-5 py-4 border border-muted/5 font-medium text-sm">
                                        <input
                                            name="city"
                                            type="text"
                                            placeholder="City"
                                            className="w-full bg-transparent outline-none placeholder:text-muted/40"
                                            required
                                        />
                                    </div>
                                    <div className="flex-1 flex items-center gap-4 rounded-2xl bg-white px-5 py-4 border border-muted/5 font-medium text-sm relative">
                                        <select
                                            name="state"
                                            className="w-full bg-transparent outline-none appearance-none cursor-pointer"
                                            required
                                            defaultValue=""
                                        >
                                            <option value="" disabled>State</option>
                                            {INDIAN_STATES.map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 rounded-2xl bg-white px-5 py-4 border border-muted/5">
                                    <span className="text-xs font-bold text-muted">PIN</span>
                                    <input
                                        name="pincode"
                                        type="tel"
                                        placeholder="6 Digits"
                                        className="w-full bg-transparent font-bold outline-none placeholder:text-muted/20"
                                        maxLength={6}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="fixed bottom-20 left-0 w-full bg-background px-6 py-8 border-t border-muted/10">
                            <div className="mx-auto w-full max-w-xl">
                                <Button
                                    type="submit"
                                    size="pill"
                                    variant="pill"
                                    className="w-full font-bold h-16 text-lg bg-accent hover:bg-accent/90"
                                >
                                    Complete Profile <ChevronRight className="ml-2 h-6 w-6" />
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            </main>

        )
    }

    // ADDRESS STEP
    if (step === "address") {
        return (
            <main className="min-h-screen bg-background pb-40 pt-8">
                <div className="px-6 mb-6">
                    <Link href="/cart" className="flex items-center gap-2 text-muted font-bold text-sm">
                        <ArrowLeft className="h-4 w-4" /> Back to Cart
                    </Link>
                </div>

                <div className="mx-auto w-full max-w-xl px-6">
                    <h1 className="font-heading text-3xl font-bold mb-2">Checkout</h1>
                    {renderStepIndicator()}

                    <h2 className="font-heading text-lg font-bold mb-4">Select Delivery Address</h2>

                    <div className="space-y-4">
                        {addresses.map((addr) => (
                            <button
                                key={addr.id}
                                onClick={() => setSelectedAddress(addr)}
                                className={`w-full rounded-3xl p-5 text-left transition-all ${selectedAddress?.id === addr.id ? 'bg-accent/10 border-2 border-accent' : 'bg-paper border-2 border-transparent'}`}
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <span className="mb-2 inline-block rounded-md bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted">
                                            {addr.type}
                                        </span>
                                        <p className="font-medium">{addr.line1}</p>
                                        <p className="text-sm text-muted">{addr.line2 ? `${addr.line2}, ` : ''}{addr.city}, {addr.state} - {addr.pincode}</p>
                                    </div>
                                    {selectedAddress?.id === addr.id && (
                                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white">
                                            <Check className="h-4 w-4" />
                                        </div>
                                    )}
                                </div>
                            </button>
                        ))}

                        <Link href="/profile" className="block">
                            <button className="w-full rounded-3xl border-2 border-dashed border-muted/20 p-5 text-center text-muted font-bold hover:border-accent hover:text-accent transition-colors">
                                + Add New Address
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Continue Button */}
                <div className="fixed bottom-20 left-0 w-full bg-background px-6 py-6 border-t border-muted/10">
                    <div className="mx-auto w-full max-w-xl">
                        <Button
                            size="pill"
                            variant="pill"
                            className="w-full"
                            disabled={!selectedAddress}
                            onClick={() => setStep("payment")}
                        >
                            Continue to Payment <ChevronRight className="ml-2 h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </main>
        )
    }

    // PAYMENT STEP
    if (step === "payment") {
        const upiId = "kapil.das@okicici"
        const paymentAmount = ((cartTotal * 100 + paiseSuffix) / 100).toFixed(2)
        // Generated QR with the paise-suffixed amount baked in, against the
        // personal ICICI VPA. (goatradingco@rbl was abandoned: the handle
        // doesn't resolve outside its own bank-issued QR.)
        const upiIntentUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent("Fuko")}&am=${paymentAmount}&cu=INR&tn=${encodeURIComponent("Order Payment")}`

        // Banks accept a personal VPA only via SCANNED payments. Browser-launched
        // upi:// intents (and gpay://, phonepe://, …) are declined after PIN entry
        // with a bogus "bank limit" error — verified live 2026-08-01 across five
        // param variants including no-amount. Do NOT re-add one-tap pay buttons;
        // only a signed merchant gateway could bring them back, and Kapil has
        // ruled gateways out. The whole flow is scan-based instead.
        // iOS ignores <a download> for saving into Photos — at best the PNG lands
        // in Files/Downloads, where the UPI app's gallery picker can't see it. The
        // share sheet ("Save Image") is the only route to the camera roll, and it
        // needs the File built synchronously: any await before navigator.share()
        // drops the user activation and iOS throws NotAllowedError.
        const handleSaveQr = async () => {
            const canvas = qrRef.current
            if (!canvas) return
            const dataUrl = canvas.toDataURL("image/png")
            const bin = atob(dataUrl.split(",")[1])
            const bytes = new Uint8Array(bin.length)
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
            const file = new File([bytes], "fuko-upi-qr.png", { type: "image/png" })

            if (navigator.canShare?.({ files: [file] })) {
                try {
                    await navigator.share({ files: [file] })
                } catch {
                    return // sheet dismissed — don't claim it saved
                }
            } else {
                const a = document.createElement("a")
                a.href = dataUrl
                a.download = "fuko-upi-qr.png"
                a.click()
            }
            setCopied("qr")
            setTimeout(() => setCopied(null), 2500)
        }

        const handleCopy = async (text: string, which: string) => {
            if (!(await copyText(text))) {
                toast.error("Couldn't copy — long-press the text to select it instead.")
                return
            }
            setCopied(which)
            setTimeout(() => setCopied(null), 2000)
        }

        const handleConfirmPayment = () => {
            setIsProcessing(true)

            setTimeout(async () => {
                try {
                    const newOrder: Order = {
                        id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
                        date: new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' }),
                        status: "Processing" as OrderStatus,
                        items: items,
                        total: cartTotal,
                        customerName: userName || "Customer",
                        customerPhone: userPhone,
                        deliveryAddress: selectedAddress ? {
                            type: selectedAddress.type,
                            line1: selectedAddress.line1,
                            line2: selectedAddress.line2,
                            city: selectedAddress.city,
                            state: selectedAddress.state,
                            pincode: selectedAddress.pincode
                        } : undefined,
                        paymentScreenshot: paymentScreenshot || undefined,
                        paymentAmount: Number(paymentAmount)
                    }

                    const success = await saveOrderAction(newOrder)

                    if (success) {
                        setOrderId(newOrder.id)
                        clearCart()
                        setStep("confirmation")
                    } else {
                        toast.error("Failed to place order. Please try again.")
                    }
                } catch (err) {
                    // Never leave the button stuck on "Verifying…" — surface the error and let the user retry.
                    console.error("Place order failed:", err)
                    toast.error("Couldn't place your order. Please try again.")
                } finally {
                    setIsProcessing(false)
                }
            }, 1500)
        }

        return (
            <main className="min-h-screen bg-background pb-40 pt-8">
                <div className="px-6 mb-6">
                    <button onClick={() => setStep("address")} className="flex items-center gap-2 text-muted font-bold text-sm">
                        <ArrowLeft className="h-4 w-4" /> Back to Address
                    </button>
                </div>

                <div className="mx-auto w-full max-w-xl px-6">
                    <h1 className="font-heading text-3xl font-bold mb-2">Payment</h1>
                    {renderStepIndicator()}

                    {/* Order Summary */}
                    <div className="rounded-3xl bg-paper p-5 mb-6">
                        <h3 className="font-bold text-sm text-muted mb-3">Order Summary</h3>
                        {items.map((item) => (
                            <div key={item.id} className="flex items-center gap-3 mb-2">
                                <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-white">
                                    {item.image.startsWith("/") && (
                                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-sm">{item.name} x {item.quantity}</p>
                                </div>
                                <p className="font-bold text-sm">₹{item.price * item.quantity}</p>
                            </div>
                        ))}
                        <div className="mt-4 pt-4 border-t border-muted/10 flex justify-between font-heading text-lg font-bold">
                            <span>Total</span>
                            <span>₹{cartTotal}</span>
                        </div>
                    </div>

                    {/* UPI Payment Section */}
                    <div className="rounded-3xl bg-white p-6 text-center mb-6 border border-muted/10">
                        <h3 className="font-heading text-lg font-bold mb-2">Pay via UPI</h3>
                        <p className="text-2xl font-heading font-bold text-accent mb-1">₹{paymentAmount}</p>
                        <p className="text-[10px] text-muted mb-4">Pay this exact amount — it lets us match your payment instantly</p>

                        {/* Scan-first flow — the only path banks accept for this VPA */}
                        <div className="flex flex-col items-center gap-2">
                            <div className="rounded-2xl border border-muted/10 bg-white p-3">
                                {/* level H (30% recovery) is required — the centre logo
                                    excavates modules, and L/M would stop scanning. */}
                                <QRCodeCanvas
                                    value={upiIntentUrl}
                                    size={220}
                                    level="H"
                                    imageSettings={{ src: "/fuko-logo-qr.png", width: 52, height: 33, excavate: true }}
                                />
                                {/* Hidden high-res copy for "Save QR" — gallery scanners
                                    (GPay) reject the small on-screen canvas: it has no
                                    quiet-zone margin and too few px per module. */}
                                <div className="hidden">
                                    <QRCodeCanvas
                                        ref={qrRef}
                                        value={upiIntentUrl}
                                        size={880}
                                        marginSize={4}
                                        level="H"
                                        imageSettings={{ src: "/fuko-logo-qr.png", width: 208, height: 132, excavate: true }}
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-muted">Scan with any UPI app — the exact amount comes pre-filled</p>
                        </div>

                        {/* Same-phone flow: a QR can't be scanned off its own screen,
                            so save it and scan it from the gallery instead. */}
                        <div className="mt-5 border-t border-muted/10 pt-5 text-left">
                            <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-2">Paying on this phone?</p>
                            <ol className="mb-3 ml-4 list-decimal space-y-1 text-xs text-muted">
                                <li>Save the QR to your gallery</li>
                                <li>Open your UPI app and tap its scanner</li>
                                <li>Pick the saved QR from your gallery — the amount fills itself</li>
                            </ol>
                            <button
                                onClick={handleSaveQr}
                                className={`w-full rounded-2xl py-3 px-4 text-sm font-bold text-white transition-all active:scale-95 ${copied === "qr" ? "bg-nature" : "bg-primary hover:bg-accent"}`}
                            >
                                {copied === "qr"
                                    ? <span className="flex items-center justify-center gap-2"><Check className="h-4 w-4" /> Saved — check your gallery</span>
                                    : "Save QR to gallery"}
                            </button>
                            <div className="mt-3 flex flex-col gap-2">
                                {[
                                    { key: "id", label: "UPI ID", value: upiId, display: upiId },
                                    { key: "amt", label: "Amount", value: paymentAmount, display: `₹${paymentAmount}` },
                                ].map(row => (
                                    <button
                                        key={row.key}
                                        onClick={() => handleCopy(row.value, row.key)}
                                        className="flex items-center gap-2 whitespace-nowrap rounded-2xl border border-muted/10 bg-paper py-3 px-4 text-xs transition-colors hover:border-accent"
                                    >
                                        <span className="font-black text-muted uppercase tracking-widest text-[10px]">{row.label}</span>
                                        <span className="ml-auto font-bold text-primary">{row.display}</span>
                                        {copied === row.key
                                            ? <Check className="h-4 w-4 shrink-0 text-nature" />
                                            : <Copy className="h-4 w-4 shrink-0 text-muted" />}
                                    </button>
                                ))}
                            </div>
                            <p className="mt-2 text-[10px] text-muted">Or pay manually: copy the ID and the exact amount into your UPI app.</p>
                        </div>
                    </div>

                    {/* Upload Section */}
                    <div
                        onClick={handleUploadClick}
                        className={`rounded-3xl bg-white p-6 border mb-6 group cursor-pointer transition-all ${paymentScreenshot ? 'border-nature bg-nature/5' : 'border-muted/10 hover:border-accent'}`}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                        />

                        <div className="flex items-center gap-4">
                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-sm transition-all ${paymentScreenshot ? 'bg-white' : 'bg-paper group-hover:scale-110'}`}>
                                <ImageIcon className={`h-6 w-6 ${paymentScreenshot ? 'text-nature' : 'text-accent'}`} />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="font-bold text-sm">{paymentScreenshot ? 'Screenshot Uploaded' : 'Upload Screenshot (optional)'}</p>
                                <p className="text-[10px] font-bold text-muted uppercase tracking-wider">{paymentScreenshot ? 'Tap to change file' : 'Not required — we match your payment by its exact amount'}</p>
                            </div>
                        </div>

                        {paymentScreenshot && (
                            <div className="mt-4 flex items-center gap-2 text-nature px-3 py-2 bg-white/50 rounded-xl border border-nature/10">
                                <Check className="h-3 w-3" />
                                <span className="text-[10px] font-black uppercase tracking-[0.1em] truncate max-w-[200px]">{fileName} UPLOADED</span>
                            </div>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-[1px] flex-1 bg-muted/10"></div>
                        <span className="text-xs text-muted uppercase tracking-wider">Final Step</span>
                        <div className="h-[1px] flex-1 bg-muted/10"></div>
                    </div>

                    {/* Confirmation Section */}
                    <div className="rounded-3xl bg-paper p-5 text-center">
                        <p className="text-sm text-muted mb-4">
                            After completing payment in your UPI app, tap below to confirm
                        </p>
                        <Button
                            size="pill"
                            variant="pill"
                            className="w-full"
                            disabled={isProcessing}
                            onClick={handleConfirmPayment}
                        >
                            {isProcessing ? "Verifying..." : "I've Paid ✓"}
                        </Button>
                    </div>
                </div>
            </main>
        )
    }

    // CONFIRMATION STEP
    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
            <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-nature/10">
                <Check className="h-12 w-12 text-nature" />
            </div>

            <h1 className="font-heading text-3xl font-bold mb-2">Order Placed!</h1>
            <p className="text-muted mb-4">Your order is being verified. We&apos;ll notify you once confirmed.</p>

            <div className="rounded-2xl bg-paper px-6 py-4 mb-8">
                <p className="text-xs text-muted uppercase tracking-wider">Order ID</p>
                <p className="font-heading text-xl font-bold">{orderId}</p>
            </div>

            <div className="space-y-4 w-full max-w-xs">
                <Link href={`/order/${orderId}`} className="block">
                    <Button size="pill" variant="pill" className="w-full">
                        View Order Details
                    </Button>
                </Link>
                <Link href="/" className="block">
                    <Button size="pill" variant="outline" className="w-full rounded-full">
                        Continue Shopping
                    </Button>
                </Link>
            </div>
        </main>
    )
}
