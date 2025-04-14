/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Inter } from "next/font/google";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { NavbarSimple } from "@/components/Navbar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LoadingLogo } from "@/components/shared/loading-logo";
import {
  getLedgerKeyContractCode,
  type EscrowMap,
} from "@/utils/ledgerkeycontract";
import {
  organizeEscrowData,
  type OrganizedEscrowData,
} from "@/utils/escrow-helpers";
import { EXAMPLE_CONTRACT_ID } from "@/lib/escrow-constants";
import type { NextPage } from "next";

import { Header } from "@/components/escrow/header";
import { SearchCard } from "@/components/escrow/search-card";
import { ErrorDisplay } from "@/components/escrow/error-display";
import { EscrowContent } from "@/components/escrow/escrow-content";
import { useRouter } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

const Home: NextPage = () => {
  const router = useRouter();
  const [contractId, setContractId] = useState<string>("");
  const [escrowData, setEscrowData] = useState<EscrowMap | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
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

  const fetchEscrowData = async () => {
    if (!contractId) {
      setError("Please enter a contract ID");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getLedgerKeyContractCode(contractId);
      setEscrowData(data);
      router.push(`/${contractId}`);
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    } catch (err: any) {
      setError(err.message || "Failed to fetch escrow data");
    } finally {
      setLoading(false);
    }
  };

  // Handle enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      fetchEscrowData();
    }
  };

  // Use example contract ID
  const handleUseExample = () => {
    setContractId(EXAMPLE_CONTRACT_ID);
  };

  // Organize data for display
  const organized: OrganizedEscrowData | null = organizeEscrowData(
    escrowData,
    contractId,
    isMobile
  );

  return (
    <TooltipProvider>
      <div
        className={`min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 ${inter.className}`}
      >
        <NavbarSimple />

        <main className="container mx-auto px-4 py-6 md:py-10">
          {/* Header Section */}
          <Header />

          {/* Logo display (only on initial screen) */}
          {!escrowData && !loading && !error && (
            <motion.div
              className="flex justify-center mb-8"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <LoadingLogo loading={false} />
            </motion.div>
          )}

          {/* Search Card */}
          <SearchCard
            contractId={contractId}
            setContractId={setContractId}
            loading={loading}
            isSearchFocused={isSearchFocused}
            setIsSearchFocused={setIsSearchFocused}
            handleKeyDown={handleKeyDown}
            fetchEscrowData={fetchEscrowData}
            handleUseExample={handleUseExample}
          />

          {/* Error Display */}
          <ErrorDisplay error={error} />

          {/* Content Section */}
          <EscrowContent
            loading={loading}
            organized={organized}
            isMobile={isMobile}
          />
        </main>
      </div>
    </TooltipProvider>
  );
};

export default Home;
