import { describe, it, expect } from 'vitest'
import { countsAsSale, Order } from './orders'

const order = (over: Partial<Order>): Order => ({
    id: 'ORD-1',
    date: 'Aug 3, 2026',
    status: 'Processing',
    items: [],
    total: 550,
    ...over,
})

describe('countsAsSale', () => {
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
