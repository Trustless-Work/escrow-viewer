/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Inter } from "next/font/google";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { NavbarSimple } from "@/components/Navbar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingLogo } from "@/components/shared/loading-logo";
import { EXAMPLE_CONTRACT_IDS } from "@/lib/escrow-constants";
import { getNetworkConfig } from "@/lib/network-config";
import { useRouter } from "next/navigation";
import { useNetwork } from "@/contexts/NetworkContext";

import { Header } from "@/components/escrow/header";
import { SearchCard } from "@/components/escrow/search-card";
import { ErrorDisplay } from "@/components/escrow/error-display";
import { EscrowContent } from "@/components/escrow/escrow-content";
import { TransactionTable } from "@/components/escrow/TransactionTable";
import { EventTable } from "@/components/escrow/EventTable";
import { TransactionDetailModal } from "@/components/escrow/TransactionDetailModal";
import { TransactionHistoryModal } from "@/components/escrow/TransactionHistoryModal";
import {
  fetchTransactions,
  fetchEvents,
  type TransactionMetadata,
  type TransactionResponse,
  type EventMetadata,
  type EventResponse,
} from "@/utils/transactionFetcher";
import { LedgerBalancePanel } from "@/components/escrow/LedgerBalancePanel";
import { useIsMobile } from "@/hooks/useIsMobile";


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

  // Network switching for error recovery
  const { setNetwork } = useNetwork();
  const otherNetwork = currentNetwork === 'testnet' ? 'mainnet' : 'testnet';
  const switchNetworkLabel = `Try ${getNetworkConfig(otherNetwork).name}`;
  const handleSwitchNetwork = () => {
    setNetwork(otherNetwork);
    router.push(`/${contractId}`);
    // The network change will trigger a re-fetch automatically
  };

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
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);

  // Event-related state
  const [events, setEvents] = useState<EventMetadata[]>([]);
  const [eventLoading, setEventLoading] = useState<boolean>(false);
  const [eventError, setEventError] = useState<string | null>(null);
  const [eventResponse, setEventResponse] = useState<EventResponse | null>(null);


  // Fetch transaction data
  const fetchTransactionData = useCallback(
    async (id: string, cursor?: string) => {
      if (!id) return;
      setTransactionLoading(true);
      setTransactionError(null);
      try {
        const response = await fetchTransactions(id, currentNetwork, { cursor, limit: 20 });
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
    [currentNetwork]
  );

  // Fetch event data
  const fetchEventData = useCallback(
    async (id: string, rpcUrl: string, cursor?: string) => {
      if (!id) return;

      // Basic validation for contract ID format
      if (!/^C[A-Z0-9]{55}$/.test(id)) {
        setEventError("Invalid contract ID format for event fetching.");
        return;
      }

      setEventLoading(true);
      setEventError(null);
      try {
        const response = await fetchEvents(id, rpcUrl, cursor, 20);
        setEventResponse(response);
        if (cursor) {
          setEvents((prev) => [...prev, ...response.events]);
        } else {
          setEvents(response.events);
        }
      } catch (err: any) {
        let errorMessage = "Failed to fetch contract events";

        if (err instanceof Error) {
          if (err.message.includes("startLedger must be within")) {
            errorMessage = "Unable to fetch recent events due to RPC retention limits.";
          } else if (err.message.includes("HTTP error")) {
            errorMessage = "Network error while fetching events. Please try again.";
          } else {
            errorMessage = err.message;
          }
        }

        setEventError(errorMessage);
      } finally {
        setEventLoading(false);
      }
    },
    []
  );

  // Initial + network-change fetch (escrow + txs + events)
  useEffect(() => {
    if (!contractId) return;
    // useEscrowData auto-refreshes on contractId change; just ensure txs and events loaded:
    fetchTransactionData(contractId);
    const { rpcUrl } = getNetworkConfig(currentNetwork);
    fetchEventData(contractId, rpcUrl);
  }, [contractId, currentNetwork, fetchTransactionData, fetchEventData]);

  // Enter key in search
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      // If same contractId, force refresh; if different we also push new URL
      if (contractId !== initialEscrowId) {
        router.push(`/${contractId}`);
      }
      void refresh();
      fetchTransactionData(contractId);
      const { rpcUrl } = getNetworkConfig(currentNetwork);
      fetchEventData(contractId, rpcUrl);
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
    if (contractId !== initialEscrowId) {
      router.push(`/${contractId}`);
    }
    await refresh();
    fetchTransactionData(contractId);
    const { rpcUrl } = getNetworkConfig(currentNetwork);
    fetchEventData(contractId, rpcUrl);
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

  const handleLoadMoreEvents = () => {
    if (eventResponse?.cursor && contractId) {
      const { rpcUrl } = getNetworkConfig(currentNetwork);
      fetchEventData(contractId, rpcUrl, eventResponse.cursor);
    }
  };


// === DEBUG LOGGING (EscrowDetails) ===
const DEBUG = true;

useEffect(() => {
  if (!DEBUG) return;
  console.log("[DBG][EscrowDetails] network:", currentNetwork);
  console.log("[DBG][EscrowDetails] contractId:", contractId);
}, [currentNetwork, contractId, DEBUG]);

useEffect(() => {
  if (!DEBUG) return;
  console.log("[DBG][EscrowDetails] raw escrow map:", raw);
}, [raw, DEBUG]);

useEffect(() => {
  if (!DEBUG) return;
  console.log("[DBG][EscrowDetails] organized data:", organized);
}, [organized, DEBUG]);

useEffect(() => {
  if (!DEBUG) return;
  console.log("[DBG][EscrowDetails] token live balance:", {
    ledgerBalance,
    decimals,
    mismatch,
  });
}, [ledgerBalance, decimals, mismatch, DEBUG]);


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
              <div className="w-full max-w-lg">
                <button
                  onClick={() => setIsHistoryModalOpen(true)}
                  aria-label="View Transaction History"
                  className="w-full inline-flex justify-center items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground shadow-sm hover:shadow-md transition cursor-pointer"
                >
                  View Transaction History
                </button>
              </div>
            )}
          </div>

          {/* Error Display */}
          <ErrorDisplay
            error={error}
            onSwitchNetwork={handleSwitchNetwork}
            switchNetworkLabel={switchNetworkLabel}
          />

          {/* Content Section */}
          <EscrowContent loading={loading} organized={organizedWithLive} isMobile={isMobile} />

          {/* Live ledger balance (from token contract) */}
          {raw && ledgerBalance && (
            <LedgerBalancePanel balance={ledgerBalance} decimals={decimals} mismatch={mismatch} />
          )}


          {/* Transaction Detail Modal */}
          <TransactionDetailModal
            txHash={selectedTxHash}
            isOpen={isModalOpen}
            onClose={handleModalClose}
            isMobile={isMobile}
            network={currentNetwork}
          />

          {/* Transaction History Modal */}
          <TransactionHistoryModal
            isOpen={isHistoryModalOpen}
            onClose={() => setIsHistoryModalOpen(false)}
            isMobile={isMobile}
            transactions={transactions}
            transactionLoading={transactionLoading}
            transactionError={transactionError}
            transactionResponse={transactionResponse}
            onLoadMoreTransactions={handleLoadMoreTransactions}
            onTransactionClick={handleTransactionClick}
            events={events}
            eventLoading={eventLoading}
            eventError={eventError}
            eventResponse={eventResponse}
            onLoadMoreEvents={handleLoadMoreEvents}
          />
        </main>
      </div>
    </TooltipProvider>
  );
};

export default EscrowDetailsClient;
