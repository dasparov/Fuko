import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import { MobileNav } from "@/components/layout/MobileNav";
import "./globals.css";

const headingFont = Bricolage_Grotesque({
  variable: "--font-heading",
  subsets: ["latin"],
});

const bodyFont = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fuko | Premium RYO Blends",
  description: "Organic, hand-crafted rolling tobacco blends.",
};

import { CartProvider } from "@/context/CartContext";
import { AgeGate } from "@/components/ui/AgeGate";
import { AnnouncementBanner } from "@/components/layout/AnnouncementBanner";

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
        <CartProvider>
          <AgeGate />
          <AnnouncementBanner />
          {children}
          <MobileNav />
        </CartProvider>
      </body>
    </html>
  );
}
