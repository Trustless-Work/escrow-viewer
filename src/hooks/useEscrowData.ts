// src/hooks/useEscrowData.ts
import { useCallback, useEffect, useState } from "react";
import { getLedgerKeyContractCode, type EscrowMap } from "@/utils/ledgerkeycontract";
import { organizeEscrowData, type OrganizedEscrowData } from "@/mappers/escrow-mapper";
import { getNetworkConfig, type NetworkType } from "@/lib/network-config";

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
    if (!contractId) {
      setError("Please enter a contract ID");
      return;
    }

    // Basic validation for contract ID format
    if (!/^C[A-Z0-9]{55}$/.test(contractId)) {
      setError("Invalid contract ID format. Contract IDs should start with 'C' followed by 55 alphanumeric characters.");
      setRaw(null);
      setOrganized(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getLedgerKeyContractCode(contractId, network);
      if (data === null) {
        setRaw(null);
        setOrganized(null);
        const otherNetwork = network === 'testnet' ? 'mainnet' : 'testnet';
        setError(`Contract not found on ${getNetworkConfig(network).name}. Try switching to ${getNetworkConfig(otherNetwork).name} or verify the contract ID is correct.`);
      } else {
        setRaw(data);
        setOrganized(organizeEscrowData(data, contractId, isMobile));
        setError(null);
      }
    } catch (e) {
      setRaw(null);
      setOrganized(null);
      let errorMessage = "Failed to fetch escrow data";

      if (e instanceof Error) {
        if (e.message.includes("Failed to fetch")) {
          errorMessage = `Network error: Unable to connect to ${getNetworkConfig(network).name}. Please check your internet connection and try again.`;
        } else if (e.message.includes("Invalid contract ID")) {
          errorMessage = "Invalid contract ID format. Please enter a valid Soroban contract ID.";
        } else {
          errorMessage = e.message;
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [contractId, network, isMobile]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { raw, organized, loading, error, refresh };
}
