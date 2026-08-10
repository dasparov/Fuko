import { describe, it, expect } from 'vitest'
import { characterOf, dotPosition, BLEND_CHARACTER, SCALE_MAX } from './blend-character'

describe('characterOf', () => {
    it('returns the character for a blend', () => {
        expect(characterOf('turkish-blend')).toMatchObject({ body: 3, finish: 1 })
    })

    it('returns undefined for a product that is not tobacco', () => {
        // The clay humidity button must never show a strength meter. It has no
        // entry, and the components render nothing on undefined.
        expect(characterOf('terracotta-button')).toBeUndefined()
    })

    it('returns undefined for an unknown id', () => {
        expect(characterOf('not-a-product')).toBeUndefined()
    })
})

describe('dotPosition', () => {
    it('centres the marker in its band', () => {
        expect(dotPosition(2)).toBeCloseTo(0.3)
        expect(dotPosition(3)).toBeCloseTo(0.5)
    })

    it('never pins to either end cap', () => {
        // A 1 sitting at 0 or a 5 sitting at 1 reads as "off the scale", which
        // is the opposite of what a shared band is for.
        for (let n = 1; n <= SCALE_MAX; n++) {
            expect(dotPosition(n)).toBeGreaterThan(0)
            expect(dotPosition(n)).toBeLessThan(1)
        }
    })
})

describe('BLEND_CHARACTER data', () => {
    it('keeps every blend inside the scale, and none above 4 — Fuko sells no harsh tobacco', () => {
        for (const [id, c] of Object.entries(BLEND_CHARACTER)) {
            expect(c.body, id).toBeGreaterThanOrEqual(1)
            expect(c.body, id).toBeLessThanOrEqual(4)
            expect(c.finish, id).toBeGreaterThanOrEqual(1)
            expect(c.finish, id).toBeLessThanOrEqual(SCALE_MAX)
        }
    })

    it('gives every curing label both a process name and a note', () => {
        for (const [id, c] of Object.entries(BLEND_CHARACTER)) {
            if (!c.curing) continue
            expect(c.curing.name, id).toBeTruthy()
            expect(c.curing.note, id).toBeTruthy()
        }
    })
})
