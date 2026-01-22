import { Contract } from "@stellar/stellar-sdk";
import { NetworkType, getNetworkConfig } from "@/lib/network-config";

// Define types for the escrow data map
interface EscrowKey {
  symbol: string;
}

export interface EscrowValue {
  i128?: { hi: number; lo: number };
  string?: string;
  address?: string;
  bool?: boolean;
  vec?: EscrowMapEntry[]; // For nested structures like milestones
  map?: EscrowMapEntry[]; // Ensure map is an array
}

interface EscrowMapEntry {
  key: EscrowKey;
  val: EscrowValue;
  map?: EscrowMapEntry[];
}

export type EscrowMap = EscrowMapEntry[];

interface StorageEntry {
  key: { vec?: { symbol: string }[] };
  val: { map?: EscrowMapEntry[] };
}

export async function getLedgerKeyContractCode(
  contractId: string,
  network: NetworkType = 'testnet'
): Promise<EscrowMap | null> {
  try {
    const ledgerKey = new Contract(contractId).getFootprint();
    const keyBase64 = ledgerKey.toXDR("base64");

    const requestBody = {
      jsonrpc: "2.0",
      id: 8675309,
      method: "getLedgerEntries",
      params: {
        keys: [keyBase64],
        xdrFormat: "json",
      },
    };

    const networkConfig = getNetworkConfig(network);
    let res;
    try {
      res = await fetch(networkConfig.rpcUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
    } catch (error) {
      console.warn("Failed to fetch ledger entries from RPC:", error);
      return null;
    }

    if (!res.ok) {
      console.warn(`HTTP error fetching ledger entries: Status ${res.status}`);
      return null;
    }

    let json;
    try {
      json = await res.json();
    } catch (error) {
      console.warn("Failed to parse JSON response:", error);
      return null;
    }

    if (json.error) {
      console.warn("RPC error:", json.error.message || "Failed to fetch ledger entries");
      return null;
    }

    const entry = json.result.entries[0];
    if (!entry) {
      // Contract not found - this is a valid response, not an error
      return null;
    }

    const contractData = entry?.dataJson?.contract_data?.val?.contract_instance;
    if (!contractData) {
      throw new Error("No contract instance data found");
    }

    const storage = contractData.storage;
    if (!storage || !Array.isArray(storage)) {
      throw new Error("No storage data found or storage is not an array");
    }

    console.log("[DEBUG] Raw contract storage:", JSON.stringify(storage, null, 2));

    // Find the escrow entry
    const escrowEntry = storage.find(
      (s: StorageEntry) => s.key?.vec && s.key.vec[0]?.symbol === "Escrow"
    );

    if (!escrowEntry) {
      throw new Error("Escrow data not found in the contract storage");
    }

    if (!escrowEntry.val || typeof escrowEntry.val !== "object") {
      throw new Error("Escrow value is missing or not a valid object");
    }

    if (!escrowEntry.val.map || !Array.isArray(escrowEntry.val.map)) {
      return [];
    }

    return escrowEntry.val.map as EscrowMap;
  } catch (error) {
    console.error("Error fetching escrow data:", error);
    // Re-throw network and other errors, only return null for "contract not found"
    throw error;
  }
}
