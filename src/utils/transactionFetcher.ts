/* eslint-disable @typescript-eslint/no-explicit-any */
import { Contract } from "@stellar/stellar-sdk";
import { jsonRpcCall } from "@/lib/rpc";
import { getNetworkConfig, type NetworkType } from "@/lib/network-config";

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


/**
 * Fetches recent transactions for a contract using Soroban JSON-RPC
 * Gracefully handles retention-related errors
 */
export async function fetchTransactions(
  contractId: string,
in
): Promise<TransactionResponse> {
  try {
    // Basic validation for contract ID format
    if (!/^C[A-Z0-9]{55}$/.test(contractId)) {
      throw new Error("Invalid contract ID format. Contract IDs should start with 'C' followed by 55 alphanumeric characters.");
    }

    const { startLedger, cursor, limit = 50 } = options;
    const networkConfig = getNetworkConfig(network);

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
            contractIds: [contractAddress],
          },
        ],
      },
    };

    let response;
    try {
      response = await fetch(networkConfig.rpcUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
    } catch (error) {
      console.warn("Failed to fetch transactions from RPC:", error);
      return {
        transactions: [],
        latestLedger: 0,
        oldestLedger: 0,
        hasMore: false,
        retentionNotice: "Unable to connect to RPC. Please check your internet connection."
      };
    }

    if (!response.ok) {
      console.warn(`HTTP error fetching transactions: Status ${response.status}`);
      return {
        transactions: [],
        latestLedger: 0,
        oldestLedger: 0,
        hasMore: false,
        retentionNotice: "Unable to connect to RPC. Please check your internet connection."
      };
    }

    let data;
    try {
      data = await response.json();
    } catch (error) {
      console.warn("Failed to parse JSON response:", error);
      return {
        transactions: [],
        latestLedger: 0,
        oldestLedger: 0,
        hasMore: false,
        retentionNotice: "Unable to connect to RPC. Please check your internet connection."
      };
    }

    if (data.error) {
      // Handle retention-related errors gracefully
      if (
        data.error.code === -32600 ||
        data.error.message?.includes("retention")
      ) {
        return {
          transactions: [],
          latestLedger: 0,
          oldestLedger: 0,
          hasMore: false,
          retentionNotice:
            "Transaction data beyond retention period. RPC typically retains 24h-7 days of history.",
        };
      }
      console.warn("RPC error:", data.error.message || "Failed to fetch transactions");
      return {
        transactions: [],
        latestLedger: 0,
        oldestLedger: 0,
        hasMore: false,
        retentionNotice: "Unable to connect to RPC. Please check your internet connection."
      };
    }

    const result = data.result;
    const transactions: TransactionMetadata[] = (result.transactions || []).map(
      (tx: any) => ({
        txHash: tx.id,
        ledger: tx.ledger,
        createdAt: tx.createdAt,
        status: tx.status,
        applicationOrder: tx.applicationOrder,
      }),
    );

    return {
      transactions,
      latestLedger: result.latestLedger || 0,
      oldestLedger: result.oldestLedger || 0,
      cursor: result.cursor,
      hasMore: !!result.cursor,
      retentionNotice:
        transactions.length === 0
          ? "No recent transactions found. Note: RPC typically retains 24h-7 days of history."
          : undefined,
    };
  } catch (error) {
    console.error("Error fetching transactions:", error);

    // Return graceful error response
    return {
      transactions: [],
      latestLedger: 0,
      oldestLedger: 0,
      hasMore: false,
      retentionNotice:
        "Unable to fetch transaction history. This may be due to retention limits or network issues.",
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
    // Basic validation for contract ID format
    if (!/^C[A-Z0-9]{55}$/.test(contractId)) {
      throw new Error("Invalid contract ID format. Contract IDs should start with 'C' followed by 55 alphanumeric characters.");
    }

    // Build request params
    const params: any = {
      filters: [
        {
          type: "contract",
          contractIds: [contractId]
        }
      ],
      cursor,
      limit
    };

    // Only add startLedger if we can calculate a reasonable recent range
    // RPC typically retains ~7 days, but we try to be more conservative
    try {
      const latestLedgerResponse = await jsonRpcCall<{ sequence: number }>(rpcUrl, "getLatestLedger");
      const latestLedger = latestLedgerResponse.sequence;
      // Conservative estimate: ~3 days (5 sec blocks * 86400 sec/day * 3 days)
      const estimatedStartLedger = Math.max(1, latestLedger - 51840);

      // Only use startLedger if it's reasonably recent (avoid invalid range errors)
      if (estimatedStartLedger > latestLedger - 100000) { // Within last ~6 days
        params.startLedger = estimatedStartLedger;
      }
    } catch (ledgerError) {
      // If we can't get latest ledger, proceed without startLedger
      console.warn("Could not fetch latest ledger for events, using default range:", ledgerError);
    }

    const makeRequest = async (requestParams: any) => {
      try {
        const response = await fetch(rpcUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "getEvents",
            params: requestParams
          }),
        });

        if (!response.ok) {
          console.warn(`HTTP error fetching events: Status ${response.status}`);
          return { error: { message: "Unable to connect to RPC. Please check your internet connection." } };
        }

        try {
          return await response.json();
        } catch (error) {
          console.warn("Failed to parse JSON response:", error);
          return { error: { message: "Unable to connect to RPC. Please check your internet connection." } };
        }
      } catch (error) {
        console.warn("Failed to fetch events from RPC:", error);
        return { error: { message: "Unable to connect to RPC. Please check your internet connection." } };
      }
    };

    let data = await makeRequest(params);

    // If startLedger is out of range, retry without it
    if (data.error && data.error.message?.includes("startLedger must be within")) {
      console.warn("startLedger out of range, retrying without startLedger");
      delete params.startLedger;
      data = await makeRequest(params);
    }

    if (data.error) {
      if (data.error.message?.includes("Unable to connect")) {
        return {
          events: [],
          latestLedger: 0,
          cursor: undefined,
          hasMore: false
        };
      }
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
  try {
    const networkConfig = getNetworkConfig(network);
    const requestBody = {
      jsonrpc: "2.0",
      id: 2,
      method: "getTransaction",
      params: {
        hash: txHash,
      },
    };

    const response = await fetch(networkConfig.rpcUrl, {
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
        const invokeOp = operations.find(
          (op: any) => op.body?.invokeHostFunction,
        );

        if (invokeOp) {
          const hostFunction = invokeOp.body.invokeHostFunction.hostFunction;
          if (hostFunction?.invokeContract) {
            calledFunction =
              hostFunction.invokeContract.functionName || "invoke_contract";
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
      meta: tx.meta,
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
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
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
