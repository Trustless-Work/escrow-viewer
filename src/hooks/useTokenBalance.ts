// src/hooks/useTokenBalance.ts
import { useEffect, useState } from "react";
import type { EscrowMap, EscrowValue } from "@/utils/ledgerkeycontract";
import { fetchTokenBalance, fetchTokenDecimals, sacContractIdFromAsset } from "@/lib/token-service";
import { getNetworkConfig, type NetworkType } from "@/lib/network-config";
import { Networks } from "@stellar/stellar-sdk";

/** Pulls trustline metadata from the escrow storage entry. */
function extractTrustlineMeta(escrow: EscrowMap | null): {
  code?: string;
  issuer?: string;
  tokenContractId?: string;
  decimals?: number;
} | null {
  if (!escrow) return null;

  const tl = escrow.find((e) => e.key.symbol === "trustline")?.val?.map;
  if (!tl) return null;

  const get = (k: string): EscrowValue | undefined => tl.find((m) => m.key.symbol === k)?.val;

  const code = get("code")?.string;
  const issuer = get("issuer")?.address;

  // Prefer explicit contract_id, but support address/string fallback
  const tokenContractId =
    get("contract_id")?.string ??
    get("address")?.address ??
    get("address")?.string;

  let decimals: number | undefined;
  const d = get("decimals") as unknown as { u32?: number } | undefined;
  if (d && typeof d.u32 === "number") decimals = d.u32;

  return { code, issuer, tokenContractId, decimals };
}

/**
 * Reads live token balance from SAC for the escrow contract id, and
 * compares it to the stored "balance" (if present) in escrow storage.
 */
export function useTokenBalance(contractId: string, escrow: EscrowMap | null, network: NetworkType) {
  const [ledgerBalance, setLedgerBalance] = useState<string | null>(null);
  const [decimals, setDecimals] = useState<number | null>(null);
  const [mismatch, setMismatch] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLedgerBalance(null);
      setDecimals(null);
      setMismatch(false);

      const meta = extractTrustlineMeta(escrow);
      if (!meta) return;

      const passphrase =
        getNetworkConfig(network).networkPassphrase ??
        (network === "mainnet" ? Networks.PUBLIC : Networks.TESTNET);

      const tokenCid =
        meta.tokenContractId ??
        (meta.code && meta.issuer ? sacContractIdFromAsset(meta.code, meta.issuer, passphrase) : undefined);

      if (!tokenCid) return;

      // Resolve decimals (use on-chain decimals if escrow storage didn’t include them)
      let dec = typeof meta.decimals === "number" ? meta.decimals : undefined;
      if (dec === undefined) {
        try {
          dec = await fetchTokenDecimals(network, tokenCid);
        } catch {
          dec = 7; // Stellar-common default fallback
        }
      }

      // Fetch live raw balance (unscaled bigint)
      const raw = await fetchTokenBalance(network, tokenCid, contractId);
      const scaled = Number(raw) / Math.pow(10, dec);
      const scaledStr = scaled.toFixed(dec);

      if (!cancelled) {
        setLedgerBalance(scaledStr);
        setDecimals(dec);
      }

      // Compare vs stored balance (if present in escrow storage)
      const be = escrow?.find((e) => e.key.symbol === "balance")?.val as unknown as {
        i128?: { hi?: number | string; lo?: number | string };
      } | undefined;

      if (be?.i128) {
        const hi = BigInt(String(be.i128.hi ?? 0));
        const lo = BigInt(String(be.i128.lo ?? 0));
        const storedRaw = (hi << BigInt(64)) + lo;
        const stored = Number(storedRaw) / Math.pow(10, dec);
        const eps = 1 / Math.pow(10, dec);
        const isMismatch = Math.abs(stored - scaled) > eps;

        if (!cancelled) setMismatch(isMismatch);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [contractId, escrow, network]);

  return { ledgerBalance, decimals, mismatch };
}
