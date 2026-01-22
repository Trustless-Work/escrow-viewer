/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Inter } from "next/font/google";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
import { useIsMobile } from "@/hooks/useIsMobile";
import { ExportPdfButton } from "./ExportPdfButton";


// ⬇️ New hooks
import { useEscrowData } from "@/hooks/useEscrowData";
import { useTokenBalance } from "@/hooks/useTokenBalance";
// (useMemo is consolidated in the import above)


const inter = Inter({ subsets: ["latin"] });

interface EscrowDetailsClientProps {
  initialEscrowId: string;
}

const EscrowDetailsClient: React.FC<EscrowDetailsClientProps> = ({
  initialEscrowId,
}) => {
  const router = useRouter();
  const { currentNetwork } = useNetwork();

  // Input / responsive state
  const [contractId, setContractId] = useState<string>(initialEscrowId);
const isMobile = useIsMobile();
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
  const [showOnlyTransactions, setShowOnlyTransactions] = useState<boolean>(false);
  const txRef = useRef<HTMLDivElement | null>(null);


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

  // Initial + network-change fetch (escrow + txs)
  useEffect(() => {
    if (!contractId) return;
    // useEscrowData auto-refreshes on contractId change; just ensure txs loaded:
    fetchTransactionData(contractId);
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

  // When user toggles to show transactions, scroll the section into view
  useEffect(() => {
    if (showOnlyTransactions && txRef.current) {
      try {
        txRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      } catch  {
        // ignore scroll failures
      }
    }
  }, [showOnlyTransactions]);

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

          {/* Search Card + View Transactions button (flexed together) */}
          {!showOnlyTransactions && (
            <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
              <div className="flex-1 max-w-lg">
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
              </div>

              {raw && (
                <div className="w-full max-w-lg flex flex-col gap-2">
                  <button
                    onClick={() => setShowOnlyTransactions(true)}
                    aria-label="View Transaction History"
                    className="w-full inline-flex justify-center items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground shadow-sm hover:shadow-md transition cursor-pointer"
                  >
                    View Transaction History
                  </button>
                  {organizedWithLive && (
                    <ExportPdfButton
                      organized={organizedWithLive}
                      network={currentNetwork}
                      contractId={contractId}
                      initialEscrowId={initialEscrowId}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          <ErrorDisplay error={error} />

          {/* Content Section (hidden when showing transactions as a page) */}
          {!showOnlyTransactions && (
            <EscrowContent loading={loading} organized={organizedWithLive} isMobile={isMobile} />
          )}

          {/* Live ledger balance (from token contract) */}
          {!showOnlyTransactions && raw && ledgerBalance && (
            <LedgerBalancePanel balance={ledgerBalance} decimals={decimals} mismatch={mismatch} />
          )}

          {/* Transaction History Section (renders only when requested) */}
          {raw && showOnlyTransactions && (
            <motion.div
              ref={txRef}
              className="mt-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl md:text-3xl font-bold">Transaction History</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowOnlyTransactions(false)}
                    aria-label="Back to details"
                    className="px-3 py-2 rounded-md bg-primary/10 text-primary font-semibold border border-primary/20 hover:bg-primary/20 cursor-pointer text-sm"
                  >
                    Back to Details
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-[#6fbfe6]">Complete blockchain activity record for this escrow contract</p>
              </div>

              <div>
                <motion.div
                  className="relative"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05, duration: 0.4 }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/30 rounded-3xl -z-10"
                    animate={{ backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"] }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                  />
                    <div className="relative bg-white/95 dark:bg-[#070708] backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200/60 dark:border-[rgba(255,255,255,0.06)] dark:text-[#BFEFFD] overflow-hidden hover:shadow-3xl transition-all duration-700">
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
              </div>
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
