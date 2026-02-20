"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransactionTable } from "@/components/escrow/TransactionTable";
import { EventTable } from "@/components/escrow/EventTable";
import {
  type TransactionMetadata,
  type TransactionResponse,
  type EventMetadata,
  type EventResponse,
} from "@/utils/transactionFetcher";
import { type NetworkType } from "@/lib/network-config";

interface TransactionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
  // Transaction data
  transactions: TransactionMetadata[];
  transactionLoading: boolean;
  transactionError: string | null;
  transactionResponse: TransactionResponse | null;
  onLoadMoreTransactions: () => void;
  onTransactionClick: (txHash: string) => void;
  // Event data
  events: EventMetadata[];
  eventLoading: boolean;
  eventError: string | null;
  eventResponse: EventResponse | null;
  onLoadMoreEvents: () => void;
}

export const TransactionHistoryModal: React.FC<TransactionHistoryModalProps> = ({
  isOpen,
  onClose,
  isMobile,
  transactions,
  transactionLoading,
  transactionError,
  transactionResponse,
  onLoadMoreTransactions,
  onTransactionClick,
  events,
  eventLoading,
  eventError,
  eventResponse,
  onLoadMoreEvents,
}) => {
  const [activeTab, setActiveTab] = useState<'transactions' | 'events'>('transactions');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isMobile ? "max-w-[95vw] max-h-[90vh]" : "max-w-6xl max-h-[90vh]"} overflow-hidden`}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Contract Activity</DialogTitle>
          <DialogDescription>
            Recent transactions and contract events for this escrow
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'transactions' | 'events')} className="w-full h-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="events">Recent Events</TabsTrigger>
            </TabsList>

            <TabsContent value="transactions" className="mt-0 h-full overflow-hidden">
              <div className="h-full overflow-y-auto">
                <TransactionTable
                  transactions={transactions}
                  loading={transactionLoading}
                  error={transactionError}
                  retentionNotice={transactionResponse?.retentionNotice}
                  hasMore={transactionResponse?.hasMore || false}
                  onLoadMore={onLoadMoreTransactions}
                  onTransactionClick={onTransactionClick}
                  isMobile={isMobile}
                />
              </div>
            </TabsContent>

            <TabsContent value="events" className="mt-0 h-full overflow-hidden">
              <div className="h-full overflow-y-auto">
                <EventTable
                  events={events}
                  loading={eventLoading}
                  error={eventError}
                  hasMore={eventResponse?.hasMore || false}
                  onLoadMore={onLoadMoreEvents}
                  isMobile={isMobile}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};