import { Inter } from "next/font/google";
import Image from "next/image";
import React from "react";

const inter = Inter({ subsets: ["latin"] });

export function NavbarSimple() {
  return (
    <div
      className={`flex gap-2 align-middle items-center bg-white rounded shadow-sm py-5 px-28 ${inter.className}`}
    >
      <Image
        src="/logo.png"
        alt="Trustless work logo"
        width={27}
        height={10}
        priority
      />
      <h1 className="text-base font-bold text-center">Trustless Work</h1>
    </div>
  );
}
