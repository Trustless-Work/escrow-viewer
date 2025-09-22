'use client';

import { NavbarSimple } from "@/components/Navbar";
import { Header } from "@/components/escrow/header";
import ContractIdLauncher from "@/components/investor/ContractIdLauncher";

export default function Page() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50">
      <NavbarSimple />
      <div className="container mx-auto max-w-5xl px-4 py-6 md:py-10">
        <Header />
        <section className="mt-8">
          <ContractIdLauncher />
        </section>
      </div>
    </main>
  );
}
