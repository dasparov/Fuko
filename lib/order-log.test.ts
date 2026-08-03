import { describe, it, expect } from 'vitest'
import { buildOrderRow, orderMarkdown, istTimestamp } from './order-log'
import type { Order } from './orders'

// Noon UTC = 17:30 IST — catches both the timezone and the format.
const NOW = new Date('2026-08-03T12:00:00Z')

const order = (over: Partial<Order> = {}): Order => ({
    id: 'ORD-1234',
    date: 'Aug 3, 2026',
    status: 'Awaiting Payment',
    items: [
        { id: 'p1', name: 'Mango Blend', price: 275, quantity: 2, image: '/m.jpg' },
        { id: 'p2', name: 'Ginger Mix', price: 300, quantity: 1, image: '/g.jpg' },
    ],
    total: 850,
    customerName: 'Test Buyer',
    customerPhone: '90000 00000',
    deliveryAddress: { type: 'Home', line1: '12 Beach Rd', line2: '', city: 'Panjim', state: 'Goa', pincode: '403001' },
    paymentAmount: 850.42,
    ...over,
})

const extras = { email: 'buyer@example.com', userId: '7' }

describe('istTimestamp', () => {
    it('renders IST, not UTC', () => {
        expect(istTimestamp(NOW)).toBe('03 Aug 2026, 17:30:00')
    })
})

describe('buildOrderRow', () => {
    it('is 13 cells with the paise-fingerprinted amount where reconciliation looks', () => {
        const row = buildOrderRow('awaiting', order(), extras, NOW)
        expect(row).toHaveLength(13)
        expect(row[0]).toBe('03 Aug 2026, 17:30:00')
        expect(row[1]).toBe('awaiting')
        expect(row[2]).toBe('ORD-1234')
        expect(row[3]).toBe(850.42) // amount_requested — matches the bank credit
        expect(row[4]).toBe(850)
        expect(row[5]).toContain('2× Mango Blend')
        expect(row[7]).toBe('90000 00000')
        expect(row[8]).toBe('buyer@example.com')
        expect(row[9]).toContain('Panjim')
        expect(row[10]).toBe('403001')
    })

    it('survives a missing address and phone without breaking shape', () => {
        const row = buildOrderRow('paid', order({ deliveryAddress: undefined, customerPhone: undefined }), {}, NOW)
        expect(row).toHaveLength(13)
        expect(row[7]).toBe('')
        expect(row[9]).toBe('')
        expect(row[10]).toBe('')
    })
})

describe('orderMarkdown', () => {
    it('carries everything needed to honour the order by hand', () => {
        const md = orderMarkdown('paid', order(), extras, NOW)
        expect(md).toContain('PAID')
        expect(md).toContain('₹850.42')
        expect(md).toContain('Test Buyer')
        expect(md).toContain('90000 00000')
        expect(md).toContain('12 Beach Rd')
        expect(md).toContain('403001')
    })

    it('notes a screenshot without embedding the base64', () => {
        const md = orderMarkdown('paid', order({ paymentScreenshot: 'data:image/png;base64,AAAA' }), extras, NOW)
        expect(md).toContain('Screenshot attached in app:** yes')
        expect(md).not.toContain('base64')
    })
})
