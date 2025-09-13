// src/hooks/useTokenBalance.ts
import { useEffect, useState } from "react";
import type { EscrowMap, EscrowValue } from "@/utils/ledgerkeycontract";
import { fetchTokenBalance, fetchTokenDecimals, sacContractIdFromAsset } from "@/lib/token-service";
import { getNetworkConfig, type NetworkType } from "@/lib/network-config";
import { Networks } from "@stellar/stellar-sdk";

/** Trustline sub-map entry */
type TLMapEntry = { key: { symbol: string }; val: EscrowValue };
type TrustlineShape = { map?: TLMapEntry[] } | undefined;

function readTrustlineMeta(
  escrow: EscrowMap | null
): { code?: string; issuer?: string; tokenContractId?: string; decimals?: number } | null {
  if (!escrow) return null;
  const tl = escrow.find((e) => e.key.symbol === "trustline")?.val as TrustlineShape;
  const map = tl?.map;
  if (!map) return null;

  const by = (k: string): EscrowValue | undefined => map.find((m) => m.key.symbol === k)?.val;
  const code = by("code")?.string;
  const issuer = by("issuer")?.address;
  const tokenContractId = by("contract_id")?.string ?? by("address")?.address ?? by("address")?.string;

  let decimals: number | undefined;
  const d = by("decimals") as { u32?: number } | undefined;
  if (d && typeof d.u32 === "number") decimals = d.u32;

  return { code, issuer, tokenContractId, decimals };
}

export function useTokenBalance(contractId: string, escrow: EscrowMap | null, network: NetworkType) {
  const [ledgerBalance, setLedgerBalance] = useState<string | null>(null);
  const [decimals, setDecimals] = useState<number | null>(null);
  const [mismatch, setMismatch] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLedgerBalance(null);
      setDecimals(null);
      setMismatch(false);

      const meta = readTrustlineMeta(escrow);
      if (!meta) return;

      const pass = getNetworkConfig(network).networkPassphrase ??
        (network === "mainnet" ? Networks.PUBLIC : Networks.TESTNET);

      const tokenCid =
        meta.tokenContractId ??
        (meta.code && meta.issuer ? sacContractIdFromAsset(meta.code, meta.issuer, pass) : undefined);

      if (!tokenCid) return;

      let dec = typeof meta.decimals === "number" ? meta.decimals : undefined;
      if (dec === undefined) {
        dec = await fetchTokenDecimals(network, tokenCid).catch(() => 7);
      }

      const raw = await fetchTokenBalance(network, tokenCid, contractId);
      if (raw == null) {
        if (!cancelled) {
          setDecimals(dec);
          setLedgerBalance(null);
        }
        return;
      }

      const scale = Math.pow(10, dec);
      const value = Number(raw) / scale;
      if (!cancelled) {
        setDecimals(dec);
        setLedgerBalance(value.toFixed(2)); // show 2 decimals in panel
      }

      // Compare stored contract "balance" (if present) to live balance
      const bEntry = escrow?.find((e) => e.key.symbol === "balance")?.val as
        | { i128?: unknown }
        | undefined;

      if (bEntry && typeof bEntry === "object" && "i128" in bEntry && bEntry.i128) {
        let stored = 0;
        const i = bEntry.i128 as unknown;
        if (typeof i === "string") {
          try {
            stored = Number(BigInt(i)) / scale;
          } catch {
            stored = 0;
          }
        } else if (i && typeof i === "object") {
          const obj = i as { hi?: number | string; lo?: number | string };
          const hi = BigInt(String(obj.hi ?? 0));
          const lo = BigInt(String(obj.lo ?? 0));
          stored = Number((hi << BigInt(64)) + lo) / scale;
        }
        if (!cancelled) setMismatch(Math.abs(stored - value) > 1 / scale);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [contractId, escrow, network]);

  return { ledgerBalance, decimals, mismatch };
}
