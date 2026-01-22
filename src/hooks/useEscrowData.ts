// src/hooks/useEscrowData.ts
import { useCallback, useEffect, useState } from "react";
import { getLedgerKeyContractCode, type EscrowMap } from "@/utils/ledgerkeycontract";
import { organizeEscrowData, type OrganizedEscrowData } from "@/mappers/escrow-mapper";
import type { NetworkType } from "@/lib/network-config";
import { EXAMPLE_CONTRACT_IDS } from "@/lib/escrow-constants";

/**
 * Basic validation for Stellar contract ID format
 */
function isValidContractId(contractId: string): boolean {
  // Stellar contract IDs are 56 characters long and use base32 alphabet
  if (contractId.length !== 56) return false;
  const base32Regex = /^[A-Z2-7]+$/;
  return base32Regex.test(contractId);
}

/**
 * Loads raw escrow contract storage and maps it to OrganizedEscrowData for UI.
 * Purely client-side; no caching layer yet.
 */
export function useEscrowData(contractId: string, network: NetworkType, isMobile = false) {
  const [raw, setRaw] = useState<EscrowMap | null>(null);
  const [organized, setOrganized] = useState<OrganizedEscrowData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!contractId) return;
    setLoading(true);
    setError(null);

    // Validate contract ID format
    if (!isValidContractId(contractId)) {
      setRaw(null);
      setOrganized(null);
      setError(`Invalid contract ID format. Stellar contract IDs should be 56 characters long and contain only uppercase letters A-Z and digits 2-7.`);
      setLoading(false);
      return;
    }

    try {
      const data = await getLedgerKeyContractCode(contractId, network);
      if (data.length === 0) {
        setRaw(null);
        setOrganized(null);
        const isExampleContract = contractId === EXAMPLE_CONTRACT_IDS.testnet || contractId === EXAMPLE_CONTRACT_IDS.mainnet;
        const baseMessage = `No ledger entry found for contract ID "${contractId}".`;
        const suggestions = isExampleContract
          ? `•This example contract may not be deployed on ${network}•Use a different contract ID•The contract was recently deployed and not yet indexed`
          : `•The contract ID is invalid or doesn't exist on ${network}•The contract exists on a different network•The contract was recently deployed and not yet indexed`;
        setError(`${baseMessage}${suggestions}`);
      } else {
        setRaw(data);
        setOrganized(organizeEscrowData(data, contractId, isMobile));
      }
    } catch (e) {
      setRaw(null);
      setOrganized(null);
      const errorMessage = e instanceof Error ? e.message : "Failed to fetch escrow data";
      const userFriendlyMessage = errorMessage === "Failed to fetch"
        ? "Network error: Unable to connect to Stellar RPC. Please check your internet connection or try again later."
        : errorMessage;
      setError(userFriendlyMessage);
    } finally {
      setLoading(false);
    }
  }, [contractId, network, isMobile]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { raw, organized, loading, error, refresh };
}
