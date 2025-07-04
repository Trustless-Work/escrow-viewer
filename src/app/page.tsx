"use client";

import { Inter } from "next/font/google";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { NavbarSimple } from "@/components/Navbar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LoadingLogo } from "@/components/shared/loading-logo";
import { EXAMPLE_CONTRACT_IDS } from "@/lib/escrow-constants";
import type { NextPage } from "next";
import { useRouter } from "next/navigation";
import { useNetwork } from "@/contexts/NetworkContext";
import { NetworkToggle } from "@/components/shared/network-toggle";

import { Header } from "@/components/escrow/header";
import { SearchCard } from "@/components/escrow/search-card";
import { ErrorDisplay } from "@/components/escrow/error-display";

const inter = Inter({ subsets: ["latin"] });

const Home: NextPage = () => {
  const router = useRouter();
  const { currentNetwork } = useNetwork();
  const [contractId, setContractId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);

  // Check if viewport is mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleNavigate = async () => {
    if (!contractId) {
      setError("Please enter a contract ID");
      return;
    }
    setError(null);
    router.push(`/${contractId}`);
  };

  // Handle enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleNavigate();
    }
  };

  // Use example contract ID
  const handleUseExample = () => {
    setContractId(EXAMPLE_CONTRACT_IDS[currentNetwork]);
  };

  return (
    <TooltipProvider>
      <div
        className={`min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 ${inter.className}`}
      >
        <NavbarSimple />

        <main className="container mx-auto px-4 py-6 md:py-10">
          {/* Header Section */}
          <div className="flex 
          justify-between items-center mb-6 ">
            <Header />
           
          </div>

          {/* Logo display */}
          <motion.div
            className="flex justify-center mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <LoadingLogo loading={false} />
          </motion.div>

          {/* Search Card */}
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

          {/* Error Display */}
          <ErrorDisplay error={error} />
        </main>
      </div>
    </TooltipProvider>
  );
};

export default Home;
