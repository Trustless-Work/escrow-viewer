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
    <div className={`flex items-center justify-between bg-white rounded shadow-sm py-5 px-6 ${inter.className}`}>
      <div className="flex items-center gap-2">
        <Image src="/logo.png" alt="Trustless work logo" width={27} height={10} priority />
        <h1 className="text-base font-bold">Trustless Work</h1>
      </div>
      <WalletButton />
   </div>
  )
}
