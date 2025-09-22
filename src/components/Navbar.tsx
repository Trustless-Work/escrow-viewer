"use client"

import { Inter } from "next/font/google";
import Image from "next/image";
import React from "react";
import dynamic from "next/dynamic";

const inter = Inter({ subsets: ["latin"] });

const WalletButton = dynamic(
  () =>
    import("@/components/tw-blocks/wallet-kit/WalletButtons").then(
      (m) => m.WalletButton
    ),
  { ssr: false }
);


export function NavbarSimple() {
  return (
    <div
      className={`sticky top-0 z-40 border-b border-[var(--lux-line)] bg-[var(--lux-bg)]/80 backdrop-blur ${inter.className}`}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Trustless Work"
            width={28}
            height={28}
            priority
          />
          <span className="font-[var(--font-display)] text-lg tracking-tight text-[var(--lux-text)]">
            Trustless Work
          </span>
        </div>
        <WalletButton />
      </div>
    </div>
  )
}
