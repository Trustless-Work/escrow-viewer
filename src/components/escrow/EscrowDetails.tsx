/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Inter } from "next/font/google";
import { useState, useEffect, useCallback } from "react";
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
import { EXAMPLE_CONTRACT_IDS } from "@/lib/escrow-constants";
import { useRouter } from "next/navigation";
import { useNetwork } from "@/contexts/NetworkContext";
import { NetworkToggle } from "@/components/shared/network-toggle";

import { Header } from "@/components/escrow/header";
import { SearchCard } from "@/components/escrow/search-card";
import { ErrorDisplay } from "@/components/escrow/error-display";
import { EscrowContent } from "@/components/escrow/escrow-content";

const inter = Inter({ subsets: ["latin"] });

interface EscrowDetailsClientProps {
  initialEscrowId: string;
}

const EscrowDetailsClient: React.FC<EscrowDetailsClientProps> = ({
  initialEscrowId,
}) => {
  const router = useRouter();
  const { currentNetwork } = useNetwork();
  const [contractId, setContractId] = useState<string>(initialEscrowId);
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

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const fetchEscrowData = useCallback(
    async (id: string) => {
      if (!id) {
        setError("Please enter a contract ID");
        setEscrowData(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await getLedgerKeyContractCode(id, currentNetwork);
        setEscrowData(data);
        // Only navigate if the ID differs from the current URL
        if (id !== initialEscrowId) {
          router.push(`/${id}`);
        }
      } catch (err: any) {
        setEscrowData(null);
        setError(err.message || "Failed to fetch escrow data");
      } finally {
        setLoading(false);
      }
    },
    [router, initialEscrowId, currentNetwork]
  );

  // Fetch initial escrow data
  useEffect(() => {
    if (initialEscrowId) {
      fetchEscrowData(initialEscrowId);
    }
  }, [initialEscrowId, fetchEscrowData]);

  // Refetch data when network changes
  useEffect(() => {
    if (initialEscrowId) {
      fetchEscrowData(initialEscrowId);
    }
  }, [currentNetwork, fetchEscrowData]);

  // Handle enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      fetchEscrowData(contractId);
    }
  };

  // Use example contract ID
  const handleUseExample = () => {
    setContractId(EXAMPLE_CONTRACT_IDS[currentNetwork]);
  };

  // Handle fetch button click
  const handleFetch = async () => {
    if (contractId === initialEscrowId && escrowData) {
      return;
    }
    await fetchEscrowData(contractId);
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
          <div className="flex justify-between items-center mb-6">
            <Header />
            <NetworkToggle />
          </div>

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
            fetchEscrowData={handleFetch}
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

export default EscrowDetailsClient;
