"use client";

import { Inter } from "next/font/google";
import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { NavbarSimple } from "@/components/Navbar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SearchCard } from "@/components/escrow/search-card";
import { ErrorDisplay } from "@/components/escrow/error-display";
import { EXAMPLE_CONTRACT_IDS } from "@/lib/escrow-constants";
import type { NextPage } from "next";
import { useRouter } from "next/navigation";
import { useNetwork } from "@/contexts/NetworkContext";


const inter = Inter({ subsets: ["latin"] });

const Home: NextPage = () => {
  const router = useRouter();
  const { currentNetwork } = useNetwork();
  const [contractId, setContractId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);

  // Responsive: detect mobile for SearchCard behaviour

  const handleNavigate = async () => {
    if (!contractId) {
      setError("Please enter a contract ID");
      return;
    }
    setError(null);
    router.push(`/${contractId}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleNavigate();
  };

  const handleUseExample = () => {
    setContractId(EXAMPLE_CONTRACT_IDS[currentNetwork]);
  };

  return (
    <TooltipProvider>
      <div className={`min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 ${inter.className}`}>
        <NavbarSimple />

        <main className="container mx-auto px-4 py-12">
          {/* HERO */}
          <div className="relative">
            <div className="relative bg-white/95 dark:bg-card rounded-3xl p-8 md:p-12 shadow-2xl border border-gray-200/60 dark:border-[rgba(255,255,255,0.04)]">
              <section className="flex flex-col-reverse md:flex-row items-center gap-8 md:gap-16">

            {/* Left: text */}
            <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
              <motion.h1
                className="text-4xl md:text-5xl font-extrabold text-foreground leading-tight"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                Escrow Data <span className="text-primary">Viewer</span>
              </motion.h1>

              <motion.p
                className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.5 }}
              >
                View detailed information about any escrow contract on the Stellar blockchain.
              </motion.p>

              <div className="mt-6 w-full max-w-lg">
                {/* Keep the existing search card for discoverability */}
                <SearchCard
                  contractId={contractId}
                  setContractId={setContractId}
                  loading={false}
                  isSearchFocused={isSearchFocused}
                  setIsSearchFocused={setIsSearchFocused}
                  handleKeyDown={handleKeyDown}
                  fetchEscrowData={handleNavigate}
                  handleUseExample={handleUseExample}
                />

                <ErrorDisplay error={error} />
              </div>
            </div>

            {/* Right: image (flexes) */}
            <motion.div
              className="flex-1 flex justify-center md:justify-end"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <div className="w-full max-w-md md:max-w-xl flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="Escrow Viewer illustration"
                  width={420}
                  height={240}
                  className="w-full h-auto object-contain drop-shadow-lg"
                  priority
                />
              </div>
            </motion.div>
          </section>
            </div>
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
};

export default Home;
