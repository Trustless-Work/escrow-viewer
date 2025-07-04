import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Suspense } from 'react'
import { NetworkProvider } from "@/contexts/NetworkContext";


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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        {...customBodyProps}
      >
        <Suspense fallback={<div>Loading...</div>}>
          <NetworkProvider>
            {children}
          </NetworkProvider>
        </Suspense>
      </body>
    </html>
  )
}
