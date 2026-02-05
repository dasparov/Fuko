"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function TermsPage() {
    return (
        <main className="min-h-screen bg-white pb-20">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100">
                <div className="flex items-center px-4 h-14">
                    <Link href="/profile" className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-900" />
                    </Link>
                    <h1 className="ml-2 text-lg font-semibold text-gray-900">Terms of Service</h1>
                </div>
            </header>

            <div className="max-w-2xl mx-auto p-6 space-y-6 text-gray-600 leading-relaxed">
                <p className="text-sm text-gray-500">Last updated: February 2026</p>

                <section>
                    <h2 className="text-gray-900 font-bold text-lg mb-2">1. Acceptance of Terms</h2>
                    <p>
                        By accessing and using Fuko&apos;s mobile application and website, you accept and agree to be bound by the terms and provision of this agreement.
                    </p>
                </section>

                <section>
                    <h2 className="text-gray-900 font-bold text-lg mb-2">2. Use of Service</h2>
                    <p>
                        You agree to use our service for lawful purposes only. You must not use our service to transmit any unsolicited or unauthorized advertising, promotional materials, or spam.
                        We reserve the right to terminate or suspend access to our service immediately, without prior notice or liability, for any reason whatsoever.
                    </p>
                </section>

                <section>
                    <h2 className="text-gray-900 font-bold text-lg mb-2">3. Products and Pricing</h2>
                    <p>
                        All products listed on the app are subject to availability. We reserve the right to discontinue any product at any time. Prices for our products are subject to change without notice.
                        We shall not be liable to you or to any third-party for any modification, price change, suspension or discontinuance of the Service.
                    </p>
                </section>

                <section>
                    <h2 className="text-gray-900 font-bold text-lg mb-2">4. Orders and Payments</h2>
                    <p>
                        We reserve the right to refuse any order you place with us. We may, in our sole discretion, limit or cancel quantities purchased per person, per household or per order.
                        In the event that we make a change to or cancel an order, we will attempt to notify you by contacting the e-mail and/or phone number provided at the time the order was made.
                    </p>
                </section>

                <section>
                    <h2 className="text-gray-900 font-bold text-lg mb-2">5. Returns and Refunds</h2>
                    <p>
                        Our policy lasts 7 days. If 7 days have gone by since your purchase, unfortunately we can’t offer you a refund or exchange.
                        To be eligible for a return, your item must be unused and in the same condition that you received it. It must also be in the original packaging.
                    </p>
                </section>

                <section>
                    <h2 className="text-gray-900 font-bold text-lg mb-2">6. Limitation of Liability</h2>
                    <p>
                        In no case shall Fuko, our directors, officers, employees, affiliates, agents, contractors, interns, suppliers, service providers or licensors be liable for any injury, loss, claim, or any direct, indirect, incidental, punitive, special, or consequential damages of any kind.
                    </p>
                </section>

                <div className="pt-8 border-t border-gray-100">
                    <p className="text-xs text-gray-400">
                        If you have any questions about these Terms, please contact us at support@okfuko.shop
                    </p>
                </div>
            </div>
        </main>
    )
}
