/**
 * Utility to fetch recent transactions for a given escrow contract
 * using Soroban JSON-RPC methods: getTransactions and getTransaction.
 *
 * Not using `stellar-sdk.Server` as it does NOT support Soroban JSON-RPC.
 * Instead, we manually call RPC endpoints using `fetch`.
 */

const SOROBAN_RPC_URL = "https://rpc-futurenet.stellar.org";

// Type definition for the simplified transaction metadata
interface TransactionMeta {
  txHash: string;
  ledger: number;
  createdAt: string;
  status: string; // e.g. "Success", "Failed", etc.
}

/**
 * Fetch recent transactions involving a contract using `getTransactions`.
 * Returns a paginated list of transaction metadata.
 * Gracefully handles errors when transaction history falls outside retention window (~24h).
 *
 * @param contractId The Soroban smart contract ID
 * @param options Optional: pagination cursor
 */
export async function fetchTransactions(
  contractId: string,
  options?: { cursor?: string }
): Promise<TransactionMeta[] | { error: true; message: string }> {
  try {
    const res = await fetch(SOROBAN_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getTransactions",
        params: {
          contractId,
          ...(options?.cursor && { cursor: options.cursor }),
        },
      }),
    });

    const data = await res.json();

    // If no transactions found or error thrown
    if (!data.result || !data.result.transactions) {
      throw new Error("No recent transactions available.");
    }

    // Map response into simplified form for UI
    return data.result.transactions.map((tx: any) => ({
      txHash: tx.hash,
      ledger: tx.ledger,
      createdAt: tx.created_at,
      status: tx.status, // success/failure status string
    }));
  } catch (err) {
    console.error("Error fetching recent transactions:", err);
    return { error: true, message: "Transaction history unavailable or too old." };
  }
}

/**
 * Fetch detailed transaction info using `getTransaction` for a given hash.
 * Includes XDR and signer data if available.
 * Supports xdrFormat: "json" for simpler parsing.
 *
 * @param txHash The transaction hash to look up
 */
export async function fetchTransactionDetails(
  txHash: string
): Promise<any> {
  try {
    const res = await fetch(SOROBAN_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "getTransaction",
        params: {
          hash: txHash,
          xdrFormat: "json", // requested format for easier decoding
        },
      }),
    });

    const data = await res.json();

    if (!data.result) throw new Error("No transaction detail found");
    return data.result;
  } catch (err) {
    console.error("Error fetching transaction details:", err);
    return { error: true, message: "Transaction details not found or unavailable." };
  }
}
