import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import { MobileNav } from "@/components/layout/MobileNav";
import { DesktopNav } from "@/components/layout/DesktopNav";
import "./globals.css";

const headingFont = Bricolage_Grotesque({
  variable: "--font-heading",
  subsets: ["latin"],
});

const bodyFont = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

// metadataBase makes og:image absolute — WhatsApp and every other scraper
// ignore a relative image URL, so without this the preview stays blank.
// The card itself is app/opengraph-image.jpg: Next's file convention emits
// og:image with its dimensions and type, so there is nothing to declare here.
export const metadata: Metadata = {
  metadataBase: new URL("https://okfuko.shop"),
  title: "Fuko | Premium RYO Blends",
  description: "Organic, hand-crafted rolling tobacco blends.",
  openGraph: {
    type: "website",
    siteName: "Fuko",
    url: "https://okfuko.shop",
    title: "Fuko | Premium RYO Blends",
    description: "Organic, hand-crafted rolling tobacco blends.",
  },
};

import { CartProvider } from "@/context/CartContext";
import { AgeGate } from "@/components/ui/AgeGate";
import { AnnouncementBanner } from "@/components/layout/AnnouncementBanner";
import { Providers } from "./providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning={true}
        className={`${headingFont.variable} ${bodyFont.variable} antialiased pb-20`}
      >
        <Providers>
          <CartProvider>
            <AgeGate />
            <AnnouncementBanner />
            {children}
            <MobileNav />
            <DesktopNav />
          </CartProvider>
        </Providers>
      </body>
    </html>
  );
}
