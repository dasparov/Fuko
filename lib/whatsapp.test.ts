import { describe, it, expect } from 'vitest'
import { whatsappMessage, whatsappUrl, WHATSAPP_BUTTON_LABEL } from './whatsapp'
import { Order, OrderStatus } from './orders'

const ALL_STATUSES: OrderStatus[] = [
    'Awaiting Payment', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled',
]

const order = (over: Partial<Order>): Order => ({
    id: 'ORD-1',
    date: 'Aug 8, 2026',
    status: 'Processing',
    items: [{ id: 'p1', name: 'Ghee', price: 550, quantity: 2, image: '' }],
    total: 550,
    customerName: 'Asha',
    customerPhone: '9876543210',
    ...over,
})

describe('whatsappMessage', () => {
    it('says something different for every status', () => {
        // The whole point: the customer must not get "payment received" again
        // when the order ships.
        const texts = ALL_STATUSES.map(status => whatsappMessage(order({ status })))
        expect(new Set(texts).size).toBe(ALL_STATUSES.length)
    })

    it('names the status the customer cares about', () => {
        expect(whatsappMessage(order({ status: 'Shipped' }))).toContain('has shipped')
        expect(whatsappMessage(order({ status: 'Out for Delivery' }))).toContain('out for delivery')
        expect(whatsappMessage(order({ status: 'Delivered' }))).toContain('has been delivered')
        expect(whatsappMessage(order({ status: 'Cancelled' }))).toContain('has been cancelled')
    })

    it('includes the tracking number only once the admin has entered one', () => {
        const withId = whatsappMessage(order({ status: 'Shipped', trackingId: 'BD1234567IN' }))
        expect(withId).toContain('Tracking number: BD1234567IN')

        // No half-written "Tracking number:" line when the field is still empty.
        expect(whatsappMessage(order({ status: 'Shipped' }))).not.toContain('Tracking')
        expect(whatsappMessage(order({ status: 'Shipped', trackingId: '' }))).not.toContain('Tracking')
    })

    it('never leaks a tracking number into a status that has not shipped', () => {
        const text = whatsappMessage(order({ status: 'Processing', trackingId: 'BD1234567IN' }))
        expect(text).not.toContain('BD1234567IN')
    })

    it('falls back to a greeting when the order has no customer name', () => {
        // Asserts the fallback name, not the punctuation around it, so the copy
        // stays free to change without breaking this.
        expect(whatsappMessage(order({ customerName: undefined }))).toContain('Hi there')
    })

    it('quotes the exact UPI amount so it matches the payment feed', () => {
        const text = whatsappMessage(order({ status: 'Processing', total: 550, paymentAmount: 550.74 }))
        expect(text).toContain('₹550.74')
    })
})

describe('whatsappUrl', () => {
    it('adds the country code to a bare 10-digit Indian number', () => {
        expect(whatsappUrl(order({}))).toContain('wa.me/919876543210')
    })

    it('leaves an already-prefixed number alone', () => {
        expect(whatsappUrl(order({ customerPhone: '+91 98765 43210' }))).toContain('wa.me/919876543210')
    })

    it('url-encodes the message', () => {
        const url = whatsappUrl(order({ status: 'Delivered' }))
        // A raw space or # would truncate the prefill.
        expect(url.split('?text=')[1]).not.toContain(' ')
    })
})

describe('WHATSAPP_BUTTON_LABEL', () => {
    it('labels every status', () => {
        for (const status of ALL_STATUSES) {
            expect(WHATSAPP_BUTTON_LABEL[status]).toBeTruthy()
        }
    })
})
