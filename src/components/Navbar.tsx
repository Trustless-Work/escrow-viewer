"use client";

import { Inter } from "next/font/google";
import Image from "next/image";
import React from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NetworkToggle } from "@/components/shared/network-toggle";

const inter = Inter({ subsets: ["latin"] });

export function NavbarSimple() {
  return (
    <header
      className={`flex items-center justify-between gap-4 rounded shadow-sm py-4 px-6 md:px-28 ${inter.className}`}
    >
      <div className="flex items-center gap-3">
        <Image
          src="/logo.png"
          alt="Trustless work logo"
          width={27}
          height={10}
          priority
        />
        <h1 className="text-base font-bold">Trustless Work</h1>
      </div>

      <div className="flex items-center gap-3">
        <NetworkToggle />
        <ThemeToggle />
      </div>
    </header>
  );
}
