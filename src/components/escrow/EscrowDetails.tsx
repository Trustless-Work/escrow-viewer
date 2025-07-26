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

  // Transaction-related state
  const [transactions, setTransactions] = useState<TransactionMetadata[]>([]);
  const [transactionLoading, setTransactionLoading] = useState<boolean>(false);
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [transactionResponse, setTransactionResponse] = useState<TransactionResponse | null>(null);
  const [selectedTxHash, setSelectedTxHash] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

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
          // Append to existing transactions for pagination
          setTransactions(prev => [...prev, ...response.transactions]);
        } else {
          // Replace transactions for fresh fetch
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
        
        // Fetch transactions for this contract
        fetchTransactionData(id);
      } catch (err: any) {
        setEscrowData(null);
        setError(err.message || "Failed to fetch escrow data");
      } finally {
        setLoading(false);
      }
    },

    [router, initialEscrowId, fetchTransactionData]
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

  // Handle transaction row click
  const handleTransactionClick = (txHash: string) => {
    setSelectedTxHash(txHash);
    setIsModalOpen(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedTxHash(null);
  };

  // Handle load more transactions
  const handleLoadMoreTransactions = () => {
    if (transactionResponse?.cursor && contractId) {
      fetchTransactionData(contractId, transactionResponse.cursor);
    }
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

        <main className="container mx-auto px-4 py-6 md:py-10 max-w-7xl">
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

          {/* Transaction History Section */}
          {escrowData && (
            <motion.div
              className="mt-12"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              {/* Transaction Section Header */}
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
                        {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
                      </motion.div>
                    </motion.div>
                  )}
                </div>
                
                {/* Enhanced Divider with gradient animation */}
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

              {/* Transaction Table Container */}
              <motion.div 
                className="relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.5 }}
              >
                {/* Floating background decoration with subtle animation */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/30 rounded-3xl -z-10"
                  animate={{ 
                    backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"] 
                  }}
                  transition={{ 
                    duration: 25, 
                    repeat: Infinity, 
                    ease: "linear" 
                  }}
                />
                
                {/* Transaction Table with enhanced modern styling */}
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
