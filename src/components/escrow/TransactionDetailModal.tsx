"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Copy,
  ExternalLink,
  User,
  Settings,
  CheckCircle,
  AlertCircle,
  Clock,
  Hash,
  Code,
} from "lucide-react";
import {
  type TransactionDetails,
  fetchTransactionDetails,
  formatTransactionTime,
  truncateHash,
} from "@/utils/transactionFetcher";

interface TransactionDetailModalProps {
  txHash: string | null;
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  txHash,
  isOpen,
  onClose,
  isMobile,
}) => {
  const [details, setDetails] = useState<TransactionDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = useCallback(async () => {
    if (!txHash) return;

    setLoading(true);
    setError(null);

    try {
      const transactionDetails = await fetchTransactionDetails(txHash);
      setDetails(transactionDetails);
    } catch (err) {
      setError("Failed to fetch transaction details");
      console.error("Error fetching transaction details:", err);
    } finally {
      setLoading(false);
    }
  }, [txHash]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Optional: Show success toast using sonner
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
      // Optional: Show error toast
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return (
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
        );
      case "FAILED":
        return (
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
        );
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

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

  const formatJsonValue = (value: unknown): string => {
    if (value === null || value === undefined) return "null";
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean")
      return String(value);
    return JSON.stringify(value, null, 2);
  };

  useEffect(() => {
    if (isOpen && txHash) {
      fetchDetails();
    }
  }, [isOpen, txHash, fetchDetails]);
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={`${isMobile ? "max-w-[95vw]" : "max-w-4xl"} max-h-[90vh] overflow-y-auto`}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Transaction Details
          </DialogTitle>
          <DialogDescription>
            Detailed information about the selected transaction
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-destructive py-4">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {details && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Transaction Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Hash
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                        {isMobile
                          ? truncateHash(details.txHash, true)
                          : details.txHash}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() =>
                          window.open(
                            `https://stellar.expert/explorer/${process.env.NEXT_PUBLIC_STELLAR_NETWORK || "testnet"}/tx/${details.txHash}`,
                            "_blank",
                          )
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() =>
                          window.open(
                            `https://stellar.expert/explorer/testnet/tx/${details.txHash}`,
                            "_blank",
                          )
                        }
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Status
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusIcon(details.status)}
                      <Badge className={getStatusBadgeColor(details.status)}>
                        {details.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Ledger
                    </label>
                    <p className="text-sm mt-1">
                      {details.ledger.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Time
                    </label>
                    <p className="text-sm mt-1">
                      {formatTransactionTime(details.createdAt)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Signers */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Signers
                </CardTitle>
              </CardHeader>
              <CardContent>
                {details.signers.length > 0 ? (
                  <div className="space-y-2">
                    {details.signers.map((signer, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                          {signer}
                        </span>
                        {signer !== "(Signature validation required)" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => copyToClipboard(signer)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No signer information available
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Function Call */}
            {details.calledFunction && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Function Call
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Function
                    </label>
                    <p className="font-mono text-sm bg-muted px-2 py-1 rounded mt-1">
                      {details.calledFunction}
                    </p>
                  </div>

                  {details.args && details.args.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-foreground">
                        Arguments
                      </label>
                      <div className="mt-1 bg-muted p-3 rounded-lg">
                        <pre className="text-xs overflow-x-auto">
                          {JSON.stringify(details.args, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Result */}
            {details.result && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Result
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-3 rounded-lg">
                    <pre className="text-xs overflow-x-auto">
                      {formatJsonValue(details.result)}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Raw Data (Collapsible) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Raw Transaction Data</CardTitle>
              </CardHeader>
              <CardContent>
                <details className="space-y-2">
                  <summary className="cursor-pointer text-sm font-medium text-primary hover:text-primary/80">
                    Show Raw Data
                  </summary>
                  <div className="mt-3 bg-muted p-3 rounded-lg">
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(
                        {
                          envelope: details.envelope,
                          meta: details.meta,
                        },
                        null,
                        2,
                      )}
                    </pre>
                  </div>
                </details>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
};
