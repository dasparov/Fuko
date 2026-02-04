"use client"

import { getOrdersAction, updateOrderStatusAction, deleteOrderAction, togglePaymentVerificationAction } from "@/app/actions"
import { Order, OrderStatus } from "@/lib/orders"
import { getAllProductsAdminAction, saveProductAction, deleteProductAction, Product } from "@/app/actions"
import { SiteSettings, DEFAULT_SETTINGS } from "@/lib/settings"
import { getSiteSettingsAction, saveSiteSettingsAction } from "@/app/actions"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
    Package, Check, Clock, X, ChevronDown, Download, Users, MapPin, RefreshCw,
    LayoutGrid, BarChart3, Settings, Eye, EyeOff, Plus, Save, Image as ImageIcon, Loader2,
    ChevronLeft, ChevronRight, Trash2
} from "lucide-react"
import { toast } from "sonner"

const STATUS_OPTIONS: OrderStatus[] = ["Processing", "Shipped", "Out for Delivery", "Delivered", "Cancelled"]

const STATUS_COLORS: Record<OrderStatus, string> = {
    "Processing": "bg-amber-100 text-amber-700",
    "Shipped": "bg-blue-100 text-blue-700",
    "Out for Delivery": "bg-purple-100 text-purple-700",
    "Delivered": "bg-green-100 text-green-700",
    "Cancelled": "bg-red-100 text-red-700"
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
    const [tempProduct, setTempProduct] = useState<Partial<Product>>({ images: [] })

    // Analytics States
    const [selectedMonth, setSelectedMonth] = useState<string>("")
    const [availableMonths, setAvailableMonths] = useState<string[]>([])
    const [selectedCity, setSelectedCity] = useState<string>("")
    const [availableCities, setAvailableCities] = useState<string[]>([])
    const [monthlyStats, setMonthlyStats] = useState<{
        revenue: number,
        orders: number,
        breakdown: Record<string, { name: string, quantity: number, revenue: number }>,
        topCustomer: { name: string, spend: number, orders: number } | null,
        topCity: { name: string, revenue: number, orders: number } | null,
        allCustomers: { name: string, spend: number, orders: number }[],
        allCities: { name: string, revenue: number, orders: number }[]
    } | null>(null)

    // Expanded View State
    const [expandedView, setExpandedView] = useState<"customers" | "cities" | null>(null)
    const [isNetworkExpanded, setIsNetworkExpanded] = useState(false)
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)

    // --- Secure Access Logic ---
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [pin, setPin] = useState("")

    const calculateAnalytics = useCallback((currentOrders: Order[]) => {
        // 1. Extract distinct months
        const monthsSet = new Set<string>()
        currentOrders.forEach(o => {
            const date = new Date(o.date)
            if (!isNaN(date.getTime())) {
                const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
                const monthStr = `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`
                monthsSet.add(monthStr)
            }
        })
        const months = Array.from(monthsSet).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
        setAvailableMonths(months)

        // Default to latest month if available and none selected
        if (months.length > 0 && !selectedMonth) {
            setSelectedMonth(months[0])
        }
    }, [selectedMonth])



    // Calculate report whenever month or orders change
    useEffect(() => {
        if (!selectedMonth || orders.length === 0) return

        // 1. Filter by Month first (Base Set for this Month)
        const monthOrdersBase = orders.filter(o => {
            const date = new Date(o.date)
            if (isNaN(date.getTime())) return false
            const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
            const monthStr = `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`
            return monthStr === selectedMonth && (o.status !== "Processing" || o.isPaymentVerified)
        })

        // 2. Extract Available Cities from this Month's data
        const citiesInMonth = Array.from(new Set(monthOrdersBase.map(o => o.deliveryAddress?.city || "Unknown"))).sort()
        setAvailableCities(citiesInMonth)

        // 3. Apply City Filter if selected
        const finalOrders = selectedCity
            ? monthOrdersBase.filter(o => (o.deliveryAddress?.city || "Unknown") === selectedCity)
            : monthOrdersBase

        const stats = finalOrders.reduce((acc, order) => {
            acc.revenue += order.total
            acc.orders += 1

            // Product Breakdown
            order.items.forEach(item => {
                if (!acc.breakdown[item.id]) {
                    acc.breakdown[item.id] = { name: item.name, quantity: 0, revenue: 0 }
                }
                acc.breakdown[item.id].quantity += item.quantity
                acc.breakdown[item.id].revenue += (item.price * item.quantity)
            })

            // Customer Stats
            const customerName = order.customerName || "Walk-in / Unknown"
            if (!acc.customers[customerName]) {
                acc.customers[customerName] = { name: customerName, spend: 0, orders: 0 }
            }
            acc.customers[customerName].spend += order.total
            acc.customers[customerName].orders += 1

            // City Stats (still useful even if filtered, to confirm)
            const city = order.deliveryAddress?.city || "Unknown Location"
            if (!acc.cities[city]) {
                acc.cities[city] = { name: city, revenue: 0, orders: 0 }
            }
            acc.cities[city].revenue += order.total
            acc.cities[city].orders += 1

            return acc
        }, {
            revenue: 0,
            orders: 0,
            breakdown: {} as Record<string, { name: string, quantity: number, revenue: number }>,
            customers: {} as Record<string, { name: string, spend: number, orders: number }>,
            cities: {} as Record<string, { name: string, revenue: number, orders: number }>
        })

        // Find Top Customer and City
        const allCustomers = Object.values(stats.customers).sort((a, b) => b.spend - a.spend)
        const allCities = Object.values(stats.cities).sort((a, b) => b.revenue - a.revenue)

        const topCustomer = allCustomers[0] || null
        const topCity = allCities[0] || null

        setMonthlyStats({
            revenue: stats.revenue,
            orders: stats.orders,
            breakdown: stats.breakdown,
            topCustomer,
            topCity,
            allCustomers,
            allCities
        })

    }, [selectedMonth, orders, selectedCity])

    const handleDownloadCSV = () => {
        if (!monthlyStats || !selectedMonth) return

        const monthOrders = orders.filter(o => {
            const date = new Date(o.date)
            if (isNaN(date.getTime())) return false
            const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
            const monthStr = `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`

            // Apply both Month and City filter to CSV
            const matchesMonth = monthStr === selectedMonth
            const matchesCity = selectedCity ? (o.deliveryAddress?.city || "Unknown") === selectedCity : true

            return matchesMonth && matchesCity && (o.status !== "Processing" || o.isPaymentVerified)
        })

        // CSV Header
        const headers = ["Order ID", "Date", "Customer Name", "Phone", "City", "Total", "Items"]
        const rows = monthOrders.map(o => [
            o.id,
            new Date(o.date).toLocaleDateString(),
            o.customerName || "Unknown",
            o.customerPhone || "-",
            o.deliveryAddress?.city || "-",
            o.total,
            o.items.map(i => `${i.name} (x${i.quantity})`).join("; ")
        ])

        const csvContent = [
            headers.join(","),
            ...rows.map(r => r.map(c => `"${c}"`).join(","))
        ].join("\n")

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", `Fuko_Report_${selectedMonth.replace(" ", "_")}.csv`)
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }


    const loadAllData = () => {
        setIsRefreshing(true)
        // Simulate network delay for better UX
        setTimeout(async () => {
            // Load resources independently
            const [ordersResult, productsResult, settingsResult] = await Promise.allSettled([
                getOrdersAction(),
                getAllProductsAdminAction(),
                getSiteSettingsAction()
            ]);

            if (ordersResult.status === "fulfilled") {
                setOrders(ordersResult.value);
                calculateAnalytics(ordersResult.value);
            } else {
                console.error("Failed to load orders", ordersResult.reason);
                toast.error("Failed to load orders");
            }

            if (productsResult.status === "fulfilled") {
                setProducts(productsResult.value);
            } else {
                console.error("Failed to load products", productsResult.reason);
                toast.error("Failed to load products");
            }

            if (settingsResult.status === "fulfilled") {
                setSettings(settingsResult.value);
            } else {
                console.error("Failed to load settings", settingsResult.reason);
                // Fallback to complete defaults if KV fails
                setSettings(DEFAULT_SETTINGS);
                toast.error("Using default settings (Load Failed)");
            }

            setIsLoading(false)
            setIsRefreshing(false)
            toast.success("Dashboard refreshed")
        }, 800)
    }



    useEffect(() => {
        // Check session storage for existing auth
        if (sessionStorage.getItem("fuko_admin_auth") === "true") {
            setTimeout(() => {
                setIsAuthenticated(true)
                loadAllData() // Load data immediately if auth is present
            }, 0)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
        if (await updateOrderStatusAction(orderId, newStatus)) {
            const updatedOrders = await getOrdersAction()
            setOrders(updatedOrders)
            toast.success(`Order ${orderId} updated to ${newStatus}`)
        }
    }

    const handleVerifyPayment = async (orderId: string, status: boolean) => {
        if (await togglePaymentVerificationAction(orderId, status)) {
            const updatedOrders = await getOrdersAction()
            setOrders(updatedOrders)
            toast.success(status ? "Payment Verified" : "Payment marked as Unverified")
        }
    }

    const handleDeleteOrder = async (orderId: string) => {
        if (confirm("Are you sure you want to delete this order? This cannot be undone.")) {
            if (await deleteOrderAction(orderId)) {
                const updatedOrders = await getOrdersAction()
                setOrders(updatedOrders) // Refresh list
                setExpandedOrderId(null) // Close expanded view if it was this order
                toast.success("Order deleted successfully")
            } else {
                toast.error("Failed to delete order")
            }
        }
    }

    // --- Inventory Actions ---





    // --- Inventory Actions ---
    const handleSaveProduct = async () => {
        if (!tempProduct.name || !tempProduct.price) {
            toast.error("Name and Price are required")
            return
        }
        const productToSave: Product = {
            id: tempProduct.id || tempProduct.name.toLowerCase().replace(/\s+/g, '-'),
            name: tempProduct.name,
            price: Number(tempProduct.price),
            description: tempProduct.description || "",
            images: tempProduct.images || [],
            isAvailable: tempProduct.isAvailable ?? true,
            isHidden: tempProduct.isHidden ?? false,
            tag: tempProduct.tag
        }
        if (await saveProductAction(productToSave)) {
            setProducts(await getAllProductsAdminAction())
            setIsEditingProduct(null)
            toast.success("Product saved to archives")
        }
    }

    const handleToggleVisibility = async (product: Product) => {
        const updated = { ...product, isHidden: !product.isHidden }
        if (await saveProductAction(updated)) {
            setProducts(await getAllProductsAdminAction())
            toast.info(`Product ${product.name} is now ${updated.isHidden ? 'hidden' : 'visible'}`)
        }
    }

    const handleDeleteProduct = async (id: string) => {
        if (confirm("Are you sure you want to delete this product forever?")) {
            if (await deleteProductAction(id)) {
                setProducts(await getAllProductsAdminAction())
                toast.success("Product deleted")
            } else {
                toast.error("Failed to delete product")
            }
        }
    }

    // --- Settings Actions ---

    // --- Settings Actions ---
    const handleSaveSettings = async () => {
        setIsSaving(true)
        if (settings && await saveSiteSettingsAction(settings)) {
            toast.success("Site settings updated live")
            setIsSaving(false)
        } else {
            toast.error("Failed to save settings")
            setIsSaving(false)
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

    // Standardize logic with Monthly Report
    const validOrders = orders.filter(o => o.status !== "Processing" || o.isPaymentVerified)

    // Network Reach Calculation
    const networkReachMap = validOrders.reduce((acc, order) => {
        const pin = order.deliveryAddress?.pincode || "Unknown"
        const city = order.deliveryAddress?.city || "Unknown Location"
        if (!acc[pin]) {
            acc[pin] = { pin, city, count: 0 }
        }
        acc[pin].count += 1
        return acc
    }, {} as Record<string, { pin: string, city: string, count: number }>)

    const networkReach = Object.values(networkReachMap).sort((a, b) => b.count - a.count)

    const stats = {
        totalOrders: validOrders.length,
        revenue: validOrders.reduce((sum, o) => sum + o.total, 0),
        avgOrder: validOrders.length ? Math.round(validOrders.reduce((sum, o) => sum + o.total, 0) / validOrders.length) : 0,
        activeProducts: products.filter(p => !p.isHidden).length
    }

    // Block render if not authenticated
    if (!isAuthenticated) {
        return (
            <main className="min-h-screen bg-background flex items-center justify-center p-6">
                <div className="w-full max-w-sm">
                    <div className="text-center mb-10">
                        <div className="relative w-24 h-12 mx-auto mb-6">
                            <img src="/fuko-logo-v2.png" alt="Fuko" className="object-contain w-full h-full" />
                        </div>
                        <h1 className="text-xl font-heading font-bold text-primary tracking-widest uppercase">Fuko Mission Control</h1>
                        <p className="text-muted text-xs mt-2 font-bold tracking-wider">RESTRICTED ACCESS</p>
                    </div>
                    <form onSubmit={handlePinSubmit} className="space-y-4">
                        <input
                            type="password"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            placeholder="SECRET PIN"
                            className="w-full bg-paper border-2 border-transparent focus:border-accent/20 rounded-2xl px-4 py-4 text-center text-primary font-heading font-bold text-xl tracking-[0.5em] outline-none transition-all placeholder:tracking-normal placeholder:font-sans placeholder:text-muted/30 placeholder:text-sm"
                            autoFocus
                            maxLength={4}
                        />
                        <button
                            type="submit"
                            className="w-full bg-accent text-white font-bold py-4 rounded-2xl hover:bg-accent/90 active:scale-95 transition-all uppercase tracking-widest text-xs shadow-lg shadow-accent/20"
                        >
                            Unlock
                        </button>
                    </form>
                    <div className="mt-8 text-center">
                        <Link href="/" className="text-muted/50 text-xs font-bold hover:text-accent transition-colors">← Return to Public Site</Link>
                    </div>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-gray-50 flex flex-col" >
            {/* Top Navigation */}
            < header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-20" >
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
            </header >

            {/* Mobile Nav */}
            < div className="md:hidden bg-white border-b border-gray-200 flex justify-around py-2 px-4 sticky top-[73px] z-10" >
                <button onClick={() => setActiveTab("orders")} className={activeTab === "orders" ? "text-accent" : "text-gray-400"}><Clock className="h-6 w-6" /></button>
                <button onClick={() => setActiveTab("inventory")} className={activeTab === "inventory" ? "text-accent" : "text-gray-400"}><LayoutGrid className="h-6 w-6" /></button>
                <button onClick={() => setActiveTab("analytics")} className={activeTab === "analytics" ? "text-accent" : "text-gray-400"}><BarChart3 className="h-6 w-6" /></button>
                <button onClick={() => setActiveTab("settings")} className={activeTab === "settings" ? "text-accent" : "text-gray-400"}><Settings className="h-6 w-6" /></button>
            </div >

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
                                    <div key={order.id} className="bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
                                        {/* Minimal Header */}
                                        <div
                                            className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                            onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                                        >
                                            <div className="flex items-center justify-between sm:justify-start gap-4 flex-1">
                                                <div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-heading font-bold text-lg">{order.id}</span>
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${STATUS_COLORS[order.status]}`}>{order.status}</span>
                                                    </div>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight mt-1">{order.date} • {order.items.length} Items</p>
                                                </div>

                                                {/* Mobile Price/Status Layout */}
                                                <div className="sm:hidden text-right">
                                                    <p className="font-heading font-bold text-lg text-gray-900">₹{order.total}</p>
                                                    {order.isPaymentVerified ? (
                                                        <span className="text-[10px] font-black text-green-600 flex items-center justify-end gap-1 uppercase tracking-widest"><Check className="h-3 w-3" /> Verified</span>
                                                    ) : (
                                                        <span className="text-[10px] font-black text-amber-500 flex items-center justify-end gap-1 uppercase tracking-widest"><Clock className="h-3 w-3" /> Pending</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Desktop Price/Status & Chevron */}
                                            <div className="hidden sm:flex items-center gap-6">
                                                <div className="text-right">
                                                    <p className="font-heading font-bold text-xl text-gray-900">₹{order.total}</p>
                                                    {order.isPaymentVerified ? (
                                                        <span className="text-[10px] font-black text-green-600 flex items-center justify-end gap-1 uppercase tracking-widest"><Check className="h-3 w-3" /> Verified</span>
                                                    ) : (
                                                        <span className="text-[10px] font-black text-amber-500 flex items-center justify-end gap-1 uppercase tracking-widest"><Clock className="h-3 w-3" /> Pending</span>
                                                    )}
                                                </div>
                                                <div className={`p-2 rounded-full border border-gray-100 bg-white transition-all duration-300 ${expandedOrderId === order.id ? "rotate-180 bg-gray-50 border-gray-200" : ""}`}>
                                                    <ChevronDown className="h-5 w-5 text-gray-400" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Expanded Details */}
                                        {expandedOrderId === order.id && (
                                            <div className="px-6 pb-6 pt-0 animate-in slide-in-from-top-2 duration-300">
                                                <div className="h-[1px] w-full bg-gray-100 mb-6"></div>

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
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleDeleteOrder(order.id)
                                                            }}
                                                            className="w-full sm:w-auto px-4 py-2.5 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 active:scale-95 transition-all"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                        {!order.isPaymentVerified && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    handleVerifyPayment(order.id, true)
                                                                }}
                                                                className="w-full sm:w-auto px-4 py-2.5 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 active:scale-95 transition-all shadow-sm shadow-green-200"
                                                            >
                                                                Approve Payment
                                                            </button>
                                                        )}
                                                        <div className="relative w-full sm:w-auto" onClick={e => e.stopPropagation()}>
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
                                                <div className="flex flex-col gap-2">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Order Manifest</p>
                                                    <div className="space-y-2">
                                                        {order.items.map(i => (
                                                            <div key={i.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl">
                                                                <div className="flex items-center gap-3">
                                                                    <span className="h-6 w-6 rounded-md bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">x{i.quantity}</span>
                                                                    <span className="text-xs font-bold text-gray-900">{i.name}</span>
                                                                </div>
                                                                <span className="text-xs font-bold text-gray-900">₹{i.price * i.quantity}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Payment Proof Viewer */}
                                                {order.paymentScreenshot && (
                                                    <div className="mt-6 border-t border-gray-100 pt-6">
                                                        <details className="group">
                                                            <summary className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-500 group-open:text-gray-900 transition-colors select-none">
                                                                <ImageIcon className="h-4 w-4" />
                                                                <span>View Payment Proof</span>
                                                                <ChevronDown className="h-3 w-3 group-open:rotate-180 transition-transform" />
                                                            </summary>
                                                            <div className="mt-4 p-2 bg-gray-100/50 rounded-2xl border border-gray-200/50 inline-block">
                                                                <img
                                                                    src={order.paymentScreenshot}
                                                                    alt="Payment Proof"
                                                                    className="max-h-96 rounded-xl object-contain shadow-sm"
                                                                />
                                                                <a
                                                                    href={order.paymentScreenshot}
                                                                    download={`Proof-${order.id}.png`}
                                                                    className="mt-2 flex items-center justify-center gap-2 w-full py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                                                                >
                                                                    <Download className="h-3 w-3" /> Download Proof
                                                                </a>
                                                            </div>
                                                        </details>
                                                    </div>
                                                )}
                                            </div>
                                        )}
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
                            <h2 className="font-heading text-2xl font-bold">Inventory</h2>
                            <button
                                onClick={() => {
                                    setTempProduct({ isAvailable: true, isHidden: false, tag: { label: "New", color: "accent" }, images: [] })
                                    setIsEditingProduct("new")
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-2xl text-sm font-bold shadow-lg shadow-accent/20"
                            >
                                <Plus className="h-4 w-4" /> Add
                            </button>
                        </div>

                        {isEditingProduct ? (
                            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-xl max-w-2xl mx-auto">
                                <h3 className="font-heading text-xl font-bold mb-6">{isEditingProduct === "new" ? "New product" : "Edit product"}</h3>
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
                                        <div className="space-y-4">
                                            <label className="text-xs font-black uppercase text-gray-400 px-2 flex items-center gap-1"><ImageIcon className="h-3 w-3" /> Product Gallery (Max 5)</label>

                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                {(tempProduct.images || []).map((img, idx) => (
                                                    <div key={idx} className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 group">
                                                        <img src={img} className="w-full h-full object-cover" alt={`Product ${idx}`} />

                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => {
                                                                        const newImages = [...tempProduct.images!];
                                                                        if (idx > 0) {
                                                                            [newImages[idx], newImages[idx - 1]] = [newImages[idx - 1], newImages[idx]];
                                                                            setTempProduct({ ...tempProduct, images: newImages });
                                                                        }
                                                                    }}
                                                                    className="p-1.5 bg-white/20 hover:bg-white/40 text-white rounded-lg backdrop-blur-sm disabled:opacity-30"
                                                                    title="Move Left"
                                                                    disabled={idx === 0}
                                                                >
                                                                    <ChevronLeft className="h-4 w-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        const newImages = [...tempProduct.images!];
                                                                        if (idx < newImages.length - 1) {
                                                                            [newImages[idx], newImages[idx + 1]] = [newImages[idx + 1], newImages[idx]];
                                                                            setTempProduct({ ...tempProduct, images: newImages });
                                                                        }
                                                                    }}
                                                                    className="p-1.5 bg-white/20 hover:bg-white/40 text-white rounded-lg backdrop-blur-sm disabled:opacity-30"
                                                                    title="Move Right"
                                                                    disabled={idx === (tempProduct.images?.length || 0) - 1}
                                                                >
                                                                    <ChevronRight className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    const newImages = tempProduct.images?.filter((_, i) => i !== idx);
                                                                    setTempProduct({ ...tempProduct, images: newImages });
                                                                }}
                                                                className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                        <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/60 text-white text-[8px] font-black uppercase rounded">
                                                            P{idx + 1}
                                                        </div>
                                                    </div>
                                                ))}

                                                {(tempProduct.images?.length || 0) < 5 && (
                                                    <label className="aspect-square border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-accent hover:text-accent cursor-pointer transition-all">
                                                        <Plus className="h-8 w-8" />
                                                        <span className="text-[10px] font-black uppercase">Add Image</span>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={(e) => handleImageUpload(e, (base64) => {
                                                                setTempProduct({ ...tempProduct, images: [...(tempProduct.images || []), base64] })
                                                            })}
                                                        />
                                                    </label>
                                                )}
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
                                            <img src={product.images?.[0] || "/placeholder.png"} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" alt={product.name} />
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
                                                Edit product
                                            </button>
                                            <button
                                                onClick={() => handleToggleVisibility(product)}
                                                className={`p-2 rounded-xl transition-all ${product.isHidden ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400 hover:text-gray-600'}`}
                                            >
                                                {product.isHidden ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteProduct(product.id)}
                                                className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-all"
                                            >
                                                <Trash2 className="h-5 w-5" />
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
                                                            {p.images?.[0] ? <img src={p.images[0]} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-gray-300 font-bold">?</div>}
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
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm min-h-[400px]">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                                <h3 className="font-heading text-xl font-bold">Monthly Report</h3>
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <button
                                        onClick={handleDownloadCSV}
                                        className="p-2.5 shrink-0 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
                                        title="Download CSV"
                                    >
                                        <Download className="h-4 w-4" />
                                    </button>
                                    <div className="relative flex-1 sm:flex-none">
                                        <select
                                            value={selectedCity}
                                            onChange={(e) => setSelectedCity(e.target.value)}
                                            className="appearance-none bg-white border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-accent focus:border-accent block w-full sm:w-32 p-2.5 pr-8 font-bold cursor-pointer"
                                        >
                                            <option value="">All Cities</option>
                                            {availableCities.map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                                    </div>
                                    <div className="relative flex-1 sm:flex-none">
                                        <select
                                            value={selectedMonth}
                                            onChange={(e) => {
                                                setSelectedMonth(e.target.value)
                                                setSelectedCity("") // Reset city on month change
                                            }}
                                            className="appearance-none bg-white border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-accent focus:border-accent block w-full sm:w-auto p-2.5 pr-8 font-bold cursor-pointer"
                                        >
                                            {availableMonths.map(m => (
                                                <option key={m} value={m}>{m}</option>
                                            ))}
                                            {availableMonths.length === 0 && <option>No data available</option>}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            {monthlyStats ? (
                                <div className="space-y-8 animate-in fade-in duration-300">
                                    {/* High Level Stats */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gray-50 rounded-2xl p-6">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Sales</p>
                                            <p className="text-3xl font-heading font-bold text-gray-900">₹{monthlyStats.revenue}</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-2xl p-6">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Orders</p>
                                            <p className="text-3xl font-heading font-bold text-gray-900">{monthlyStats.orders}</p>
                                        </div>
                                    </div>

                                    {/* Blend Breakup */}
                                    <div>
                                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Blend-wise Breakup</h4>
                                        <div className="space-y-3">
                                            {Object.values(monthlyStats.breakdown).sort((a, b) => b.revenue - a.revenue).map((item) => (
                                                <div key={item.name} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
                                                    <div>
                                                        <p className="font-bold text-gray-900">{item.name}</p>
                                                        <p className="text-xs font-bold text-gray-400">{item.quantity} units sold</p>
                                                    </div>
                                                    <p className="font-bold text-accent">₹{item.revenue}</p>
                                                </div>
                                            ))}
                                            {Object.keys(monthlyStats.breakdown).length === 0 && (
                                                <p className="text-sm font-bold text-gray-400 text-center py-4">No blends sold this month.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Customer & Location Insights */}
                                    {(monthlyStats.topCustomer || monthlyStats.topCity) && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                                            {monthlyStats.topCustomer && (
                                                <div
                                                    onClick={() => setExpandedView("customers")}
                                                    className="bg-amber-50 rounded-2xl p-6 border border-amber-100 cursor-pointer hover:shadow-md transition-all group"
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Top Patron</p>
                                                        <Users className="h-4 w-4 text-amber-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                    <p className="text-xl font-heading font-bold text-gray-900 truncate">{monthlyStats.topCustomer.name}</p>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <p className="text-sm font-bold text-amber-700">₹{monthlyStats.topCustomer.spend} Spent</p>
                                                        <span className="w-1 h-1 bg-amber-300 rounded-full"></span>
                                                        <p className="text-xs text-amber-600 font-medium">{monthlyStats.topCustomer.orders} Orders</p>
                                                    </div>
                                                    <p className="text-[10px] font-bold text-amber-400 mt-4 text-right group-hover:underline">View All Patrons →</p>
                                                </div>
                                            )}
                                            {monthlyStats.topCity && (
                                                <div
                                                    onClick={() => setExpandedView("cities")}
                                                    className="bg-blue-50 rounded-2xl p-6 border border-blue-100 cursor-pointer hover:shadow-md transition-all group"
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Top Location</p>
                                                        <MapPin className="h-4 w-4 text-blue-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                    <p className="text-xl font-heading font-bold text-gray-900 truncate">{monthlyStats.topCity.name}</p>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <p className="text-sm font-bold text-blue-700">₹{monthlyStats.topCity.revenue} Revenue</p>
                                                        <span className="w-1 h-1 bg-blue-300 rounded-full"></span>
                                                        <p className="text-xs text-blue-600 font-medium">{monthlyStats.topCity.orders} Orders</p>
                                                    </div>
                                                    <p className="text-[10px] font-bold text-blue-400 mt-4 text-right group-hover:underline">View Network Reach →</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-300 font-bold uppercase tracking-widest text-xs py-20">
                                    Select a month to view report
                                </div>
                            )}
                        </div>

                        {/* Expanded View Modal */}
                        {expandedView && monthlyStats && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm animate-in fade-in">
                                <div className="w-full max-w-lg rounded-[2rem] bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="font-heading text-2xl font-bold">
                                            {expandedView === "customers" ? "Patron List" : "Network Reach"}
                                        </h3>
                                        <button onClick={() => setExpandedView(null)} className="rounded-full bg-gray-100 p-2 hover:bg-gray-200">
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>

                                    <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-200">
                                        {expandedView === "customers" ? (
                                            monthlyStats.allCustomers.map((cust, i) => (
                                                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-600">
                                                            {i + 1}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-900">{cust.name}</p>
                                                            <p className="text-xs font-medium text-gray-500">{cust.orders} Orders</p>
                                                        </div>
                                                    </div>
                                                    <p className="font-bold text-amber-600">₹{cust.spend}</p>
                                                </div>
                                            ))
                                        ) : (
                                            monthlyStats.allCities.map((city, i) => (
                                                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                                                            {i + 1}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-900">{city.name}</p>
                                                            <p className="text-xs font-medium text-gray-500">{city.orders} Orders</p>
                                                        </div>
                                                    </div>
                                                    <p className="font-bold text-blue-600">₹{city.revenue}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Best Sellers */}
                            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm">
                                <h3 className="font-heading text-xl font-bold mb-6">Archive Liquidity</h3>
                                <div className="space-y-4">
                                    {(() => {
                                        // Calculate All-Time Product Performance
                                        const productPerf = validOrders.reduce((acc, order) => {
                                            order.items.forEach(item => {
                                                if (!acc[item.id]) {
                                                    acc[item.id] = {
                                                        ...item,
                                                        totalQty: 0,
                                                        totalRev: 0,
                                                        // Ensure we have the latest product details if available
                                                        details: products.find(p => p.id === item.id)
                                                    }
                                                }
                                                acc[item.id].totalQty += item.quantity
                                                acc[item.id].totalRev += (item.price * item.quantity)
                                            })
                                            return acc
                                        }, {} as Record<string, { name: string, price: number, totalQty: number, totalRev: number, details?: Product }>)

                                        const topProducts = Object.values(productPerf)
                                            .sort((a, b) => b.totalRev - a.totalRev)
                                            .slice(0, 3)

                                        if (topProducts.length === 0) {
                                            return <p className="text-center text-xs text-gray-400 font-bold py-4 uppercase tracking-widest">No Sales Data Yet</p>
                                        }

                                        return topProducts.map((p) => (
                                            <div key={p.details?.id || p.name} className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-gray-100 overflow-hidden bg-paper">
                                                    <img src={p.details?.images?.[0] || "/placeholder.png"} className="w-full h-full object-cover" alt={p.name} />
                                                </div>
                                                <div className="flex-1 text-sm font-bold">
                                                    <p>{p.name}</p>
                                                    <p className="text-xs text-gray-400">{p.totalQty} Units Moved</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-gray-900">₹{p.totalRev}</p>
                                                </div>
                                            </div>
                                        ))
                                    })()}
                                </div>
                            </div>

                            {/* Geography */}                            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm transition-all duration-300">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-heading text-xl font-bold">Network Reach</h3>
                                    {networkReach.length > 5 && (
                                        <button
                                            onClick={() => setIsNetworkExpanded(!isNetworkExpanded)}
                                            className="p-2 rounded-full hover:bg-gray-50 transition-colors"
                                        >
                                            <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${isNetworkExpanded ? "rotate-180" : ""}`} />
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    {(isNetworkExpanded ? networkReach : networkReach.slice(0, 5)).map((loc, idx) => (
                                        <div key={loc.pin + idx} className="flex items-center justify-between text-sm animate-in fade-in slide-in-from-top-1 duration-300">
                                            <div className="font-bold">
                                                <p>{loc.city}</p>
                                                <p className="text-[10px] text-gray-400 uppercase tracking-widest">{loc.pin === "Unknown" ? "Unknown PIN" : loc.pin}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="px-3 py-1 bg-gray-100 rounded-full font-black text-[10px]">{loc.count} Orders</span>
                                            </div>
                                        </div>
                                    ))}
                                    {networkReach.length === 0 && (
                                        <p className="text-center text-xs text-gray-400 font-bold py-4 uppercase tracking-widest">No Data Yet</p>
                                    )}
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

                            {/* Danger Zone */}
                            {/* Danger Zone Removed (Legacy LocalStorage Reset) */}
                        </div>
                    </div>
                )}

            </div>
        </main >
    )
}
