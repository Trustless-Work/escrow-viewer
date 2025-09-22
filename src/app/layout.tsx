// src/app/layout.tsx (top)

import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Suspense } from 'react'
import { NetworkProvider } from "@/contexts/NetworkContext";
import { AppProviders } from "./providers";


const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-display" });
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Prevent hydration errors from extensions - adding attributes to the body
export const metadata: Metadata = {
  metadataBase: new URL('https://localhost:3000'),
  title: 'Escrow Data Viewer',
  description: 'View detailed information about escrow contracts on the Stellar blockchain.',
}

// Suppress hydration warnings in development
const customBodyProps = process.env.NODE_ENV === 'development' 
  ? { suppressHydrationWarning: true } 
  : {}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body
        className={`${playfair.variable} ${geistSans.variable} ${geistMono.variable} antialiased bg-lux-bg text-lux-text`}
        {...customBodyProps}
      >
        <Suspense fallback={<div>Loading...</div>}>
        <AppProviders>
          <NetworkProvider>
            {children}
          </NetworkProvider>
          </AppProviders>
        </Suspense>
      </body>
    </html>
  )
}
