"use client"

import { Button } from "@/components/ui/Button"
import { AuthPanel } from "@/components/auth/AuthPanel"
import { ArrowLeft, MapPin, Package, Settings, LogOut, Plus, X, Pencil } from "lucide-react"
import Link from "next/link"
import { useCart } from "@/context/CartContext"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import Image from "next/image"
import { Order, DeliveryAddress } from "@/lib/orders"
import { getOrdersForUserAction, getUserProfileAction, updateUserProfileAction } from "@/app/actions"
import { INDIAN_STATES } from "@/lib/constants"

export default function ProfilePage() {
    const { addItem } = useCart()
    const router = useRouter()

    const { data: session, status } = useSession()
    const isLoggedIn = status === "authenticated"
    const userId = (session?.user as { id?: string } | undefined)?.id

    // User Profile State
    const [userName, setUserName] = useState("")
    const [isEditingName, setIsEditingName] = useState(false)
    const [tempName, setTempName] = useState("")
    const [userEmail, setUserEmail] = useState("")
    const [userPhone, setUserPhone] = useState("")

    // Order History State
    const [activeOrders, setActiveOrders] = useState<Order[]>([])

    // Address State
    interface Address extends DeliveryAddress {
        id: number
    }
    const [isAddingAddress, setIsAddingAddress] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [addresses, setAddresses] = useState<Address[]>([])
    const [newAddress, setNewAddress] = useState<Address>({ id: 0, type: "Home", line1: "", line2: "", city: "", state: "", pincode: "" })

    useEffect(() => {
        if (!isLoggedIn || !userId) return
        let cancelled = false

        ;(async () => {
            // Profile (name, email, phone, addresses) keyed by the Auth.js user id
            const profile = await getUserProfileAction(userId)
            if (cancelled || !profile) return

            if (profile.name) setUserName(profile.name)
            setUserEmail(profile.email)
            setUserPhone(profile.phone)
            const dbAddresses = profile.addresses.map((addr, idx) => ({ ...addr, id: idx + 1 }))
            setAddresses(dbAddresses)

            // Orders are keyed by phone (collected at checkout, stored on users.phone)
            if (profile.phone) {
                const userOrders = await getOrdersForUserAction(profile.phone)
                if (!cancelled) setActiveOrders(userOrders)
            }
        })()

        return () => { cancelled = true }
    }, [isLoggedIn, userId])

    const handleEditName = () => {
        setTempName(userName)
        setIsEditingName(true)
    }

    const handleSaveName = async () => {
        if (tempName.trim()) {
            setUserName(tempName)
            await updateUserProfileAction({ name: tempName })
        }
        setIsEditingName(false)
    }

    const handleReorder = (order: Order) => {
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

    const handleSaveAddress = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newAddress.line1 || !newAddress.pincode || !newAddress.city || !newAddress.state) return

        let updatedAddresses = [...addresses]

        if (editingId) {
            updatedAddresses = addresses.map(addr => addr.id === editingId ? { ...newAddress, id: editingId } : addr)
            setEditingId(null)
        } else {
            updatedAddresses = [...addresses, { ...newAddress, id: Date.now() }]
        }

        setAddresses(updatedAddresses)
        setIsAddingAddress(false)
        setNewAddress({ id: 0, type: "Home", line1: "", line2: "", city: "", state: "", pincode: "" })

        // Persist to DB (strip UI-only ids)
        const cleanAddresses = updatedAddresses.map(({ id, ...rest }) => rest)
        await updateUserProfileAction({ addresses: cleanAddresses })
    }

    const handleEdit = (address: Address) => {
        setNewAddress(address)
        setEditingId(address.id)
        setIsAddingAddress(true)
    }

    const handleDelete = async (id: number) => {
        const updated = addresses.filter(addr => addr.id !== id)
        setAddresses(updated)

        const cleanAddresses = updated.map(({ id, ...rest }) => rest)
        await updateUserProfileAction({ addresses: cleanAddresses })
    }

    const handleLogout = () => {
        signOut({ callbackUrl: "/" })
    }

    return (
        <main className="min-h-screen bg-background pb-32 pt-8">
            {/* Header */}
            <div className="flex items-center justify-between px-6 mb-8">
                <h1 className="font-heading text-3xl font-bold">My Account</h1>
                {isLoggedIn && (
                    <button
                        onClick={handleLogout}
                        className="rounded-full bg-paper p-2 text-muted hover:text-destructive transition-colors"
                    >
                        <LogOut className="h-5 w-5" />
                    </button>
                )}
            </div>

            {/* User Info Card */}
            <div className="mx-6 mb-8 flex items-center gap-4 rounded-3xl bg-paper p-6">
                {isLoggedIn && userName && (
                    <div
                        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-accent text-2xl font-bold text-white transition-transform active:scale-95"
                    >
                        {userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                )}
                <div className="flex-1">
                    {!isLoggedIn ? (
                        status === "loading" ? (
                            <p className="py-4 text-center text-sm text-muted">Loading…</p>
                        ) : (
                            <div className="py-2">
                                <h2 className="font-heading text-2xl font-bold mb-1">Welcome to Fuko</h2>
                                <p className="text-sm text-muted mb-6">Sign in to view your orders and saved addresses.</p>
                                <AuthPanel callbackUrl="/profile" />
                            </div>
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
                                <p className="text-sm text-muted">{userEmail}</p>
                                {userPhone && <p className="text-sm text-muted">+91 {userPhone}</p>}
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

            {isLoggedIn && (
                <>
                    <section className="px-6 mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-heading text-lg font-bold flex items-center gap-2">
                                <MapPin className="h-5 w-5" /> Saved Locations
                            </h3>
                            <button
                                onClick={() => {
                                    setNewAddress({ id: 0, type: "Home", line1: "", line2: "", city: "", state: "", pincode: "" })
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
                                    <input
                                        type="text"
                                        placeholder="City"
                                        className="w-full rounded-xl border-none bg-white px-4 py-3 text-sm font-medium outline-none"
                                        value={newAddress.city}
                                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                                        required
                                    />
                                    <div className="relative w-full">
                                        <select
                                            className="w-full rounded-xl border-none bg-white px-4 py-3 text-sm font-medium outline-none appearance-none"
                                            value={newAddress.state}
                                            onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                                            required
                                        >
                                            <option value="" disabled>Select State</option>
                                            {INDIAN_STATES.map(state => (
                                                <option key={state} value={state}>{state}</option>
                                            ))}
                                        </select>
                                    </div>
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
                                            <p className="text-sm text-muted">{addr.line2 ? `${addr.line2}, ` : ''}{addr.city}, {addr.state} - {addr.pincode}</p>
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
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault()
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
