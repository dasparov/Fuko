"use client"

export interface Product {
    id: string
    name: string
    price: number
    description: string
    image: string
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
        image: "/light-soils-blend.png",
        tag: { label: "Best Seller", color: "accent" },
        isAvailable: true,
        isHidden: false
    },
    {
        id: "dark-soils-blend",
        name: "Dark Soils Blend",
        price: 580,
        description: "The Night Blend. Fire-Cured Dark Leaf.",
        image: "/dark-soils-blend.jpg",
        isAvailable: true,
        isHidden: false
    },
    {
        id: "turkish-blend",
        name: "Turkish Blend",
        price: 600,
        description: "The Purity Archives. Certified Organic.",
        image: "/turkish-blend.png",
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
    return JSON.parse(stored)
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
