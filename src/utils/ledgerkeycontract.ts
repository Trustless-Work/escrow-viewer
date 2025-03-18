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
  vec?: EscrowMap[]; // For nested structures like milestones
  map?: EscrowMap; // For nested maps
}

interface EscrowMapEntry {
  key: EscrowKey;
  val: EscrowValue;
}

export type EscrowMap = EscrowMapEntry[];

export async function getLedgerKeyContractCode(
  contractId: string
): Promise<EscrowMap> {
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

  const json = await res.json();

  console.log("Full JSON response:", JSON.stringify(json, null, 2));

  if (json.error) {
    throw new Error(json.error.message || "Failed to fetch ledger entries");
  }

  const entry = json.result.entries[0];
  if (!entry) {
    throw new Error("No ledger entry found for this contract ID");
  }

  const storage = entry.dataJson.contract_data.val.contract_instance.storage;
  if (!storage || !Array.isArray(storage)) {
    throw new Error("No storage data found or storage is not an array");
  }

  console.log("Storage:", JSON.stringify(storage, null, 2));

  const escrowEntry = storage.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s: any) => s.key.vec && s.key.vec[0].symbol === "Escrow"
  );
  if (!escrowEntry) {
    throw new Error("Escrow data not found in the contract storage");
  }

  console.log("Escrow Entry:", JSON.stringify(escrowEntry, null, 2));

  if (!escrowEntry.val || !Array.isArray(escrowEntry.val.map)) {
    throw new Error("Escrow value is missing or not a map array");
  }

  return escrowEntry.val.map as EscrowMap;
}
