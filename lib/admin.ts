import { auth } from '@/auth'

// Server-side admin check: session email must be in the ADMIN_EMAILS env
// (comma-separated). No env set = nobody is admin (fails closed).
export async function isAdmin(): Promise<boolean> {
    const session = await auth()
    const email = session?.user?.email?.toLowerCase()
    if (!email) return false
    const admins = (process.env.ADMIN_EMAILS || '')
        .split(',')
        .map(e => e.trim().toLowerCase())
        .filter(Boolean)
    return admins.includes(email)
}
