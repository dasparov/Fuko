"use client"

import { getOrders, updateOrderStatus, Order, OrderStatus, togglePaymentVerification } from "@/lib/orders"
import { getProducts, saveProduct, Product } from "@/lib/inventory"
import { getSiteSettings, saveSiteSettings, SiteSettings } from "@/lib/settings"
import { useState, useEffect } from "react"
import Link from "next/link"
import {
    Package, Check, Clock, X, ChevronDown,
    RefreshCw, LayoutGrid, BarChart3, Settings, Eye, EyeOff, Plus, Save, Image as ImageIcon, Loader2
} from "lucide-react"
import { toast } from "sonner"

const STATUS_OPTIONS: OrderStatus[] = ["Processing", "Shipped", "Out for Delivery", "Delivered"]

const STATUS_COLORS: Record<OrderStatus, string> = {
    "Processing": "bg-amber-100 text-amber-700",
    "Shipped": "bg-blue-100 text-blue-700",
    "Out for Delivery": "bg-purple-100 text-purple-700",
    "Delivered": "bg-green-100 text-green-700"
}

type AdminTab = "orders" | "inventory" | "analytics" | "settings"

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<AdminTab>("orders")
    const [activeAnalyticsDetail, setActiveAnalyticsDetail] = useState<"orders" | "revenue" | "inventory" | null>(null)

    // Data States
    const [orders, setOrders] = useState<Order[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [settings, setSettings] = useState<SiteSettings | null>(null)
    const [, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    // Filter Logic
    const [orderFilter, setOrderFilter] = useState<OrderStatus | "All">("All")

    // Inventory States
    const [isEditingProduct, setIsEditingProduct] = useState<string | null>(null) // null for list, "new" for adding, or productId
    const [tempProduct, setTempProduct] = useState<Partial<Product>>({})

    // --- Secure Access Logic ---
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [pin, setPin] = useState("")

    const loadAllData = () => {
        setIsRefreshing(true)
        // Simulate network delay for better UX
        setTimeout(() => {
            setOrders(getOrders())
            setProducts(getProducts())
            setSettings(getSiteSettings())
            setIsLoading(false)
            setIsRefreshing(false)
            toast.success("Dashboard data refreshed")
        }, 600)
    }

    useEffect(() => {
        // Check session storage for existing auth
        if (sessionStorage.getItem("fuko_admin_auth") === "true") {
            setTimeout(() => {
                setIsAuthenticated(true)
                loadAllData() // Load data immediately if auth is present
            }, 0)
        }
    }, [])

    const handlePinSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // Hardcoded PIN for this demo - in production use env vars or server-side auth
        if (pin === "2026") {
            setIsAuthenticated(true)
            sessionStorage.setItem("fuko_admin_auth", "true")
            loadAllData()
            toast.success("Welcome back, Commander.")
        } else {
            toast.error("Access Denied. Incorrect Protocol.")
            setPin("")
        }
    }

    // Block render if not authenticated

    // --- Order Actions ---
    const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
        if (updateOrderStatus(orderId, newStatus)) {
            setOrders(getOrders())
            toast.success(`Order ${orderId} updated to ${newStatus}`)
        }
    }

    const handleVerifyPayment = (orderId: string, status: boolean) => {
        if (togglePaymentVerification(orderId, status)) {
            setOrders(getOrders())
            toast.success(status ? "Payment Verified" : "Payment marked as Unverified")
        }
    }

    // --- Inventory Actions ---





    // --- Inventory Actions ---
    const handleSaveProduct = () => {
        if (!tempProduct.name || !tempProduct.price) {
            toast.error("Name and Price are required")
            return
        }
        const productToSave: Product = {
            id: tempProduct.id || tempProduct.name.toLowerCase().replace(/\s+/g, '-'),
            name: tempProduct.name,
            price: Number(tempProduct.price),
            description: tempProduct.description || "",
            image: tempProduct.image || "/placeholder.png",
            isAvailable: tempProduct.isAvailable ?? true,
            isHidden: tempProduct.isHidden ?? false,
            tag: tempProduct.tag
        }
        if (saveProduct(productToSave)) {
            setProducts(getProducts())
            setIsEditingProduct(null)
            toast.success("Product saved to archives")
        }
    }

    const handleToggleVisibility = (product: Product) => {
        const updated = { ...product, isHidden: !product.isHidden }
        if (saveProduct(updated)) {
            setProducts(getProducts())
            toast.info(`Product ${product.name} is now ${updated.isHidden ? 'hidden' : 'visible'}`)
        }
    }

    // --- Settings Actions ---

    // --- Settings Actions ---
    const handleSaveSettings = () => {
        setIsSaving(true)
        if (settings && saveSiteSettings(settings)) {
            setTimeout(() => {
                setIsSaving(false)
                toast.success("Site settings updated live")
            }, 800)
        }
    }

    // --- Image Helper ---
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size should be less than 5MB")
            return
        }

        const reader = new FileReader()
        reader.onloadend = () => {
            callback(reader.result as string)
        }
        reader.readAsDataURL(file)
    }

    // Rendering Helpers
    const filteredOrders = orderFilter === "All" ? orders : orders.filter(o => o.status === orderFilter)

    const stats = {
        totalOrders: orders.length,
        revenue: orders.filter(o => o.status === "Delivered").reduce((sum, o) => sum + o.total, 0),
        avgOrder: orders.length ? Math.round(orders.reduce((sum, o) => sum + o.total, 0) / orders.length) : 0,
        activeProducts: products.filter(p => !p.isHidden).length
    }

    // Block render if not authenticated
    if (!isAuthenticated) {
        return (
            <main className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
                <div className="w-full max-w-sm">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 mb-4 animate-pulse">
                            <Settings className="h-8 w-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-widest uppercase">Restricted Area</h1>
                        <p className="text-gray-400 text-xs mt-2 font-mono">AUTHORIZED PERSONNEL ONLY</p>
                    </div>
                    <form onSubmit={handlePinSubmit} className="space-y-4">
                        <input
                            type="password"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            placeholder="ENTER ACCESS CODE"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-center text-white font-mono tracking-[0.5em] focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all placeholder:tracking-normal placeholder:font-sans"
                            autoFocus
                            maxLength={4}
                        />
                        <button
                            type="submit"
                            className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition-colors uppercase tracking-widest text-sm"
                        >
                            Authenticate
                        </button>
                    </form>
                    <div className="mt-8 text-center">
                        <Link href="/" className="text-gray-500 text-xs hover:text-white transition-colors">← Return to Public Site</Link>
                    </div>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-gray-50 flex flex-col">
            {/* Top Navigation */}
            <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-20">
                <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto w-full">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Archive Operations</h1>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">Fuko Mission Control</p>
                    </div>
                    <div className="hidden md:flex bg-gray-100 p-1 rounded-xl">
                        {(["orders", "inventory", "analytics", "settings"] as AdminTab[]).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={loadAllData}
                        disabled={isRefreshing}
                        className="p-2 text-gray-400 hover:text-gray-900 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        <RefreshCw className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`} />
                    </button>
                </div>
            </header>

            {/* Mobile Nav */}
            <div className="md:hidden bg-white border-b border-gray-200 flex justify-around py-2 px-4 sticky top-[73px] z-10">
                <button onClick={() => setActiveTab("orders")} className={activeTab === "orders" ? "text-accent" : "text-gray-400"}><Clock className="h-6 w-6" /></button>
                <button onClick={() => setActiveTab("inventory")} className={activeTab === "inventory" ? "text-accent" : "text-gray-400"}><LayoutGrid className="h-6 w-6" /></button>
                <button onClick={() => setActiveTab("analytics")} className={activeTab === "analytics" ? "text-accent" : "text-gray-400"}><BarChart3 className="h-6 w-6" /></button>
                <button onClick={() => setActiveTab("settings")} className={activeTab === "settings" ? "text-accent" : "text-gray-400"}><Settings className="h-6 w-6" /></button>
            </div>

            <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 md:p-6">

                {/* --- ORDERS TAB --- */}
                {activeTab === "orders" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Order Filters */}
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {["All", ...STATUS_OPTIONS].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setOrderFilter(status as OrderStatus | "All")}
                                    className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border-2 transition-all ${orderFilter === status ? "bg-gray-900 border-gray-900 text-white" : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"}`}
                                >
                                    {status} ({status === "All" ? orders.length : orders.filter(o => o.status === status).length})
                                </button>
                            ))}
                        </div>

                        {/* Order Cards */}
                        <div className="grid gap-4">
                            {filteredOrders.length === 0 ? (
                                <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                                    <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500 font-bold">No {orderFilter !== "All" ? orderFilter : ""} orders found</p>
                                </div>
                            ) : (
                                filteredOrders.map(order => (
                                    <div key={order.id} className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all">
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                                            <div className="flex-1">
                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                    <span className="font-heading font-bold text-lg">{order.id}</span>
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${STATUS_COLORS[order.status]}`}>{order.status}</span>
                                                </div>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{order.date} • {order.items.length} Items</p>
                                            </div>
                                            <div className="flex items-center sm:items-end justify-between sm:flex-col gap-1">
                                                <p className="font-heading font-bold text-xl text-gray-900">₹{order.total}</p>
                                                <div className="text-right">
                                                    {order.isPaymentVerified ? (
                                                        <span className="text-[10px] font-black text-green-600 flex items-center gap-1 justify-end uppercase tracking-widest">
                                                            <Check className="h-3 w-3" /> Verified
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-black text-amber-500 flex items-center gap-1 justify-end uppercase tracking-widest">
                                                            <Clock className="h-3 w-3" /> Pending
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Customer Box */}
                                        <div className="bg-gray-50 rounded-2xl p-5 mb-6 flex flex-col sm:flex-row gap-6 sm:items-start justify-between">
                                            <div className="space-y-3 flex-1">
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Customer Context</p>
                                                    <p className="text-sm font-bold text-gray-900">{order.customerName || "Walk-in Customer"}</p>
                                                    <p className="text-xs font-bold text-accent">{order.customerPhone || "No Phone Provided"}</p>
                                                </div>
                                                <div className="pt-2 border-t border-gray-200/50">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Shipping Vault</p>
                                                    <p className="text-xs font-medium text-gray-600 leading-relaxed">
                                                        {order.deliveryAddress?.line1}<br />
                                                        {order.deliveryAddress?.line2 && <>{order.deliveryAddress.line2}<br /></>}
                                                        <span className="font-bold text-gray-400 uppercase tracking-tight">Pincode: {order.deliveryAddress?.pincode || "N/A"}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                                {!order.isPaymentVerified && (
                                                    <button
                                                        onClick={() => handleVerifyPayment(order.id, true)}
                                                        className="w-full sm:w-auto px-4 py-2.5 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 active:scale-95 transition-all shadow-sm shadow-green-200"
                                                    >
                                                        Approve Payment
                                                    </button>
                                                )}
                                                <div className="relative w-full sm:w-auto">
                                                    <select
                                                        value={order.status}
                                                        onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                                                        className="w-full sm:w-auto bg-white border border-gray-200 rounded-xl pl-5 pr-10 py-2.5 text-xs font-bold outline-none shadow-sm focus:border-accent appearance-none cursor-pointer"
                                                    >
                                                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Item List Summary */}
                                        <div className="text-[10px] font-bold text-gray-400 flex flex-wrap items-center gap-x-4 gap-y-1">
                                            {order.items.map(i => <span key={i.id} className="whitespace-nowrap flex items-center gap-1"><span className="text-gray-300">/</span> {i.name} (x{i.quantity})</span>)}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* --- INVENTORY TAB --- */}
                {activeTab === "inventory" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center justify-between">
                            <h2 className="font-heading text-2xl font-bold">Archives Inventory</h2>
                            <button
                                onClick={() => {
                                    setTempProduct({ isAvailable: true, isHidden: false, tag: { label: "New", color: "accent" } })
                                    setIsEditingProduct("new")
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-2xl text-sm font-bold shadow-lg shadow-accent/20"
                            >
                                <Plus className="h-4 w-4" /> Add Blend
                            </button>
                        </div>

                        {isEditingProduct ? (
                            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-xl max-w-2xl mx-auto">
                                <h3 className="font-heading text-xl font-bold mb-6">{isEditingProduct === "new" ? "New Archive Blend" : "Edit Blend Details"}</h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black uppercase text-gray-400 px-2">Name</label>
                                            <input
                                                className="w-full bg-gray-50 rounded-2xl p-4 border-none outline-none font-bold text-gray-900"
                                                value={tempProduct.name || ""}
                                                onChange={e => setTempProduct({ ...tempProduct, name: e.target.value })}
                                                placeholder="e.g. Midnight Blend"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black uppercase text-gray-400 px-2">Price (₹)</label>
                                            <input
                                                type="number"
                                                className="w-full bg-gray-50 rounded-2xl p-4 border-none outline-none font-bold text-gray-900"
                                                value={tempProduct.price || ""}
                                                onChange={e => setTempProduct({ ...tempProduct, price: Number(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase text-gray-400 px-2">Description</label>
                                        <textarea
                                            className="w-full bg-gray-50 rounded-2xl p-4 border-none outline-none font-medium text-gray-700 min-h-[100px]"
                                            value={tempProduct.description || ""}
                                            onChange={e => setTempProduct({ ...tempProduct, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <label className="text-xs font-black uppercase text-gray-400 px-2 flex items-center gap-1"><ImageIcon className="h-3 w-3" /> Image Path & Upload</label>
                                            <div className="flex gap-2">
                                                <input
                                                    className="flex-1 bg-gray-50 rounded-2xl p-4 border-none outline-none font-bold text-gray-900 text-sm truncate"
                                                    value={tempProduct.image?.startsWith("data:") ? "Image Uploaded (Base64)" : tempProduct.image || ""}
                                                    readOnly={tempProduct.image?.startsWith("data:")}
                                                    onChange={e => !tempProduct.image?.startsWith("data:") && setTempProduct({ ...tempProduct, image: e.target.value })}
                                                    placeholder="/filename.png or Upload ->"
                                                />
                                                <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl p-4 flex items-center justify-center transition-all min-w-[60px] shrink-0">
                                                    <Plus className="h-6 w-6" />
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => handleImageUpload(e, (base64) => setTempProduct({ ...tempProduct, image: base64 }))}
                                                    />
                                                </label>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-3">
                                                <label className="text-xs font-black uppercase text-gray-400 px-2">Stock Status</label>
                                                <div className="flex flex-col gap-2">
                                                    <button
                                                        onClick={() => setTempProduct({ ...tempProduct, isAvailable: true })}
                                                        className={`w-full p-3 rounded-xl font-bold text-xs border-2 transition-all ${tempProduct.isAvailable ? "bg-nature/10 border-nature text-nature" : "bg-transparent border-gray-100 text-gray-400 hover:border-gray-200"}`}
                                                    >
                                                        In Stock
                                                    </button>
                                                    <button
                                                        onClick={() => setTempProduct({ ...tempProduct, isAvailable: false })}
                                                        className={`w-full p-3 rounded-xl font-bold text-xs border-2 transition-all ${!tempProduct.isAvailable ? "bg-amber-100 border-amber-500 text-amber-700" : "bg-transparent border-gray-100 text-gray-400 hover:border-gray-200"}`}
                                                    >
                                                        Sold Out
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-xs font-black uppercase text-gray-400 px-2">Visibility</label>
                                                <div className="flex flex-col gap-2">
                                                    <button
                                                        onClick={() => setTempProduct({ ...tempProduct, isHidden: false })}
                                                        className={`w-full p-3 rounded-xl font-bold text-xs border-2 transition-all flex items-center justify-center gap-2 ${!tempProduct.isHidden ? "bg-gray-900 border-gray-900 text-white" : "bg-transparent border-gray-100 text-gray-400 hover:border-gray-200"}`}
                                                    >
                                                        <Eye className="h-3 w-3" /> Visible
                                                    </button>
                                                    <button
                                                        onClick={() => setTempProduct({ ...tempProduct, isHidden: true })}
                                                        className={`w-full p-3 rounded-xl font-bold text-xs border-2 transition-all flex items-center justify-center gap-2 ${tempProduct.isHidden ? "bg-gray-100 border-gray-400 text-gray-600" : "bg-transparent border-gray-100 text-gray-400 hover:border-gray-200"}`}
                                                    >
                                                        <EyeOff className="h-3 w-3" /> Hidden
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4 pt-4 border-t border-gray-100">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-black uppercase text-gray-400 px-2">Marketing Badge</label>
                                            <button
                                                onClick={() => setTempProduct({ ...tempProduct, tag: tempProduct.tag ? undefined : { label: "New", color: "accent" } })}
                                                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${tempProduct.tag ? "bg-accent/10 text-accent" : "bg-gray-100 text-gray-400"}`}
                                            >
                                                {tempProduct.tag ? "Active" : "None"}
                                            </button>
                                        </div>
                                        {tempProduct.tag && (
                                            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                                <input
                                                    className="bg-gray-50 rounded-2xl p-4 border-none outline-none font-bold text-gray-900 text-sm"
                                                    value={tempProduct.tag.label}
                                                    onChange={e => setTempProduct({ ...tempProduct, tag: { ...tempProduct.tag!, label: e.target.value } })}
                                                    placeholder="Badge Label (e.g. Best Seller)"
                                                />
                                                <div className="flex p-1 bg-gray-50 rounded-2xl">
                                                    <button
                                                        onClick={() => setTempProduct({ ...tempProduct, tag: { ...tempProduct.tag!, color: "accent" } })}
                                                        className={`flex-1 rounded-xl text-xs font-bold transition-all ${tempProduct.tag.color === "accent" ? "bg-accent text-white shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                                                    >
                                                        Accent
                                                    </button>
                                                    <button
                                                        onClick={() => setTempProduct({ ...tempProduct, tag: { ...tempProduct.tag!, color: "nature" } })}
                                                        className={`flex-1 rounded-xl text-xs font-bold transition-all ${tempProduct.tag.color === "nature" ? "bg-nature text-white shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                                                    >
                                                        Nature
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-4 mt-8 pt-6 border-t border-gray-100">
                                        <button onClick={() => setIsEditingProduct(null)} className="flex-1 py-4 text-gray-400 font-bold hover:text-gray-900 transition-colors">Cancel</button>
                                        <button onClick={handleSaveProduct} className="flex-[2] py-4 bg-gray-900 text-white rounded-3xl font-bold shadow-xl shadow-gray-200 active:scale-95 transition-all">Archive Blend</button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {products.map(product => (
                                    <div key={product.id} className={`bg-white rounded-[2rem] border border-gray-200 overflow-hidden group transition-all ${product.isHidden ? 'opacity-50 grayscale' : ''}`}>
                                        <div className="aspect-[4/5] bg-gray-100 relative">
                                            <img src={product.image} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" alt={product.name} />
                                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-6 pt-12">
                                                <p className="font-heading font-bold text-lg text-white mb-1">{product.name}</p>
                                                <p className="text-white/80 font-bold">₹{product.price}</p>
                                            </div>
                                            {product.tag && (
                                                <span className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white ${product.tag.color === 'accent' ? 'bg-accent shadow-lg shadow-accent/20' : 'bg-nature'}`}>
                                                    {product.tag.label}
                                                </span>
                                            )}
                                        </div>
                                        <div className="p-4 flex items-center justify-between gap-2">
                                            <button
                                                onClick={() => {
                                                    setTempProduct(product)
                                                    setIsEditingProduct(product.id)
                                                }}
                                                className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-900 hover:text-white transition-all"
                                            >
                                                Edit archives
                                            </button>
                                            <button
                                                onClick={() => handleToggleVisibility(product)}
                                                className={`p-2 rounded-xl transition-all ${product.isHidden ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400 hover:text-gray-600'}`}
                                            >
                                                {product.isHidden ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* --- ANALYTICS TAB --- */}
                {activeTab === "analytics" && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                            <button onClick={() => setActiveAnalyticsDetail("orders")} className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-sm hover:shadow-md transition-all text-left group">
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1 group-hover:text-accent transition-colors">Total Orders</p>
                                <p className="text-4xl font-heading font-bold text-gray-900">{stats.totalOrders}</p>
                            </button>
                            <button onClick={() => setActiveAnalyticsDetail("revenue")} className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-sm hover:shadow-md transition-all text-left group">
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1 group-hover:text-accent transition-colors">Total Revenue</p>
                                <p className="text-4xl font-heading font-bold text-accent">₹{stats.revenue}</p>
                            </button>
                            <button onClick={() => setActiveAnalyticsDetail("orders")} className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-sm hover:shadow-md transition-all text-left group">
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1 group-hover:text-accent transition-colors">AOV</p>
                                <p className="text-4xl font-heading font-bold text-gray-900">₹{stats.avgOrder}</p>
                            </button>
                            <button onClick={() => setActiveAnalyticsDetail("inventory")} className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-sm hover:shadow-md transition-all text-left group">
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1 group-hover:text-accent transition-colors">Active Blends</p>
                                <p className="text-4xl font-heading font-bold text-gray-900">{stats.activeProducts}</p>
                            </button>
                        </div>

                        {/* Analytics Detail Modal */}
                        {activeAnalyticsDetail && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/20 backdrop-blur-sm animate-in fade-in duration-200">
                                <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-100">
                                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                        <h3 className="font-heading text-xl font-bold">
                                            {activeAnalyticsDetail === "inventory" ? "Active Blends Breakdown" : "Order Performance Data"}
                                        </h3>
                                        <button onClick={() => setActiveAnalyticsDetail(null)} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                                            <X className="h-5 w-5 text-gray-400" />
                                        </button>
                                    </div>
                                    <div className="max-h-[60vh] overflow-y-auto p-2">
                                        {activeAnalyticsDetail === "inventory" ? (
                                            <div className="grid gap-2">
                                                {products.filter(p => !p.isHidden).map(p => (
                                                    <div key={p.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-colors">
                                                        <div className="h-12 w-12 rounded-xl bg-gray-100 relative overflow-hidden shrink-0">
                                                            {p.image ? <img src={p.image} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-gray-300 font-bold">?</div>}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-bold text-gray-900">{p.name}</p>
                                                            <p className="text-xs font-bold text-gray-400">₹{p.price}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${p.isAvailable ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                                                                {p.isAvailable ? "In Stock" : "Sold Out"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="grid gap-2">
                                                {orders.map(o => (
                                                    <div key={o.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors group">
                                                        <div>
                                                            <p className="font-bold text-gray-900 flex items-center gap-2">
                                                                {o.customerName || "Walk-in Customer"}
                                                                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest px-2 py-0.5 rounded-full border border-gray-100 group-hover:border-gray-200">{o.id}</span>
                                                            </p>
                                                            <p className="text-xs font-bold text-gray-400">{o.date}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-heading font-bold text-lg text-gray-900">₹{o.total}</p>
                                                            <span className={`text-[10px] font-black uppercase tracking-widest ${o.status === 'Delivered' ? 'text-green-600' : 'text-gray-400'}`}>{o.status}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
                                        <button onClick={() => setActiveAnalyticsDetail(null)} className="font-bold text-sm text-gray-500 hover:text-gray-900">Close Data View</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Revenue Curve Mockup */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="font-heading text-xl font-bold">Revenue Archive (30 Days)</h3>
                                <span className="text-xs font-bold text-nature flex items-center gap-1">+12.5% vs last month</span>
                            </div>
                            <div className="h-[300px] w-full bg-gray-50 rounded-3xl relative flex items-end justify-between px-8 pb-4">
                                {/* Mock Chart Bars */}
                                {[40, 60, 45, 90, 65, 80, 55, 100, 75, 45, 60, 30].map((h, i) => (
                                    <div key={i} className="w-4 bg-accent/20 rounded-t-lg transition-all hover:bg-accent cursor-pointer" style={{ height: `${h}%` }}></div>
                                ))}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <p className="text-xs font-black text-gray-300 uppercase tracking-widest">Growth in Protocol</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Best Sellers */}
                            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm">
                                <h3 className="font-heading text-xl font-bold mb-6">Archive Liquidity</h3>
                                <div className="space-y-4">
                                    {products.slice(0, 3).map((p, i) => (
                                        <div key={p.id} className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-xl bg-gray-100 overflow-hidden bg-paper">
                                                <img src={p.image} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 text-sm font-bold">
                                                <p>{p.name}</p>
                                                <p className="text-xs text-gray-400">{i === 0 ? 42 : i === 1 ? 28 : 15} Units Moved</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-gray-900">₹{(i === 0 ? 42 : i === 1 ? 28 : 15) * p.price}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Geography */}
                            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm">
                                <h3 className="font-heading text-xl font-bold mb-6">Network Reach</h3>
                                <div className="space-y-4">
                                    {[
                                        { pin: "122002", city: "Gurgaon", count: 18 },
                                        { pin: "110001", city: "Delhi", count: 12 },
                                        { pin: "400001", city: "Mumbai", count: 5 }
                                    ].map(loc => (
                                        <div key={loc.pin} className="flex items-center justify-between text-sm">
                                            <div className="font-bold">
                                                <p>{loc.city}</p>
                                                <p className="text-[10px] text-gray-400 uppercase tracking-widest">{loc.pin}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="px-3 py-1 bg-gray-100 rounded-full font-black text-[10px]">{loc.count} Orders</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- SETTINGS TAB --- */}
                {activeTab === "settings" && settings && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-white p-10 rounded-[3rem] border border-gray-200 shadow-xl max-w-3xl mx-auto">
                            <h2 className="font-heading text-3xl font-bold mb-8">Mission Control</h2>

                            <div className="space-y-8">
                                {/* Announcement Banner */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-2">
                                        <label className="text-xs font-black uppercase text-gray-400 tracking-widest">Announcement Protocol</label>
                                        <button
                                            onClick={() => setSettings({ ...settings, announcementBanner: { ...settings.announcementBanner, isVisible: !settings.announcementBanner.isVisible } })}
                                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${settings.announcementBanner.isVisible ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}
                                        >
                                            {settings.announcementBanner.isVisible ? "Active" : "Silenced"}
                                        </button>
                                    </div>
                                    <input
                                        className="w-full bg-gray-50 rounded-2xl p-5 border-none outline-none font-bold text-lg text-gray-900"
                                        value={settings.announcementBanner.text}
                                        onChange={e => setSettings({ ...settings, announcementBanner: { ...settings.announcementBanner, text: e.target.value } })}
                                        placeholder="Banner text..."
                                    />
                                    <div className="flex items-center gap-4 bg-gray-50 rounded-[1.5rem] p-4 font-medium text-xs text-gray-500">
                                        <Plus className="h-4 w-4" /> Destination: {settings.announcementBanner.link || "N/A"}
                                    </div>
                                </div>

                                <div className="h-[1px] w-full bg-gray-100"></div>

                                {/* Hero Branding */}
                                <div className="space-y-4">
                                    <label className="text-xs font-black uppercase text-gray-400 tracking-widest px-2">Heritage Branding</label>
                                    <div className="space-y-2">
                                        <p className="text-[10px] text-gray-300 font-bold px-2">Main Archive Title</p>
                                        <input
                                            className="w-full bg-gray-50 rounded-2xl p-5 border-none outline-none font-bold text-gray-900"
                                            value={settings.heroText.title}
                                            onChange={e => setSettings({ ...settings, heroText: { ...settings.heroText, title: e.target.value } })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] text-gray-300 font-bold px-2">Sub-Manifesto</p>
                                        <textarea
                                            className="w-full bg-gray-50 rounded-2xl p-5 border-none outline-none font-medium text-gray-700 min-h-[120px]"
                                            value={settings.heroText.subtitle}
                                            onChange={e => setSettings({ ...settings, heroText: { ...settings.heroText, subtitle: e.target.value } })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] text-gray-300 font-bold px-2">Visual Identity (Hero Image)</p>
                                        <div className="flex items-center gap-4">
                                            {(settings.heroImage || "") && (
                                                <div className="h-16 w-16 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shrink-0">
                                                    <img src={settings.heroImage} className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            <label className="cursor-pointer bg-gray-50 hover:bg-gray-100 text-gray-900 border border-gray-200 rounded-2xl px-6 py-4 font-bold text-sm flex items-center gap-2 transition-all flex-1">
                                                <ImageIcon className="h-4 w-4" />
                                                {settings.heroImage ? "Change Hero Image" : "Upload Hero Image"}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => handleImageUpload(e, (base64) => setSettings({ ...settings, heroImage: base64 }))}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] text-gray-300 font-bold px-2">Ticker Tape Text</p>
                                        <textarea
                                            className="w-full bg-gray-50 rounded-2xl p-5 border-none outline-none font-bold text-gray-900 min-h-[80px]"
                                            value={settings.tickerText || ""}
                                            onChange={e => setSettings({ ...settings, tickerText: e.target.value })}
                                            placeholder="ZERO ADDITIVES • NO EXPANDED VOLUME..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleSaveSettings}
                                disabled={isSaving}
                                className={`w-full mt-10 py-5 rounded-3xl font-bold flex items-center justify-center gap-3 shadow-2xl transition-all active:scale-95 ${isSaving ? "bg-green-600 text-white shadow-green-200" : "bg-gray-900 text-white shadow-gray-300 hover:bg-black"}`}
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" /> Pushing to Archives...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-5 w-5" /> Push to Archives
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </main >
    )
}
