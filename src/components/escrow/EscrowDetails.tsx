/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Inter } from "next/font/google";
import { useState, useEffect, useCallback } from "react";
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
import { TransactionTable } from "@/components/escrow/TransactionTable";
import { TransactionDetailModal } from "@/components/escrow/TransactionDetailModal";
import {
  fetchTransactions,
  type TransactionMetadata,
  type TransactionResponse,
} from "@/utils/transactionFetcher";
import { LedgerBalancePanel } from "@/components/escrow/LedgerBalancePanel";
import { useEscrowContext } from "@/components/tw-blocks/providers/EscrowProvider";
import { useRef } from "react";

// ⬇️ New hooks
import { useEscrowData } from "@/hooks/useEscrowData";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useMemo } from "react"; // make sure this is imported
import { FundEscrowDialog } from "@/components/tw-blocks/escrows/single-multi-release/fund-escrow/dialog/FundEscrow";

const inter = Inter({ subsets: ["latin"] });

interface EscrowDetailsClientProps {
  initialEscrowId: string;
}

const EscrowDetailsClient: React.FC<EscrowDetailsClientProps> = ({
  initialEscrowId,
}) => {
  const router = useRouter();
  const { currentNetwork } = useNetwork();
  const { setSelectedEscrowId, setSelectedEscrow } = (useEscrowContext?.() as any) || {};
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


  // Transaction-related state (kept here for now)
  const [transactions, setTransactions] = useState<TransactionMetadata[]>([]);
  const [transactionLoading, setTransactionLoading] = useState<boolean>(false);
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [transactionResponse, setTransactionResponse] = useState<TransactionResponse | null>(null);
  const [selectedTxHash, setSelectedTxHash] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Check if viewport is mobile
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch transaction data
  const fetchTransactionData = useCallback(
    async (id: string, cursor?: string) => {
      if (!id) return;
      setTransactionLoading(true);
      setTransactionError(null);
      try {
        const response = await fetchTransactions(id, { cursor, limit: 20 });
        setTransactionResponse(response);
        if (cursor) {
          setTransactions((prev) => [...prev, ...response.transactions]);
        } else {
          setTransactions(response.transactions);
        }
      } catch (err: any) {
        setTransactionError(err.message || "Failed to fetch transactions");
      } finally {
        setTransactionLoading(false);
      }
    },
    []
  );

// Initial + network-change fetch (escrow + txs) + push id into Blocks context once per id
  useEffect(() => {
    if (!contractId) return;
if (lastPushedIdRef.current !== contractId) {
    if (typeof setSelectedEscrowId === "function") {
   setSelectedEscrowId(contractId);
 } else if (typeof setSelectedEscrow === "function") {
     // fallback for builds without setSelectedEscrowId
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setSelectedEscrow({ contractId, type: "multi-release" } as any);

    }
    // and load txs
    lastPushedIdRef.current = contractId;
 }
}, [contractId, currentNetwork, fetchTransactionData]);

  // Enter key in search
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      // If same contractId, force refresh; if different we also push new URL
      if (contractId !== initialEscrowId) {
        router.push(`/${contractId}`);
      }
      void refresh();
      fetchTransactionData(contractId);
    }
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
    fetchTransactionData(contractId);
  };

  // Transactions UI handlers
  const handleTransactionClick = (txHash: string) => {
    setSelectedTxHash(txHash);
    setIsModalOpen(true);
  };
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedTxHash(null);
  };
  const handleLoadMoreTransactions = () => {
    if (transactionResponse?.cursor && contractId) {
      fetchTransactionData(contractId, transactionResponse.cursor);
    }
  };

// === DEBUG LOGGING (EscrowDetails) ===
const DEBUG = true;

useEffect(() => {
  if (!DEBUG) return;
  console.log("[DBG][EscrowDetails] network:", currentNetwork);
  console.log("[DBG][EscrowDetails] contractId:", contractId);
}, [currentNetwork, contractId]);

useEffect(() => {
  if (!DEBUG) return;
  console.log("[DBG][EscrowDetails] raw escrow map:", raw);
}, [raw]);

useEffect(() => {
  if (!DEBUG) return;
  console.log("[DBG][EscrowDetails] organized data:", organized);
}, [organized]);

useEffect(() => {
  if (!DEBUG) return;
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

          {/* Transaction History Section */}
          {raw && (
            <motion.div
              className="mt-12"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              {/* Section header */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <motion.div
                    className="flex items-center gap-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                  >
                    <motion.div
                      className="w-3 h-12 bg-gradient-to-b from-blue-500 via-purple-500 to-blue-600 rounded-full"
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ delay: 0.5, duration: 0.6 }}
                    />
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                        Transaction History
                      </h2>
                      <p className="text-sm text-gray-600 mt-2">
                        Complete blockchain activity record for this escrow contract
                      </p>
                    </div>
                  </motion.div>
                  {transactions.length > 0 && (
                    <motion.div
                      className="hidden md:flex items-center gap-3"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6, duration: 0.3 }}
                    >
                      <motion.div
                        className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 px-4 py-2 rounded-full font-semibold border border-blue-200/50"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.2 }}
                      >
                        {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
                      </motion.div>
                    </motion.div>
                  )}
                </div>

                {/* Divider */}
                <motion.div
                  className="relative"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                >
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t-2 border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <div className="bg-gradient-to-b from-gray-50 to-blue-50 px-6">
                      <motion.div
                        className="w-16 h-2 bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: "4rem" }}
                        transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Table */}
              <motion.div
                className="relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.5 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/30 rounded-3xl -z-10"
                  animate={{ backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"] }}
                  transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                />
                <div className="relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200/60 overflow-hidden hover:shadow-3xl transition-all duration-700">
                  <TransactionTable
                    transactions={transactions}
                    loading={transactionLoading}
                    error={transactionError}
                    retentionNotice={transactionResponse?.retentionNotice}
                    hasMore={transactionResponse?.hasMore || false}
                    onLoadMore={handleLoadMoreTransactions}
                    onTransactionClick={handleTransactionClick}
                    isMobile={isMobile}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Transaction Detail Modal */}
          <TransactionDetailModal
            txHash={selectedTxHash}
            isOpen={isModalOpen}
            onClose={handleModalClose}
            isMobile={isMobile}
          />
        </main>
      </div>
    </TooltipProvider>
  );
};

export default EscrowDetailsClient;
