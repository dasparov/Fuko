"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function PrivacyPage() {
    return (
        <main className="min-h-screen bg-white pb-20">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100">
                <div className="flex items-center px-4 h-14">
                    <Link href="/profile" className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-900" />
                    </Link>
                    <h1 className="ml-2 text-lg font-semibold text-gray-900">Privacy Policy</h1>
                </div>
            </header>

            <div className="max-w-2xl mx-auto p-6 space-y-6 text-gray-600 leading-relaxed">
                <p className="text-sm text-gray-500">Last updated: February 2026</p>

                <p className="font-medium text-gray-900">
                    Your privacy is important to us. It is Fuko&apos;s policy to respect your privacy regarding any information we may collect from you across our website and mobile application.
                </p>

                <section>
                    <h2 className="text-gray-900 font-bold text-lg mb-2">1. Information We Collect</h2>
                    <p className="mb-2">
                        We collect information you provide directly to us. For example, we collect information when you create an account, subscribe, participate in any interactive features of our services, fill out a form, request customer support or otherwise communicate with us.
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Name and Contact Information</li>
                        <li>Payment Information (via secure payment gateways)</li>
                        <li>Usage Data and Device Information</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-gray-900 font-bold text-lg mb-2">2. How We Use Information</h2>
                    <p>
                        We use the information we collect in various ways, including to:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                        <li>Provide, operate, and maintain our website/app</li>
                        <li>Improve, personalize, and expand our website/app</li>
                        <li>Understand and analyze how you use our website/app</li>
                        <li>Develop new products, services, features, and functionality</li>
                        <li>Process your transactions and manage your orders</li>
                        <li>Send you emails/notifications regarding updates or marketing (opt-out available)</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-gray-900 font-bold text-lg mb-2">3. Data Security</h2>
                    <p>
                        We value your trust in providing us your Personal Information, thus we are striving to use commercially acceptable means of protecting it. But remember that no method of transmission over the internet, or method of electronic storage is 100% secure and reliable, and we cannot guarantee its absolute security.
                    </p>
                </section>

                <section>
                    <h2 className="text-gray-900 font-bold text-lg mb-2">4. Third-Party Services</h2>
                    <p>
                        We may employ third-party companies and individuals due to the following reasons:
                        To facilitate our Service; To provide the Service on our behalf; To perform Service-related services; or To assist us in analyzing how our Service is used.
                        We want to inform users of this Service that these third parties have access to your Personal Information. The reason is to perform the tasks assigned to them on our behalf. However, they are obligated not to disclose or use the information for any other purpose.
                    </p>
                </section>

                <section>
                    <h2 className="text-gray-900 font-bold text-lg mb-2">5. Cookies</h2>
                    <p>
                        Cookies are files with a small amount of data that are commonly used as anonymous unique identifiers. These are sent to your browser from the website that you visit and are stored on your computer&apos;s hard drive.
                        Our website uses these &quot;cookies&quot; to collection information and to improve our Service. You have the option to either accept or refuse these cookies.
                    </p>
                </section>

                <div className="pt-8 border-t border-gray-100">
                    <p className="text-xs text-gray-400">
                        If you have any questions about this Privacy Policy, please contact us at support@fuko.in
                    </p>
                </div>
            </div>
        </main>
    )
}
