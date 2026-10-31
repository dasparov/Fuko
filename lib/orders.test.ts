import { describe, it, expect } from 'vitest'
import { countsAsSale, soldOutItems, shippingFor, orderShipping, Order } from './orders'

describe('shipping', () => {
    it('charges up to and including 1500, free only above it', () => {
        expect(shippingFor(1499)).toBe(60)
        expect(shippingFor(1500)).toBe(60)
        expect(shippingFor(1501)).toBe(0)
    })

    it('reads the fee back from a saved order, and 0 from orders before the fee', () => {
        const items = [{ id: 'a', name: 'A', price: 500, quantity: 2, image: '' }]
        expect(orderShipping({ total: 1060, items })).toBe(60)
        expect(orderShipping({ total: 1000, items })).toBe(0)
    })
})

const order = (over: Partial<Order>): Order => ({
    id: 'ORD-1',
    date: 'Aug 3, 2026',
    status: 'Processing',
    items: [],
    total: 550,
    ...over,
})

describe('countsAsSale', () => {
    it('never counts a cancelled order, even one that was verified', () => {
        expect(countsAsSale(order({ status: 'Cancelled' }))).toBe(false)
        expect(countsAsSale(order({ status: 'Cancelled', isPaymentVerified: true }))).toBe(false)
    })

    it('never counts an order that is still awaiting payment', () => {
        // The whole point of the pending row: it must not inflate revenue.
        expect(countsAsSale(order({ status: 'Awaiting Payment' }))).toBe(false)
        expect(countsAsSale(order({ status: 'Awaiting Payment', isPaymentVerified: true }))).toBe(false)
    })

    it('counts Processing only once payment is verified', () => {
        expect(countsAsSale(order({ status: 'Processing' }))).toBe(false)
        expect(countsAsSale(order({ status: 'Processing', isPaymentVerified: true }))).toBe(true)
    })

    it('counts orders that have moved past Processing', () => {
        expect(countsAsSale(order({ status: 'Shipped' }))).toBe(true)
        expect(countsAsSale(order({ status: 'Delivered' }))).toBe(true)
    })
})

describe('soldOutItems', () => {
    const catalogue = [
        { id: 'dark-soils-blend', isAvailable: false },
        { id: 'turkish-blend', isAvailable: true },
    ]
    const line = (id: string) => ({ id, name: id.toUpperCase() })

    it('names the cart lines the catalogue marks unavailable', () => {
        expect(soldOutItems([line('dark-soils-blend')], catalogue)).toEqual(['DARK-SOILS-BLEND'])
    })

    it('lets an available cart through', () => {
        expect(soldOutItems([line('turkish-blend')], catalogue)).toEqual([])
    })

    it('blocks a product missing from the catalogue — hidden or deleted', () => {
        expect(soldOutItems([line('ghost-blend')], catalogue)).toEqual(['GHOST-BLEND'])
    })

    it('fails open when the catalogue is empty, so a DB outage cannot halt sales', () => {
        expect(soldOutItems([line('dark-soils-blend')], [])).toEqual([])
    })
})
