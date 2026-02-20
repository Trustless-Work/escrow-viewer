"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InfoTooltip } from "@/components/shared/info-tooltip";
import { Clock, ChevronRight, ExternalLink, AlertCircle } from "lucide-react";
import {
  type TransactionMetadata,
  formatTransactionTime,
  truncateHash,
} from "@/utils/transactionFetcher";

interface TransactionTableProps {
  transactions: TransactionMetadata[];
  loading: boolean;
  error?: string | null;
  retentionNotice?: string;
  hasMore: boolean;
  onLoadMore: () => void;
  onTransactionClick: (txHash: string) => void;
  isMobile: boolean;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  loading,
  error,
  retentionNotice,
  hasMore,
  onLoadMore,
  onTransactionClick,
  isMobile,
}) => {
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/30";
      case "FAILED":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30";
      default:
        return "bg-secondary text-secondary-foreground border-border";
    }
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="w-full">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">
              Recent Transactions
            </h3>
            <InfoTooltip content="Recent transaction history fetched from Soroban RPC. Note: RPC typically retains 24h-7 days of history. For older data, consider using full indexers like Hubble or BigQuery." />
          </div>
          <div className="flex justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">
                Loading transaction history...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">
              Recent Transactions
            </h3>
          </div>
          <div className="flex items-center gap-2 text-destructive py-6 bg-red-50 dark:bg-red-500/10 rounded-lg px-4">
            <AlertCircle className="h-5 w-5" />
            <span className="dark:text-red-300">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">
            Recent Transactions
          </h3>
          <InfoTooltip content="Recent transaction history fetched from Soroban RPC. Click on any transaction to view detailed information including signers, function calls, and results." />
        </div>
        {retentionNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="bg-amber-100 dark:bg-amber-500/20 rounded-full p-1">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-amber-800 dark:text-amber-300 mb-1">
                  Data Retention Notice
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-400/80 mb-2">
                  {retentionNotice}
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <a
                    href="https://hubble.stellar.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 px-2 py-1 rounded-full hover:bg-amber-200 dark:hover:bg-amber-500/30 transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Stellar Hubble
                  </a>
                  <a
                    href="https://console.cloud.google.com/bigquery"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 px-2 py-1 rounded-full hover:bg-amber-200 dark:hover:bg-amber-500/30 transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    BigQuery
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-primary/20 dark:to-accent/20 rounded-full flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-primary" />
            </div>
            <h4 className="text-lg font-semibold text-foreground mb-2">
              No Transactions Found
            </h4>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              This could be due to RPC retention limits, no recent activity, or
              the contract has not been used yet.
            </p>
            <div className="mt-4 text-xs text-muted-foreground">
              <p>
                Tip: Transaction history is typically available for the last 24
                hours to 7 days
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {isMobile ? (
              // Mobile: Enhanced Card layout
              <div className="space-y-3">
                {transactions.map((tx, index) => (
                  <motion.div
                    key={tx.txHash}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/50 backdrop-blur-sm border border-gray-200 dark:border-border rounded-xl p-4 hover:shadow-md hover:bg-white/80 dark:hover:bg-card/80 cursor-pointer transition-all duration-200 dark:bg-card"
                    onClick={() => onTransactionClick(tx.txHash)}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span className="font-mono text-sm text-primary font-medium">
                            {truncateHash(tx.txHash, true)}
                          </span>
                        </div>
                        <Badge className={getStatusBadgeColor(tx.status)}>
                          {tx.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <span className="font-medium">Ledger:</span>
                          <span>{tx.ledger.toLocaleString()}</span>
                        </div>
                        <span className="text-muted-foreground">
                          {formatTransactionTime(tx.createdAt)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              // Desktop: Enhanced Table layout
              <div className="overflow-hidden rounded-xl">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-muted/50 dark:to-muted/30 border-b border-gray-200 dark:border-border">
                        <th className="text-left py-4 px-6 font-semibold text-foreground text-sm">
                          Transaction Hash
                        </th>
                        <th className="text-left py-4 px-6 font-semibold text-foreground text-sm">
                          Ledger
                        </th>
                        <th className="text-left py-4 px-6 font-semibold text-foreground text-sm">
                          Time
                        </th>
                        <th className="text-left py-4 px-6 font-semibold text-foreground text-sm">
                          Status
                        </th>
                        <th className="text-left py-4 px-6 font-semibold text-foreground text-sm">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-border">
                      {transactions.map((tx, index) => (
                        <motion.tr
                          key={tx.txHash}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-blue-50/50 dark:hover:bg-muted/50 cursor-pointer transition-all duration-200 group"
                          onClick={() => onTransactionClick(tx.txHash)}
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                              <span className="font-mono text-sm text-primary group-hover:text-primary/80 font-medium">
                                {truncateHash(tx.txHash, false)}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-sm font-medium text-foreground">
                            {tx.ledger.toLocaleString()}
                          </td>
                          <td className="py-4 px-6 text-sm text-muted-foreground">
                            {formatTransactionTime(tx.createdAt)}
                          </td>
                          <td className="py-4 px-6">
                            <Badge className={getStatusBadgeColor(tx.status)}>
                              {tx.status}
                            </Badge>
                          </td>
                          <td className="py-4 px-6">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(
                                  `https://stellar.expert/explorer/testnet/tx/${tx.txHash}`,
                                  "_blank",
                                );
                              }}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {hasMore && (
              <div className="flex justify-center pt-6">
                <Button
                  onClick={onLoadMore}
                  disabled={loading}
                  variant="outline"
                  className="flex items-center gap-2 bg-white/80 dark:bg-card backdrop-blur-sm hover:bg-white dark:hover:bg-card/80 border-primary/30 text-primary hover:text-primary/80 px-6 py-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      Loading...
                    </>
                  ) : (
                    <>
                      <ChevronRight className="h-4 w-4" />
                      Load More Transactions
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
