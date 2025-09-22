"use client";

import { Inter } from "next/font/google";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { NavbarSimple } from "@/components/Navbar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LoadingLogo } from "@/components/shared/loading-logo";
import { EXAMPLE_CONTRACT_IDS } from "@/lib/escrow-constants";
import { useRouter } from "next/navigation";
import { useNetwork } from "@/contexts/NetworkContext";
import { Header } from "@/components/escrow/header";
import { SearchCard } from "@/components/escrow/search-card";
import { ErrorDisplay } from "@/components/escrow/error-display";
import { EscrowContent } from "@/components/escrow/escrow-content";
import { LedgerBalancePanel } from "@/components/escrow/LedgerBalancePanel";
import { useEscrowContext } from "@/components/tw-blocks/providers/EscrowProvider";
import { useRef } from "react";

// ⬇️ New hooks
import { useEscrowData } from "@/hooks/useEscrowData";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useMemo } from "react"; // make sure this is imported
import { FundEscrowDialog } from "@/components/tw-blocks/escrows/single-multi-release/fund-escrow/dialog/FundEscrow";

const inter = Inter({ subsets: ["latin"] });

const EscrowDetailsClient: React.FC = () => {
const params = useParams<{ id: string }>();
const initialEscrowId = params?.id as string;
  const router = useRouter();
  const { currentNetwork } = useNetwork();
const { setSelectedEscrowId } = useEscrowContext();
const lastPushedIdRef = useRef<string | null>(null);
  // Input / responsive state
  const [contractId, setContractId] = useState<string>(initialEscrowId);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);

  // Escrow data hook (raw + organized)
  const { raw, organized, loading, error, refresh } = useEscrowData(
    contractId,
    currentNetwork,
    isMobile
  );

  // Live token balance hook
  const { ledgerBalance, decimals, mismatch } = useTokenBalance(
    contractId,
    raw,
    currentNetwork
  );

  const organizedWithLive = useMemo(() => {
  if (!organized) return null;
  if (!ledgerBalance) return organized; // nothing to override
  return {
    ...organized,
    properties: {
      ...organized.properties,
      balance: ledgerBalance, // <- replace storage balance with live one
    },
  };
}, [organized, ledgerBalance]);



  // Check if viewport is mobile
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

// Initial + network-change fetch (escrow + txs) + push id into Blocks context once per id
  useEffect(() => {
    if (!contractId) return;
      if (lastPushedIdRef.current !== contractId) {
        setSelectedEscrowId(contractId);
        lastPushedIdRef.current = contractId;
 }
    // eslint-disable-next-line react-hooks/exhaustive-deps

}, [contractId, currentNetwork, setSelectedEscrowId]);

  // Enter key in search
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      // If same contractId, force refresh; if different we also push new URL
      if (contractId !== initialEscrowId) {
        router.push(`/${contractId}`);
      }
      void refresh();    }
  };

  // Example ID
  const handleUseExample = () => {
    const id = EXAMPLE_CONTRACT_IDS[currentNetwork];
    setContractId(id);
    router.push(`/${id}`);
    // hook will refresh automatically on state change; txs too via effect
  };

  // Fetch button click
  const handleFetch = async () => {
    if (!contractId) return;
    if (contractId !== initialEscrowId) {
      router.push(`/${contractId}`);
    }
    await refresh();
  };


useEffect(() => {
  if (process.env.NODE_ENV === "production") return;
  console.log("[DBG][EscrowDetails] network:", currentNetwork);
  console.log("[DBG][EscrowDetails] contractId:", contractId);
}, [currentNetwork, contractId]);

useEffect(() => {
  if (process.env.NODE_ENV === "production") return;
  console.log("[DBG][EscrowDetails] raw escrow map:", raw);
}, [raw]);

useEffect(() => {
  if (process.env.NODE_ENV === "production") return;
  console.log("[DBG][EscrowDetails] organized data:", organized);
}, [organized]);

useEffect(() => {
  if (process.env.NODE_ENV === "production") return;
  console.log("[DBG][EscrowDetails] token live balance:", {
    ledgerBalance,
    decimals,
    mismatch,
  });
}, [ledgerBalance, decimals, mismatch]);


  return (
    <TooltipProvider>
      <div className={`min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 ${inter.className}`}>
        <NavbarSimple />

        <main className="container mx-auto px-4 py-6 md:py-10 max-w-7xl">
          {/* Header Section */}
          <Header />
          {/* Logo display (only on initial screen) */}
          {!raw && !loading && !error && (
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
          <EscrowContent loading={loading} organized={organizedWithLive} isMobile={isMobile} />

{/* Actions */}
  <section className="mt-10 rounded-xl border p-4 bg-white">
    <h2 className="text-lg font-semibold mb-3">Actions</h2>
    <FundEscrowDialog />
    {/*
      If you ever want a one-click fixed amount:
      import { FundEscrowButton } from ".../FundEscrow";
      <FundEscrowButton amount={100} />
    */}
  </section>

          {/* Live ledger balance (from token contract) */}
          {raw && ledgerBalance && (
            <LedgerBalancePanel balance={ledgerBalance} decimals={decimals} mismatch={mismatch} />
          )}

        </main>
      </div>
    </TooltipProvider>
  );
};

export default EscrowDetailsClient;
