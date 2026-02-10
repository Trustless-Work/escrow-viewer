// src/hooks/useEscrowData.ts
import { useCallback, useEffect, useState } from "react";
import {
  getLedgerKeyContractCode,
  type EscrowMap,
} from "@/utils/ledgerkeycontract";
import {
  organizeEscrowData,
  type OrganizedEscrowData,
} from "@/mappers/escrow-mapper";
import type { NetworkType } from "@/lib/network-config";

/**
 * Loads raw escrow contract storage and maps it to OrganizedEscrowData for UI.
 * Purely client-side; no caching layer yet.
 */
export function useEscrowData(
  contractId: string,
  network: NetworkType,
  isMobile = false,
) {
  const [raw, setRaw] = useState<EscrowMap | null>(null);
  const [organized, setOrganized] = useState<OrganizedEscrowData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!contractId) return;
    setLoading(true);
    setError(null);

    try {
      const data = await getLedgerKeyContractCode(contractId, network);
      setRaw(data);
      setOrganized(organizeEscrowData(data, contractId, isMobile));
    } catch (e) {
      setRaw(null);
      setOrganized(null);
      setError(e instanceof Error ? e.message : "Failed to fetch escrow data");
    } finally {
      setLoading(false);
    }
  }, [contractId, network, isMobile]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { raw, organized, loading, error, refresh };
}
