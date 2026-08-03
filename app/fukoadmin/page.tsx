import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/admin'
import AdminDashboard from './AdminDashboard'

export default async function AdminPage() {
    // Carry the destination through the login round-trip, otherwise signing in
    // lands on the homepage and the only way back is typing the URL again.
    if (!(await isAdmin())) redirect('/login?callbackUrl=/fukoadmin')
    return <AdminDashboard />
}
