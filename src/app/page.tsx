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
import { getNetworkConfig } from "@/lib/network-config";

const inter = Inter({ subsets: ["latin"] });

const Home: NextPage = () => {
  const router = useRouter();
  const { currentNetwork, setNetwork } = useNetwork();
  const [contractId, setContractId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);

  // Network switching for error recovery
  const otherNetwork = currentNetwork === 'testnet' ? 'mainnet' : 'testnet';
  const switchNetworkLabel = `Try ${getNetworkConfig(otherNetwork).name}`;
  const handleSwitchNetwork = () => {
    setNetwork(otherNetwork);
    // Clear error when switching networks
    setError(null);
  };

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
      <div
        className={`min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 dark:from-background dark:to-background ${inter.className}`}
      >
        <NavbarSimple />

        <main className="w-full sm:w-7xl container mx-auto px-4 py-12">
          {/* HERO */}
          <div className="relative">
            <div className="relative bg-white/95 dark:bg-card rounded-3xl p-8 md:p-12 shadow-2xl border border-gray-200/60 dark:border-border">
              <section className="flex flex-col-reverse md:flex-row items-center gap-8 md:gap-16">
            </div>
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
};

export default Home;
