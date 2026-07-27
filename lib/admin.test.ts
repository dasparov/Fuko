import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockAuth = vi.fn()
vi.mock('@/auth', () => ({ auth: () => mockAuth() }))

import { isAdmin } from './admin'

describe('isAdmin', () => {
    beforeEach(() => {
        mockAuth.mockReset()
        process.env.ADMIN_EMAILS = 'admin@example.com, Second@Example.com'
    })

    it('allows a listed email (case-insensitive)', async () => {
        mockAuth.mockResolvedValue({ user: { email: 'ADMIN@example.com' } })
        expect(await isAdmin()).toBe(true)
    })

    it('rejects an unlisted email', async () => {
        mockAuth.mockResolvedValue({ user: { email: 'evil@example.com' } })
        expect(await isAdmin()).toBe(false)
    })

    it('rejects when signed out', async () => {
        mockAuth.mockResolvedValue(null)
        expect(await isAdmin()).toBe(false)
    })

    it('fails closed when ADMIN_EMAILS is unset', async () => {
        delete process.env.ADMIN_EMAILS
        mockAuth.mockResolvedValue({ user: { email: 'admin@example.com' } })
        expect(await isAdmin()).toBe(false)
    })
})
