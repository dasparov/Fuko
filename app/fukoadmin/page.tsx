import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { isAdmin } from '@/lib/admin'
import AdminDashboard from './AdminDashboard'

export default async function AdminPage() {
    const session = await auth()

    // Signed out: carry the destination through the login round-trip, otherwise
    // signing in lands on the homepage and the only way back is typing the URL.
    if (!session?.user) redirect('/login?callbackUrl=/fukoadmin')

    // Signed in but not an admin: this must NOT bounce back to /login. That page
    // redirects any authenticated visitor straight to callbackUrl, so the two
    // would volley forever — the screen "flashing" on a machine signed in with a
    // non-admin Google account. Say which account it is instead; that is the
    // whole diagnosis.
    if (!(await isAdmin())) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
                <h1 className="font-heading text-2xl font-bold">Not an admin account</h1>
                <p className="text-muted">
                    Signed in as <span className="font-bold text-primary">{session.user.email}</span>.
                    That address isn&apos;t on the admin list.
                </p>
                <Link href="/profile" className="rounded-2xl bg-primary py-3 px-6 font-bold text-white">
                    Switch account
                </Link>
            </main>
        )
    }

    return <AdminDashboard />
}
