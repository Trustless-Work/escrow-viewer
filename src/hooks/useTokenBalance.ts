import { useEffect, useState } from "react";
import type { EscrowMap, EscrowValue } from "@/utils/ledgerkeycontract";
import {
  fetchTokenBalance,
  fetchTokenDecimals,
  sacContractIdFromAsset,
} from "@/lib/token-service";
import { Networks } from "@stellar/stellar-sdk";
import { getNetworkConfig, type NetworkType } from "@/lib/network-config";

// --- local helpers ---

function parseI128(hi: number | string, lo: number | string): bigint {
  const HI = BigInt(String(hi));
  const LO = BigInt(String(lo));
  return (HI << BigInt(64)) + LO;
}
function pow10(n: number) {
  return Math.pow(10, n);
}
function safeDecimals(decimals?: number): number {
  if (typeof decimals !== "number" || !Number.isFinite(decimals)) return 2;
  if (decimals < 0) return 0;
  if (decimals > 18) return 18;
  return Math.floor(decimals);
}
function toFixedPlaces(n: number, digits: number) {
  return n.toFixed(digits);
}
function scaleBigintToNumber(v: bigint, decimals: number): number {
  return Number(v) / pow10(decimals);
}

function readTrustlineMeta(escrow: EscrowMap | null): {
  code?: string;
  issuer?: string;
  decimals?: number;
  tokenContractId?: string;
} | null {
  if (!escrow) return null;
  const tlMap = escrow.find((e) => e.key.symbol === "trustline")?.val?.map;
  if (!tlMap) return null;

  const by = (k: string): EscrowValue | undefined =>
    tlMap.find((m) => m.key.symbol === k)?.val;

  const code = by("code")?.string;
  const issuer = by("issuer")?.address;
  const contractId =
    by("contract_id")?.string ??
    by("address")?.address ??
    by("address")?.string;

  let decimals: number | undefined;
  const d = by("decimals") as any;
  if (d && typeof d === "object" && "u32" in d) decimals = d.u32 as number;

  return { code, issuer, tokenContractId: contractId, decimals };
}

export function useTokenBalance(
  contractId: string,
  escrow: EscrowMap | null,
  network: NetworkType
) {
  const [ledgerBalance, setLedgerBalance] = useState<string | null>(null);
  const [decimals, setDecimals] = useState<number | null>(null);
  const [mismatch, setMismatch] = useState(false);

  useEffect(() => {
    (async () => {
      setLedgerBalance(null);
      setDecimals(null);
      setMismatch(false);

      const meta = readTrustlineMeta(escrow);
      if (!meta) return;

      try {
        const pass =
          getNetworkConfig(network).networkPassphrase ??
          (network === "mainnet" ? Networks.PUBLIC : Networks.TESTNET);

        const tokenCid =
          meta.tokenContractId ??
          (meta.code && meta.issuer
            ? sacContractIdFromAsset(meta.code, meta.issuer, pass)
            : undefined);

        if (!tokenCid) return;

        let dec =
          typeof meta.decimals === "number" ? meta.decimals : undefined;
        if (dec === undefined) {
          dec = await fetchTokenDecimals(network, tokenCid).catch(() => 7);
        }
        const d = safeDecimals(dec);

        // Try live balance; null means the host didn’t return retval
        const raw = await fetchTokenBalance(network, tokenCid, contractId).catch(
          () => null
        );

        if (raw !== null) {
          const liveNumber = scaleBigintToNumber(raw, d);
          setLedgerBalance(toFixedPlaces(liveNumber, d));
          setDecimals(d);

          // Compare vs stored balance (only when live exists)
          const be = escrow?.find((e) => e.key.symbol === "balance")?.val as any;
          if (be?.i128) {
            const big = parseI128(be.i128.hi ?? 0, be.i128.lo ?? 0);
            const stored = Number(big) / pow10(d);
            setMismatch(Math.abs(stored - liveNumber) > 1 / pow10(d));
          }
        }
      } catch {
        // swallow – panel will just not render
      }
    })();
  }, [contractId, escrow, network]);

  return { ledgerBalance, decimals, mismatch };
}
