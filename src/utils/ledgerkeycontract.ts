import { Contract } from "@stellar/stellar-sdk";

// Define types for the escrow data map
interface EscrowKey {
  symbol: string;
}

interface EscrowValue {
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
}

export type EscrowMap = EscrowMapEntry[];

interface StorageEntry {
  key: { vec?: { symbol: string }[] };
  val: { map?: EscrowMapEntry[] };
}

export async function getLedgerKeyContractCode(
  contractId: string
): Promise<EscrowMap> {
  try {
    console.log(`Fetching ledger data for contract ID: ${contractId}`);

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

    const res = await fetch("https://soroban-testnet.stellar.org", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status}`);
    }

    const json = await res.json();
    console.log("Full JSON response:", JSON.stringify(json, null, 2));

    if (json.error) {
      throw new Error(json.error.message || "Failed to fetch ledger entries");
    }

    const entry = json.result.entries[0];
    if (!entry) {
      throw new Error("No ledger entry found for this contract ID");
    }

    const contractData = entry?.dataJson?.contract_data?.val?.contract_instance;
    if (!contractData) {
      throw new Error("No contract instance data found");
    }

    const storage = contractData.storage;
    if (!storage || !Array.isArray(storage)) {
      throw new Error("No storage data found or storage is not an array");
    }

    console.log("Storage:", JSON.stringify(storage, null, 2));

    // Find the escrow entry
    const escrowEntry = storage.find(
      (s: StorageEntry) => s.key?.vec && s.key.vec[0]?.symbol === "Escrow"
    );

    if (!escrowEntry) {
      throw new Error("Escrow data not found in the contract storage");
    }

    console.log("Escrow Entry:", JSON.stringify(escrowEntry, null, 2));

    if (!escrowEntry.val || typeof escrowEntry.val !== "object") {
      throw new Error("Escrow value is missing or not a valid object");
    }

    if (!escrowEntry.val.map || !Array.isArray(escrowEntry.val.map)) {
      console.warn("Escrow value map is not an array:", escrowEntry.val.map);
      return [];
    }

    console.log("Escrow Map:", JSON.stringify(escrowEntry.val.map, null, 2));

    return escrowEntry.val.map as EscrowMap;
  } catch (error) {
    console.error("Error fetching escrow data:", error);
    return [];
  }
}
