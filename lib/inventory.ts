"use client"

export interface Product {
    id: string
    name: string
    price: number
    description: string
    images: string[]
    tag?: {
        label: string
        color: "accent" | "nature"
    }
    isAvailable: boolean
    isHidden: boolean
}

const STORAGE_KEY = "fuko_inventory"

const INITIAL_PRODUCTS: Product[] = [
    {
        id: "light-soils-blend",
        name: "Light Soils Blend",
        price: 550,
        description: "The Foundation. 100% Whole-Leaf Virginia.",
        images: ["/light-soils-blend.png"],
        tag: { label: "Best Seller", color: "accent" },
        isAvailable: true,
        isHidden: false
    },
    {
        id: "dark-soils-blend",
        name: "Dark Soils Blend",
        price: 580,
        description: "The Night Blend. Fire-Cured Dark Leaf.",
        images: ["/dark-soils-blend.jpg"],
        isAvailable: true,
        isHidden: false
    },
    {
        id: "turkish-blend",
        name: "Turkish Blend",
        price: 600,
        description: "The Purity Archives. Certified Organic.",
        images: ["/turkish-blend.png"],
        tag: { label: "Limited", color: "nature" },
        isAvailable: true,
        isHidden: false
    }
]

export const getProducts = (): Product[] => {
    if (typeof window === "undefined") return INITIAL_PRODUCTS
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PRODUCTS))
        return INITIAL_PRODUCTS
    }

    let products = JSON.parse(stored)

    // Migration: image (string) -> images (string[])
    let migrated = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    products = products.map((p: any) => {
        if (p.image && !p.images) {
            p.images = [p.image]
            delete p.image
            migrated = true
        }
        if (!p.images) {
            p.images = []
            migrated = true
        }
        return p
    })

    if (migrated) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
    }

    return products
}

export const getProductById = (id: string): Product | undefined => {
    return getProducts().find(p => p.id === id)
}

export const saveProduct = (product: Product): boolean => {
    try {
        const products = getProducts()
        const index = products.findIndex(p => p.id === product.id)
        if (index > -1) {
            products[index] = product
        } else {
            products.push(product)
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
        return true
    } catch {
        return false
    }
}

export const deleteProduct = (id: string): boolean => {
    try {
        const products = getProducts()
        const filtered = products.filter(p => p.id !== id)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
        return true
    } catch {
        return false
    }
}
