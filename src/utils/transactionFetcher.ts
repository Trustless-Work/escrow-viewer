/* eslint-disable @typescript-eslint/no-explicit-any */
import { Contract } from "@stellar/stellar-sdk";
import { jsonRpcCall } from "@/lib/rpc";

// Types for transaction data
export interface TransactionMetadata {
  txHash: string;
  ledger: number;
  createdAt: string;
  status: "SUCCESS" | "FAILED" | "NOT_FOUND";
  applicationOrder?: number;
}

export interface TransactionDetails {
  txHash: string;
  ledger: number;
  createdAt: string;
  status: string;
  signers: string[];
  calledFunction?: string;
  args?: any[];
  result?: any;
  envelope?: any;
  meta?: any;
}

export interface FetchTransactionsOptions {
  startLedger?: number;
  cursor?: string;
  limit?: number;
}

export interface TransactionResponse {
  transactions: TransactionMetadata[];
  latestLedger: number;
  oldestLedger: number;
  cursor?: string;
  hasMore: boolean;
  retentionNotice?: string;
}

// Types for event data
export interface EventMetadata {
  id: string;
  type: string;
  ledger: number;
  contractId: string;
  topics: string[]; // base64 encoded
  value: string; // base64 encoded
  inSuccessfulContractCall: boolean;
}

export interface EventResponse {
  events: EventMetadata[];
  latestLedger: number;
  cursor?: string;
  hasMore: boolean;
}

const SOROBAN_RPC_URL = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org";

/**
 * Fetches recent transactions for a contract using Soroban JSON-RPC
 * Gracefully handles retention-related errors
 */
export async function fetchTransactions(
  contractId: string,
  options: FetchTransactionsOptions = {}
): Promise<TransactionResponse> {
  try {
    const { startLedger, cursor, limit = 50 } = options;

    // Get contract instance to derive transaction filter
    const contract = new Contract(contractId);
    const contractAddress = contract.contractId();

    const requestBody = {
      jsonrpc: "2.0",
      id: 1,
      method: "getTransactions",
      params: {
        startLedger,
        cursor,
        limit,
        filters: [
          {
            type: "contract",
            contractIds: [contractAddress]
          }
        ]
      }
    };

    const response = await fetch(SOROBAN_RPC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      // Handle retention-related errors gracefully
      if (data.error.code === -32600 || data.error.message?.includes("retention")) {
        return {
          transactions: [],
          latestLedger: 0,
          oldestLedger: 0,
          hasMore: false,
          retentionNotice: "Transaction data beyond retention period. RPC typically retains 24h-7 days of history."
        };
      }
      throw new Error(data.error.message || "Failed to fetch transactions");
    }

    const result = data.result;
    const transactions: TransactionMetadata[] = (result.transactions || []).map((tx: any) => ({
      txHash: tx.id,
      ledger: tx.ledger,
      createdAt: tx.createdAt,
      status: tx.status,
      applicationOrder: tx.applicationOrder
    }));

    return {
      transactions,
      latestLedger: result.latestLedger || 0,
      oldestLedger: result.oldestLedger || 0,
      cursor: result.cursor,
      hasMore: !!result.cursor,
      retentionNotice: transactions.length === 0 ? 
        "No recent transactions found. Note: RPC typically retains 24h-7 days of history." : 
        undefined
    };

  } catch (error) {
    console.error("Error fetching transactions:", error);

    // Return graceful error response
    return {
      transactions: [],
      latestLedger: 0,
      oldestLedger: 0,
      hasMore: false,
      retentionNotice: "Unable to fetch transaction history. This may be due to retention limits or network issues."
    };
  }
}

/**
 * Fetches recent events for a contract using Soroban JSON-RPC getEvents
 * Limited to ~7 days retention by RPC
 */
export async function fetchEvents(
  contractId: string,
  rpcUrl: string,
  cursor?: string,
  limit: number = 50
): Promise<EventResponse> {
  try {
    // Get latest ledger to calculate startLedger for ~7 days
    const latestLedgerResponse = await jsonRpcCall<{ sequence: number }>(rpcUrl, "getLatestLedger");
    const latestLedger = latestLedgerResponse.sequence;
    // Approximate 7 days: ~121,000 ledgers (5 sec blocks)
    const startLedger = Math.max(1, latestLedger - 121000);

    const requestBody = {
      jsonrpc: "2.0",
      id: 1,
      method: "getEvents",
      params: {
        startLedger,
        filters: [
          {
            type: "contract",
            contractIds: [contractId]
          }
        ],
        cursor,
        limit
      }
    };

    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || "Failed to fetch events");
    }

    const result = data.result;
    const events: EventMetadata[] = (result.events || []).map((event: any) => ({
      id: event.id,
      type: event.type,
      ledger: event.ledger,
      contractId: event.contractId,
      topics: event.topics || [],
      value: event.value || "",
      inSuccessfulContractCall: event.inSuccessfulContractCall
    }));

    return {
      events,
      latestLedger: result.latestLedger || 0,
      cursor: result.cursor,
      hasMore: !!result.cursor
    };

  } catch (error) {
    console.error("Error fetching events:", error);

    // Return graceful error response
    return {
      events: [],
      latestLedger: 0,
      hasMore: false
    };
  }
}

/**
 * Fetches detailed information for a specific transaction
 * Returns full details with XDR decoded as JSON
 */
export async function fetchTransactionDetails(txHash: string): Promise<TransactionDetails | null> {
  try {
    const requestBody = {
      jsonrpc: "2.0",
      id: 2,
      method: "getTransaction",
      params: {
        hash: txHash
      }
    };

    const response = await fetch(SOROBAN_RPC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      console.error("Error fetching transaction details:", data.error);
      return null;
    }

    const tx = data.result;
    if (!tx) return null;

    // Extract signers from envelope
    const signers: string[] = [];
    if (tx.envelopeXdr && tx.envelope?.signatures) {
      // For now, we'll use a placeholder since extracting signers from XDR requires more complex parsing
      signers.push("(Signature validation required)");
    }

    // Extract function call information from operations
    let calledFunction: string | undefined;
    let args: any[] | undefined;
    let result: any | undefined;

    if (tx.resultMetaXdr && tx.meta) {
      try {
        // Look for invoke host function operations
        const operations = tx.envelope?.v1?.tx?.operations || [];
        const invokeOp = operations.find((op: any) => op.body?.invokeHostFunction);
        
        if (invokeOp) {
          const hostFunction = invokeOp.body.invokeHostFunction.hostFunction;
          if (hostFunction?.invokeContract) {
            calledFunction = hostFunction.invokeContract.functionName || "invoke_contract";
            args = hostFunction.invokeContract.args || [];
          }
        }

        // Extract result from meta
        if (tx.meta.v3?.sorobanMeta?.returnValue) {
          result = tx.meta.v3.sorobanMeta.returnValue;
        }
      } catch (parseError) {
        console.warn("Could not parse transaction details:", parseError);
      }
    }

    return {
      txHash: tx.id,
      ledger: tx.ledger,
      createdAt: tx.createdAt,
      status: tx.status,
      signers,
      calledFunction,
      args,
      result,
      envelope: tx.envelope,
      meta: tx.meta
    };

  } catch (error) {
    console.error("Error fetching transaction details:", error);
    return null;
  }
}

/**
 * Helper function to format transaction timestamp
 */
export function formatTransactionTime(createdAt: string): string {
  try {
    const date = new Date(createdAt);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  } catch (error) {
    console.warn("Failed to format transaction time:", error);
    return "Invalid date";
  }
}

/**
 * Helper function to truncate transaction hash for display
 */
export function truncateHash(hash: string, isMobile: boolean = false): string {
  if (!hash) return "N/A";
  if (isMobile) {
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
  }
  return `${hash.substring(0, 8)}...${hash.substring(hash.length - 6)}`;
}
