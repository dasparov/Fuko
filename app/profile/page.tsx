"use client"

import { Button } from "@/components/ui/Button"
import { ArrowLeft, MapPin, Package, Settings, LogOut, Plus, X, Pencil } from "lucide-react"
import Link from "next/link"
import { useCart } from "@/context/CartContext"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import Image from "next/image"
import { getOrders, Order } from "@/lib/orders"

export default function ProfilePage() {
    const { addItem } = useCart()
    const router = useRouter()

    // User Profile State - Default empty to simulate new user
    const [userName, setUserName] = useState("")
    const [isEditingName, setIsEditingName] = useState(false)
    const [tempName, setTempName] = useState("")
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [userPhone, setUserPhone] = useState("")
    const [phoneNumber, setPhoneNumber] = useState("") // For login input
    const [otp, setOtp] = useState("")
    const [showOtp, setShowOtp] = useState(false)
    const [isVerifying, setIsVerifying] = useState(false)

    // Secret Admin Access - Tap avatar 5 times
    const [tapCount, setTapCount] = useState(0)
    const [showAdminLink, setShowAdminLink] = useState(false)

    const handleAvatarTap = () => {
        const newCount = tapCount + 1
        setTapCount(newCount)
        if (newCount >= 5) {
            setShowAdminLink(true)
            toast.success("Admin mode unlocked!")
        }
        // Reset tap count after 2 seconds of inactivity
        setTimeout(() => setTapCount(0), 2000)
    }

    // Order History State
    const [activeOrders, setActiveOrders] = useState<Order[]>([])

    // Address State
    interface Address {
        id: number
        type: string
        line1: string
        line2: string
        pincode: string
    }
    const [isAddingAddress, setIsAddingAddress] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [addresses, setAddresses] = useState<Address[]>([])
    const [newAddress, setNewAddress] = useState({ type: "Home", line1: "", line2: "", pincode: "" })

    useEffect(() => {
        setTimeout(() => {
            // Check for saved phone in localStorage
            const savedPhone = localStorage.getItem("fuko_user_phone")
            const savedName = localStorage.getItem("fuko_user_name")

            if (savedPhone) {
                setIsLoggedIn(true)
                setUserPhone(savedPhone)
                if (savedName) setUserName(savedName)

                // Logged in users get their data
                setActiveOrders(getOrders())

                const savedAddresses = localStorage.getItem("fuko_addresses")
                if (savedAddresses) {
                    setAddresses(JSON.parse(savedAddresses))
                } else {
                    // If logged in but no addresses, set defaults
                    const defaults = [
                        { id: 1, type: "Home", line1: "1204, Palm Springs", line2: "Golf Course Road, Gurgaon", pincode: "122002" },
                        { id: 2, type: "Work", line1: "WeWork Forum", line2: "Cyber City, Phase 3, Gurgaon", pincode: "122002" }
                    ]
                    setAddresses(defaults)
                    localStorage.setItem("fuko_addresses", JSON.stringify(defaults))
                }
            }
        }, 0)
    }, [])

    const handleEditName = () => {
        setTempName(userName)
        setIsEditingName(true)
    }

    const handleSaveName = () => {
        if (tempName.trim()) {
            setUserName(tempName)
            localStorage.setItem("fuko_user_name", tempName)
        }
        setIsEditingName(false)
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (phoneNumber.length < 10) {
            toast.error("Please enter a valid 10-digit phone number")
            return
        }

        setIsVerifying(true)
        try {
            const response = await fetch("/api/auth/otp/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phoneNumber })
            })

            const data = await response.json()

            if (response.ok) {
                toast.success("Verification code sent!")
                setShowOtp(true)
            } else {
                toast.error(data.error || "Failed to send code")
            }
        } catch {
            toast.error("Network error. Please try again.")
        } finally {
            setIsVerifying(false)
        }
    }

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        if (otp.length < 4) {
            toast.error("Please enter the 4-digit code")
            return
        }

        setIsVerifying(true)
        try {
            const response = await fetch("/api/auth/otp/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phoneNumber, code: otp })
            })

            const data = await response.json()

            if (response.ok) {
                localStorage.setItem("fuko_user_phone", phoneNumber)
                setIsLoggedIn(true)
                setUserPhone(phoneNumber)
                setActiveOrders(getOrders())

                // Load or set default addresses
                const savedAddresses = localStorage.getItem("fuko_addresses")
                if (savedAddresses) {
                    setAddresses(JSON.parse(savedAddresses))
                } else {
                    const defaults = [
                        { id: 1, type: "Home", line1: "1204, Palm Springs", line2: "Golf Course Road, Gurgaon", pincode: "122002" },
                        { id: 2, type: "Work", line1: "WeWork Forum", line2: "Cyber City, Phase 3, Gurgaon", pincode: "122002" }
                    ]
                    setAddresses(defaults)
                    localStorage.setItem("fuko_addresses", JSON.stringify(defaults))
                }

                toast.success("Identity verified! Welcome to Fuko.")
                setShowOtp(false)
            } else {
                toast.error(data.error || "Invalid code")
            }
        } catch {
            toast.error("Verification failed. Please try again.")
        } finally {
            setIsVerifying(false)
        }
    }

    // Mock Address State moved to top

    const handleReorder = (order: Order) => {
        // Add all items from the order to cart
        order.items.forEach(item => {
            addItem({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                image: item.image
            })
        })
        router.push("/cart")
    }

    const handleSaveAddress = (e: React.FormEvent) => {
        e.preventDefault()
        if (!newAddress.line1 || !newAddress.pincode) return

        if (editingId) {
            setAddresses(addresses.map(addr => addr.id === editingId ? { ...newAddress, id: editingId } : addr))
            setEditingId(null)
        } else {
            setAddresses([...addresses, { ...newAddress, id: Date.now() }])
        }

        setIsAddingAddress(false)
        setNewAddress({ type: "Home", line1: "", line2: "", pincode: "" })
    }

    const handleEdit = (address: Address) => {
        setNewAddress(address)
        setEditingId(address.id)
        setIsAddingAddress(true)
    }

    const handleDelete = (id: number) => {
        setAddresses(addresses.filter(addr => addr.id !== id))
    }

    const handleLogout = () => {
        // Clear user session data
        localStorage.removeItem("fuko_user_phone")
        localStorage.removeItem("fuko_user_name")
        // Note: We keep fuko_addresses and fuko_orders for now 
        // as this is a mock app and we don't have a backend to restore them.
        // But we clear the "logged in" state.

        toast.success("Logged out successfully")
        router.push("/")
    }

    return (
        <main className="min-h-screen bg-background pb-32 pt-8">
            {/* Header */}
            <div className="flex items-center justify-between px-6 mb-8">
                <h1 className="font-heading text-3xl font-bold">My Account</h1>
                <button
                    onClick={handleLogout}
                    className="rounded-full bg-paper p-2 text-muted hover:text-destructive transition-colors"
                >
                    <LogOut className="h-5 w-5" />
                </button>
            </div>

            {/* User Info Card */}
            <div className="mx-6 mb-8 flex items-center gap-4 rounded-3xl bg-paper p-6">
                {userName && (
                    <button
                        onClick={handleAvatarTap}
                        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-accent text-2xl font-bold text-white transition-transform active:scale-95"
                    >
                        {userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </button>
                )}
                <div className="flex-1">
                    {!isLoggedIn ? (
                        showOtp ? (
                            <form onSubmit={handleVerifyOtp} className="space-y-3">
                                <div className="text-center">
                                    <h2 className="font-heading text-lg font-bold">Verification</h2>
                                    <p className="text-xs text-muted mb-6">Code sent to +91 {phoneNumber}</p>

                                    <div className="relative flex justify-center gap-2 mb-4">
                                        {/* Hidden real input */}
                                        <input
                                            type="tel"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                                            className="absolute inset-0 opacity-0 cursor-default z-10"
                                            maxLength={4}
                                            autoFocus
                                        />
                                        {/* Segmented boxes */}
                                        {[0, 1, 2, 3].map((index) => (
                                            <div
                                                key={index}
                                                className={`flex h-12 w-10 items-center justify-center rounded-xl bg-white text-lg font-bold transition-all ring-2 ${otp.length === index ? 'ring-accent/50 scale-105 shadow-sm' : 'ring-muted/10'}`}
                                            >
                                                {otp[index] || ""}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <button
                                            type="submit"
                                            disabled={otp.length < 4}
                                            className="w-full rounded-xl bg-accent py-2 text-white font-bold disabled:bg-muted/20 disabled:text-muted transition-colors shadow-sm text-sm"
                                        >
                                            Verify Identity
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowOtp(false)}
                                            className="text-[10px] font-bold text-muted uppercase tracking-wider hover:text-accent transition-colors"
                                        >
                                            Change Number
                                        </button>
                                    </div>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleLogin} className="space-y-6 py-4">
                                <div className="text-center sm:text-left">
                                    <h2 className="font-heading text-3xl font-bold mb-2">Welcome to Fuko</h2>
                                    <p className="text-sm text-muted mb-8">Join the archives for raw tobacco.</p>

                                    <div className="group relative flex items-center gap-2 sm:gap-4 rounded-[2rem] bg-white p-4 sm:p-6 shadow-sm ring-2 ring-transparent focus-within:ring-accent/20 transition-all border border-muted/5">
                                        <span className="text-accent font-bold text-xl sm:text-2xl border-r border-muted/10 pr-3 sm:pr-4">+91</span>
                                        <input
                                            type="tel"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                            placeholder="Mobile Number"
                                            className="w-full bg-transparent text-xl sm:text-2xl font-bold outline-none placeholder:text-muted/20"
                                            maxLength={10}
                                        />
                                        <button
                                            type="submit"
                                            disabled={phoneNumber.length < 10 || isVerifying}
                                            className="h-12 w-12 sm:h-14 sm:w-14 shrink-0 rounded-full bg-accent text-white shadow-lg shadow-accent/20 transition-all hover:scale-105 active:scale-95 disabled:bg-muted/10 disabled:text-muted disabled:shadow-none"
                                        >
                                            {isVerifying ? (
                                                <div className="mx-auto h-4 w-4 sm:h-5 sm:w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                            ) : (
                                                <ArrowLeft className="mx-auto h-5 w-5 sm:h-6 sm:w-6 rotate-180" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        )
                    ) : isEditingName ? (
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                placeholder="Your Name"
                                className="w-full rounded-lg bg-white px-2 py-1 text-lg font-bold outline-none ring-2 ring-accent/20"
                                autoFocus
                            />
                            <button onClick={handleSaveName} className="rounded-full bg-accent p-1 text-white">
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="font-heading text-xl font-bold">{userName || "Welcome, Friend"}</h2>
                                <p className="text-sm text-muted">+91 {userPhone?.slice(0, 5)} {userPhone?.slice(5)}</p>
                            </div>
                            <button
                                onClick={handleEditName}
                                className={`rounded-full p-2 shadow-sm transition-colors ${userName ? 'bg-white text-muted' : 'bg-accent text-white px-4'}`}
                            >
                                {userName ? <Pencil className="h-4 w-4" /> : <span className="text-xs font-bold">Add Name</span>}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Secret Admin Link - Revealed after 5 taps on avatar */}
            {showAdminLink && (
                <div className="mx-6 mb-6">
                    <Link href="/admin" className="block">
                        <div className="rounded-2xl bg-gradient-to-r from-gray-800 to-gray-900 p-4 flex items-center justify-between shadow-lg">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                                    <Settings className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <p className="font-bold text-white">Admin Dashboard</p>
                                    <p className="text-xs text-gray-400">Manage orders & inventory</p>
                                </div>
                            </div>
                            <div className="text-gray-400">→</div>
                        </div>
                    </Link>
                </div>
            )}
            {isLoggedIn && (
                <>
                    <section className="px-6 mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-heading text-lg font-bold flex items-center gap-2">
                                <MapPin className="h-5 w-5" /> Saved Locations
                            </h3>
                            <button
                                onClick={() => {
                                    setNewAddress({ type: "Home", line1: "", line2: "", pincode: "" })
                                    setEditingId(null)
                                    setIsAddingAddress(true)
                                }}
                                className="text-xs font-bold text-accent hover:underline"
                            >
                                Add New
                            </button>
                        </div>

                        {/* Add Address Form */}
                        {isAddingAddress && (
                            <div className="mb-4 rounded-3xl border-2 border-accent/20 bg-paper p-5 transition-all">
                                <div className="mb-4 flex items-center justify-between">
                                    <h4 className="font-bold text-sm">{editingId ? "Edit Address" : "New Address"}</h4>
                                    <button onClick={() => setIsAddingAddress(false)}><X className="h-4 w-4 text-muted" /></button>
                                </div>
                                <form onSubmit={handleSaveAddress} className="space-y-3">
                                    <div className="flex gap-2">
                                        {["Home", "Work", "Other"].map(type => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setNewAddress({ ...newAddress, type })}
                                                className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${newAddress.type === type ? "bg-accent text-white" : "bg-white text-muted"}`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Flat / Building Name"
                                        className="w-full rounded-xl border-none bg-white px-4 py-3 text-sm font-medium outline-none"
                                        value={newAddress.line1}
                                        onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })}
                                        autoFocus
                                    />
                                    <input
                                        type="text"
                                        placeholder="Area / Landmark"
                                        className="w-full rounded-xl border-none bg-white px-4 py-3 text-sm font-medium outline-none"
                                        value={newAddress.line2}
                                        onChange={(e) => setNewAddress({ ...newAddress, line2: e.target.value })}
                                    />
                                    <input
                                        type="tel"
                                        placeholder="Pin Code"
                                        maxLength={6}
                                        className="w-1/2 rounded-xl border-none bg-white px-4 py-3 text-sm font-medium outline-none"
                                        value={newAddress.pincode}
                                        onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                                    />
                                    <Button size="sm" className="w-full rounded-xl mt-2 font-bold">
                                        {editingId ? "Update Location" : "Save Location"}
                                    </Button>
                                </form>
                            </div>
                        )}

                        <div className="space-y-4">
                            {addresses.map((addr) => (
                                <div key={addr.id} className={`rounded-3xl p-5 ${addr.type === 'Home' ? 'border-2 border-primary/5 bg-white' : 'border border-muted/10 bg-white/50'}`}>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <span className="mb-2 inline-block rounded-md bg-paper px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted">
                                                {addr.type}
                                            </span>
                                            <p className="font-medium">{addr.line1}</p>
                                            <p className="text-sm text-muted">{addr.line2}, {addr.pincode}</p>
                                        </div>
                                        <div className="flex gap-3">
                                            <button onClick={() => handleEdit(addr)} className="text-xs font-bold text-accent">Edit</button>
                                            <button onClick={() => handleDelete(addr.id)} className="text-xs font-bold text-destructive">Delete</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Past Orders */}
                    <section className="px-6 mb-8">
                        <h3 className="font-heading text-lg font-bold flex items-center gap-2 mb-4">
                            <Package className="h-5 w-5" /> Past Orders
                        </h3>
                        <div className="space-y-4">
                            {activeOrders.length === 0 ? (
                                <div className="rounded-3xl bg-paper p-8 text-center">
                                    <p className="text-muted mb-4">No orders placed yet.</p>
                                    <Link href="/shop">
                                        <Button size="sm" className="rounded-full">Start Shopping</Button>
                                    </Link>
                                </div>
                            ) : (
                                activeOrders.map((order) => (
                                    <Link href={`/order/${order.id}`} key={order.id}>
                                        <div className="rounded-3xl bg-paper p-5 transition-transform hover:scale-[1.02] mb-4">
                                            <div className="flex justify-between mb-4">
                                                <span className="text-xs font-bold text-muted">{order.date}</span>
                                                <span className={`text-xs font-bold ${order.status === 'Delivered' ? 'text-nature' : 'text-accent'}`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                            <div className="flex gap-4">
                                                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-muted/10">
                                                    {/* Show first item image */}
                                                    {order.items[0] && (
                                                        <Image
                                                            src={order.items[0].image}
                                                            alt={order.items[0].name}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-heading font-bold">{order.items[0].name} {order.items.length > 1 && `+ ${order.items.length - 1} more`}</p>
                                                    <p className="text-sm text-muted">₹{order.total}</p>
                                                </div>
                                            </div>
                                            <div className="mt-4 border-t border-muted/10 pt-4 flex gap-2">
                                                <div className="font-bold text-xs text-muted/50 uppercase tracking-widest flex-1 py-2">
                                                    {order.id}
                                                </div>
                                                {/* Reorder Button */}
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault() // Prevent navigation to details
                                                        handleReorder(order)
                                                    }}
                                                    className="text-xs font-bold text-accent hover:underline"
                                                >
                                                    Reorder
                                                </button>
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </section>
                </>
            )}
            {/* Support & Legal */}
            <section className="px-6">
                <h3 className="font-heading text-lg font-bold flex items-center gap-2 mb-4">
                    <Settings className="h-5 w-5" /> Support & Legal
                </h3>
                <div className="space-y-2 rounded-3xl bg-paper p-2">
                    <Link
                        href="/support"
                        className="flex w-full items-center justify-between rounded-2xl bg-white p-4 font-bold text-muted transition-colors hover:text-primary"
                    >
                        <span>Need Help?</span>
                        <ArrowLeft className="h-4 w-4 rotate-180" />
                    </Link>
                    <Link
                        href="/legal/terms"
                        className="flex w-full items-center justify-between rounded-2xl bg-white p-4 font-bold text-muted transition-colors hover:text-primary"
                    >
                        <span>Terms of Service</span>
                        <ArrowLeft className="h-4 w-4 rotate-180" />
                    </Link>
                    <Link
                        href="/legal/privacy"
                        className="flex w-full items-center justify-between rounded-2xl bg-white p-4 font-bold text-muted transition-colors hover:text-primary"
                    >
                        <span>Privacy Policy</span>
                        <ArrowLeft className="h-4 w-4 rotate-180" />
                    </Link>
                </div>
                <div className="mt-8 text-center">
                    <p className="text-xs font-bold text-muted/30 uppercase tracking-widest">Version 1.0.2</p>
                </div>
            </section>

            {/* Prominent Logout Button */}
            {isLoggedIn && (
                <div className="px-6 mt-8">
                    <button
                        onClick={handleLogout}
                        className="w-full rounded-2xl bg-red-50 py-4 px-6 flex items-center justify-center gap-2 text-red-600 font-bold hover:bg-red-100 transition-colors border border-red-100"
                    >
                        <LogOut className="h-5 w-5" />
                        Logout from Account
                    </button>
                </div>
            )}
        </main>
    )
}
