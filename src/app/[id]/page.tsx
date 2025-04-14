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
import { useRouter, usePathname } from "next/navigation";
import { Header } from "@/components/escrow/header";
import { SearchCard } from "@/components/escrow/search-card";
import { ErrorDisplay } from "@/components/escrow/error-display";
import { EscrowContent } from "@/components/escrow/escrow-content";
const inter = Inter({ subsets: ["latin"] });

export default function ContractPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [contractId, setContractId] = useState<string>("");
  const [escrowData, setEscrowData] = useState<EscrowMap | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);

  // Check for contractId in URL on initial load
  useEffect(() => {
    if (pathname) {
      setContractId(pathname.split("/").pop() || "");
      fetchEscrowData(pathname.split("/").pop() || "");
    }
  }, [pathname]);

  // Mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchEscrowData = async (id?: string) => {
    const targetId = id || contractId;
    if (!targetId) {
      setError("Please enter a contract ID");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getLedgerKeyContractCode(targetId);
      setEscrowData(data);
      router.push(`/${targetId}`);
    } catch (err: any) {
      setError(err.message || "Failed to fetch escrow data");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      fetchEscrowData();
    }
  };

  const handleUseExample = () => {
    setContractId(EXAMPLE_CONTRACT_ID);
    fetchEscrowData(EXAMPLE_CONTRACT_ID);
  };

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
          <Header />

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

          <SearchCard
            contractId={contractId}
            setContractId={setContractId}
            loading={loading}
            isSearchFocused={isSearchFocused}
            setIsSearchFocused={setIsSearchFocused}
            handleKeyDown={handleKeyDown}
            fetchEscrowData={() => fetchEscrowData()}
            handleUseExample={handleUseExample}
          />

          <ErrorDisplay error={error} />

          <EscrowContent
            loading={loading}
            organized={organized}
            isMobile={isMobile}
          />
        </main>
      </div>
    </TooltipProvider>
  );
}
