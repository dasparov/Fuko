"use client"

import Link from "next/link"
import { ArrowLeft, Mail, MapPin } from "lucide-react"

export default function SupportPage() {
    return (
        <main className="min-h-screen bg-neutral-50 pb-20">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="flex items-center px-4 h-14">
                    <Link href="/profile" className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-900" />
                    </Link>
                    <h1 className="ml-2 text-lg font-semibold text-gray-900">Help & Support</h1>
                </div>
            </header>

            <div className="p-6 max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* Intro */}
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-gray-900">How can we help?</h2>
                    <p className="text-gray-500">We&apos;re here to assist you with any questions.</p>
                </div>

                {/* Contact Cards */}
                <div className="grid gap-4">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
                        <div className="bg-blue-50 p-3 rounded-xl">
                            <Mail className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Email Us</h3>
                            <p className="text-sm text-gray-500 mt-1">For general inquiries and order support.</p>
                            <a href="mailto:support@okfuko.shop" className="text-blue-600 font-medium text-sm mt-2 inline-block hover:underline">
                                support@okfuko.shop
                            </a>
                        </div>
                    </div>
                </div>

                {/* FAQ Section (Placeholder) */}
                <div className="space-y-4">
                    <h3 className="font-bold text-gray-900 text-lg">Frequently Asked Questions</h3>

                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-100">
                            <h4 className="font-medium text-gray-900">Where is my order?</h4>
                            <p className="text-sm text-gray-500 mt-2">You can track your order status in the &quot;My Orders&quot; section of your profile.</p>
                        </div>
                        <div className="p-4 border-b border-gray-100">
                            <h4 className="font-medium text-gray-900">Do you offer refunds?</h4>
                            <p className="text-sm text-gray-500 mt-2">Yes, simply email us within 7 days of receiving your order if you face any quality issues.</p>
                        </div>
                        <div className="p-4">
                            <h4 className="font-medium text-gray-900">How long does shipping take?</h4>
                            <p className="text-sm text-gray-500 mt-2">Standard shipping usually takes 3-5 business days depending on your location.</p>
                        </div>
                    </div>
                </div>

                {/* Office Address */}
                <div className="flex items-start gap-3 text-sm text-gray-400 justify-center pt-8">
                    <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>
                        Goa Trading Co.<br />
                        PO BOX 13,<br />
                        Goa, India 403501
                    </p>
                </div>

            </div>
        </main>
    )
}
