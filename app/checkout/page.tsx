"use client"

import { Button } from "@/components/ui/Button"
import { useCart } from "@/context/CartContext"
import { saveOrderAction, getUserProfileAction, updateUserProfileAction } from "@/app/actions"
import { Order, OrderStatus, DeliveryAddress } from "@/lib/orders"
import { ArrowLeft, Check, MapPin, CreditCard, ChevronRight, Phone, User, Image as ImageIcon, ChevronDown } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { INDIAN_STATES } from "@/lib/constants"

type CheckoutStep = "login" | "otp" | "onboarding" | "address" | "payment" | "confirmation"

interface Address extends DeliveryAddress {
    id: number
}

export default function CheckoutPage() {
    const { items, cartTotal, clearCart } = useCart()
    const router = useRouter()

    // Start with login step - will change to address if already logged in
    const [step, setStep] = useState<CheckoutStep>("login")
    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)
    const [orderId, setOrderId] = useState("")
    const [isProcessing, setIsProcessing] = useState(false)

    // Login state
    const [phoneNumber, setPhoneNumber] = useState("")
    const [otp, setOtp] = useState("")
    const [isVerifying, setIsVerifying] = useState(false)

    // Payment Proof
    const [paymentScreenshot, setPaymentScreenshot] = useState<string | null>(null)
    const [fileName, setFileName] = useState("")
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Addresses
    const [addresses, setAddresses] = useState<Address[]>([])

    useEffect(() => {
        setTimeout(() => {
            // Check for saved phone in localStorage (keep this for session persistence)
            const savedPhone = localStorage.getItem("fuko_user_phone")

            if (savedPhone) {
                setPhoneNumber(savedPhone)

                // Fetch User Profile from Postgres
                getUserProfileAction(savedPhone).then(profile => {
                    if (profile) {
                        // Check if user has name (returning user)
                        if (profile.name) {
                            localStorage.setItem("fuko_user_name", profile.name) // Keep purely for UI helper
                            setStep("address")
                            // Load addresses
                            if (profile.addresses.length > 0) {
                                const dbAddresses = profile.addresses.map((addr, idx) => ({ ...addr, id: idx + 1 }))
                                setAddresses(dbAddresses)
                            }
                        } else {
                            setStep("onboarding")
                        }
                    } else {
                        // Profile doesn't exist yet, go to onboarding
                        setStep("onboarding")
                    }
                })
            }
        }, 0)
    }, [])

    // Redirect if cart is empty
    useEffect(() => {
        if (items.length === 0 && step !== "confirmation") {
            router.push("/cart")
        }
    }, [items, step, router])

    const handleLogin = () => {
        if (phoneNumber.length < 10) {
            toast.error("Please enter a valid 10-digit phone number")
            return
        }

        setIsVerifying(true)
        // Simulate sending OTP
        setTimeout(() => {
            toast.info("OTP sent to your number: 1234")
            setStep("otp")
            setIsVerifying(false)
        }, 800)
    }

    const handleVerifyOtp = () => {
        if (otp.length < 4) {
            toast.error("Please enter the 4-digit code")
            return
        }

        // Mark as logged in
        localStorage.setItem("fuko_user_phone", phoneNumber)

        // Fetch Profile
        getUserProfileAction(phoneNumber).then(profile => {
            if (profile && profile.name) {
                toast.success(`Welcome back, ${profile.name}!`)
                localStorage.setItem("fuko_user_name", profile.name)

                // Load addresses
                if (profile.addresses.length > 0) {
                    const dbAddresses = profile.addresses.map((addr, idx) => ({ ...addr, id: idx + 1 }))
                    setAddresses(dbAddresses)
                }
                setStep("address")
            } else {
                toast.success("Verified! Let's get to know you.")
                setStep("onboarding")
            }
        })
    }



    const handleUploadClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size should be less than 5MB")
            return
        }

        setFileName(file.name)
        const reader = new FileReader()
        reader.onloadend = () => {
            setPaymentScreenshot(reader.result as string)
            toast.success("Screenshot uploaded successfully")
        }
        reader.readAsDataURL(file)
    }

    const steps = [
        { id: "login", label: "Phone", icon: Phone },
        { id: "otp", label: "Verify", icon: Check },
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

    // LOGIN STEP
    if (step === "login") {
        return (
            <main className="min-h-screen bg-background pb-40 pt-8">
                <div className="px-6 mb-6">
                    <Link href="/cart" className="flex items-center gap-2 text-muted font-bold text-sm">
                        <ArrowLeft className="h-4 w-4" /> Back to Cart
                    </Link>
                </div>

                <div className="px-6">
                    <h1 className="font-heading text-4xl font-bold mb-2">Welcome Back</h1>
                    <p className="text-muted mb-12 text-lg">Enter your number to access your saved blends and addresses.</p>

                    {renderStepIndicator()}

                    <div className="space-y-8 mt-12">
                        <div className="group relative flex items-center gap-2 sm:gap-4 rounded-[2rem] sm:rounded-[2.5rem] bg-paper p-4 sm:p-8 shadow-sm ring-2 ring-transparent focus-within:ring-accent/20 transition-all border border-muted/5">
                            <span className="text-accent font-bold text-xl sm:text-3xl border-r border-muted/10 pr-3 sm:pr-6">+91</span>
                            <input
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                placeholder="Mobile Number"
                                className="flex-1 bg-transparent text-xl sm:text-3xl font-bold outline-none placeholder:text-muted/10"
                                maxLength={10}
                                autoFocus
                            />
                        </div>
                    </div>
                </div>

                {/* Continue Button */}
                <div className="fixed bottom-20 left-0 w-full bg-background px-6 py-8 border-t border-muted/10">
                    <Button
                        size="pill"
                        variant="pill"
                        className="w-full font-bold h-16 text-lg bg-accent hover:bg-accent/90"
                        disabled={phoneNumber.length < 10 || isVerifying}
                        onClick={handleLogin}
                    >
                        {isVerifying ? "Sending OTP..." : "Get OTP"} <ChevronRight className="ml-2 h-6 w-6" />
                    </Button>
                </div>
            </main>
        )
    }

    // OTP STEP
    if (step === "otp") {
        return (
            <main className="min-h-screen bg-background pb-40 pt-8">
                <div className="px-6 mb-6">
                    <button
                        onClick={() => setStep("login")}
                        className="flex items-center gap-2 text-muted font-bold text-sm"
                    >
                        <ArrowLeft className="h-4 w-4" /> Change Number
                    </button>
                </div>

                <div className="px-6">
                    <h1 className="font-heading text-3xl font-bold mb-2">Verification</h1>
                    <p className="text-muted mb-8">Enter the 4-digit code sent to +91 {phoneNumber}</p>

                    {renderStepIndicator()}

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-muted mb-6 text-center">Verify Identity</label>
                            <div className="relative flex justify-center gap-3">
                                {/* Hidden real input */}
                                <input
                                    type="tel"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                                    className="absolute inset-0 opacity-0 cursor-default"
                                    maxLength={4}
                                    autoFocus
                                />
                                {/* Segmented boxes */}
                                {[0, 1, 2, 3].map((index) => (
                                    <div
                                        key={index}
                                        className={`flex h-16 w-14 items-center justify-center rounded-2xl bg-paper text-2xl font-bold transition-all ring-2 ${otp.length === index ? 'ring-accent/50 scale-105 bg-white' : 'ring-transparent'}`}
                                    >
                                        {otp[index] || ""}
                                    </div>
                                ))}
                            </div>
                            <p className="text-center text-xs text-muted mt-8">
                                Didn&apos;t receive code? <button className="text-accent font-bold" onClick={handleLogin}>Resend</button>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Verify Button */}
                <div className="fixed bottom-20 left-0 w-full bg-background px-6 py-6 border-t border-muted/10">
                    <Button
                        size="pill"
                        variant="pill"
                        className="w-full font-bold"
                        disabled={otp.length < 4}
                        onClick={handleVerifyOtp}
                    >
                        Verify & Proceed <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                </div>
            </main>
        )
    }

    // ONBOARDING STEP
    if (step === "onboarding") {
        const handleCompleteOnboarding = (e: React.FormEvent) => {
            const form = e.currentTarget as HTMLFormElement
            const onboardingName = (form.elements.namedItem("name") as HTMLInputElement).value
            const line1 = (form.elements.namedItem("line1") as HTMLInputElement).value
            const line2 = (form.elements.namedItem("line2") as HTMLInputElement).value
            const city = (form.elements.namedItem("city") as HTMLInputElement).value
            const state = (form.elements.namedItem("state") as HTMLSelectElement).value
            const pincode = (form.elements.namedItem("pincode") as HTMLInputElement).value

            if (!onboardingName || !line1 || !pincode || !city || !state) {
                toast.error("Please fill in all address details.")
                return
            }

            // Save to DB
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

            // Persist to Postgres
            // Strip ID
            const { id, ...cleanAddress } = firstAddress
            updateUserProfileAction(phoneNumber, {
                name: onboardingName,
                addresses: [cleanAddress]
            })

            toast.success(`Perfect, ${onboardingName.split(' ')[0]}! Ready for delivery.`)
            setStep("payment") // Go specifically to payment since we have an address now
        }

        return (
            <main className="min-h-screen bg-background pb-40 pt-8">
                <div className="px-6 mb-6">
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
                                    className="w-full bg-transparent text-xl font-bold outline-none placeholder:text-muted/20"
                                    required
                                    autoFocus
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
                            <Button
                                type="submit"
                                size="pill"
                                variant="pill"
                                className="w-full font-bold h-16 text-lg bg-accent hover:bg-accent/90"
                            >
                                Complete Profile <ChevronRight className="ml-2 h-6 w-6" />
                            </Button>
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

                <div className="px-6">
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
            </main>
        )
    }

    // PAYMENT STEP
    if (step === "payment") {
        // UPI Intent Deep Link
        const upiId = "fuko@upi" // Replace with your actual UPI ID
        const merchantName = "Fuko"
        const transactionNote = `Order Payment`
        const upiIntentUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(merchantName)}&am=${cartTotal}&cu=INR&tn=${encodeURIComponent(transactionNote)}`

        const handlePayNow = () => {
            // Open UPI app on mobile
            window.location.href = upiIntentUrl
        }

        const handleConfirmPayment = () => {
            setIsProcessing(true)

            // Get user name from localStorage
            const userName = localStorage.getItem("fuko_user_name") || "Customer"

            // Simulate verification delay
            setTimeout(async () => {
                // Construct Order Object
                const newOrder: Order = {
                    id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
                    date: new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' }),
                    status: "Processing" as OrderStatus,
                    items: items,
                    total: cartTotal,
                    customerName: userName,
                    customerPhone: phoneNumber || "9876543210", // Use state phoneNumber
                    deliveryAddress: selectedAddress ? {
                        type: selectedAddress.type,
                        line1: selectedAddress.line1,
                        line2: selectedAddress.line2,
                        city: selectedAddress.city,
                        state: selectedAddress.state,
                        pincode: selectedAddress.pincode
                    } : undefined,
                    paymentScreenshot: paymentScreenshot || undefined
                }

                // Save to Postgres
                const success = await saveOrderAction(newOrder)

                // Add verification metadata locally for immediate feedback (optional, but good for UI state)
                if (success) {
                    setOrderId(newOrder.id)
                    clearCart()
                    setStep("confirmation")
                } else {
                    toast.error("Failed to place order. Please try again.")
                }

                setIsProcessing(false)
            }, 1500)
        }

        return (
            <main className="min-h-screen bg-background pb-40 pt-8">
                <div className="px-6 mb-6">
                    <button onClick={() => setStep("address")} className="flex items-center gap-2 text-muted font-bold text-sm">
                        <ArrowLeft className="h-4 w-4" /> Back to Address
                    </button>
                </div>

                <div className="px-6">
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
                        <p className="text-2xl font-heading font-bold text-accent mb-4">₹{cartTotal}</p>

                        {/* Pay Now Button - Opens UPI App */}
                        <button
                            onClick={handlePayNow}
                            className="w-full rounded-2xl bg-gradient-to-r from-[#4B0082] to-[#7B68EE] py-4 px-6 text-white font-bold text-lg shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 transition-all mb-4"
                        >
                            <span className="flex items-center justify-center gap-2">
                                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                </svg>
                                Pay ₹{cartTotal} Now
                            </span>
                        </button>

                        <p className="text-xs text-muted">
                            Opens your UPI app (GPay, PhonePe, Paytm)
                        </p>
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
                                <p className="font-bold text-sm">{paymentScreenshot ? 'Screenshot Uploaded' : 'Upload Screenshot'}</p>
                                <p className="text-[10px] font-bold text-muted uppercase tracking-wider">{paymentScreenshot ? 'Tap to change file' : 'Tap to select from recent photos'}</p>
                            </div>
                        </div>

                        {/* Upload Status */}
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
                        Track Order
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
