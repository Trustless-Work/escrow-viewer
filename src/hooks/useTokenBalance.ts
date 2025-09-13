import { useEffect, useState } from "react";
import type { EscrowMap, EscrowValue } from "@/utils/ledgerkeycontract";
import {
  fetchTokenBalance,
  fetchTokenDecimals,
  sacContractIdFromAsset,
} from "@/lib/token-service";
import { Networks } from "@stellar/stellar-sdk";
import { getNetworkConfig, type NetworkType } from "@/lib/network-config";

type I128Parts = { hi?: number | string; lo?: number | string };
type I128Like = { i128?: string | I128Parts };

function isI128Like(v: unknown): v is I128Like {
  return !!v && typeof v === "object" && "i128" in (v as Record<string, unknown>);
}

function i128ToBigIntSafe(v: I128Like): bigint | null {
  const i = v.i128;
  if (typeof i === "string") {
    try {
      return BigInt(i);
    } catch {
      return null;
    }
  }
  if (i && typeof i === "object") {
    const hi = BigInt(String((i as I128Parts).hi ?? 0));
    const lo = BigInt(String((i as I128Parts).lo ?? 0));
    return (hi << BigInt(64)) + lo;
  }
  return null;
}

function dbg(...args: unknown[]) {
  if (process.env.NEXT_PUBLIC_DEBUG_ESCROW === "1") {
    console.log("[useTokenBalance]", ...args);
  }
}

/** Read trustline meta from escrow map */
function readTrustlineMeta(escrow: EscrowMap | null) {
  if (!escrow) return null;
  const tl = escrow.find((e) => e.key.symbol === "trustline")?.val?.map;
  if (!tl) return null;

  const by = (k: string): EscrowValue | undefined =>
    tl.find((m) => m.key.symbol === k)?.val;

  const code = by("code")?.string;
  const issuer = by("issuer")?.address;
  const tokenContractId =
    by("contract_id")?.string ??
    by("address")?.address ??
    by("address")?.string;

  // decimals can be either exponent (7) or scale (10_000_000)
  let rawDecimals: number | undefined;
  const d = by("decimals") as unknown as { u32?: number } | undefined;
  if (d && typeof d.u32 === "number") rawDecimals = d.u32;

  return { code, issuer, tokenContractId, rawDecimals };
}

/** If decimals looks like a scale (>= 1000), convert to exponent via log10. */
function normalizeDecimals(raw?: number): number | undefined {
  if (raw === undefined || !Number.isFinite(raw)) return undefined;
  if (raw >= 1000) {
    const exp = Math.log10(raw);
    // use an integer if it's (almost) a power of 10
    if (Math.abs(exp - Math.round(exp)) < 1e-9) return Math.round(exp);
  }
  return raw;
}

function clampDecimals(d?: number): number {
  if (typeof d !== "number" || !Number.isFinite(d)) return 7; // safe default on Stellar
  if (d < 0) return 0;
  if (d > 12) return 12; // keep UI sane
  return Math.floor(d);
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
      if (!meta) {
        dbg("no trustline meta found; skipping live balance");
        return;
      }

      const passphrase =
        getNetworkConfig(network).networkPassphrase ??
        (network === "mainnet" ? Networks.PUBLIC : Networks.TESTNET);

      const tokenCid =
        meta.tokenContractId ??
        (meta.code && meta.issuer
          ? sacContractIdFromAsset(meta.code, meta.issuer, passphrase)
          : undefined);

      if (!tokenCid) {
        dbg("no token contract id; skipping live balance");
        return;
      }

      // 1) Start from escrow metadata (normalize if it’s actually a scale)
      let dGuess = normalizeDecimals(meta.rawDecimals);

      // 2) If still unknown, ask token.decimals()
      if (dGuess === undefined) {
        try {
          const dFromToken = await fetchTokenDecimals(network, tokenCid);
          dGuess = dFromToken;
        } catch {
          // ignored; will default below
        }
      }

      // 3) Clamp / default (USDC on Stellar commonly 7)
      const d = clampDecimals(dGuess);

      // 4) Fetch raw balance
      const raw = await fetchTokenBalance(network, tokenCid, contractId);
      if (raw == null) {
        dbg("simulate returned null (retval redacted?).");
        return;
      }

      // 5) Scale and format for display
      const scaled = Number(raw) / Math.pow(10, d);
      const display = scaled.toFixed(2); // UI as 2 decimals

      setLedgerBalance(display);
      setDecimals(d);

      // 6) Compare vs stored balance in escrow map (if any)
      const be = escrow?.find((e) => e.key.symbol === "balance")?.val as
        | { i128?: string | { hi?: number; lo?: number } }
        | undefined;

      let stored: number | null = null;
      if (be?.i128 !== undefined) {
        let big: bigint | null = null;
        if (typeof be.i128 === "string") {
          try {
            big = BigInt(be.i128);
          } catch {
            big = null;
          }
} else if (be && isI128Like(be) && be.i128 && typeof be.i128 === "object") {
  const bigFromParts = i128ToBigIntSafe(be);
  big = bigFromParts;
}
        if (big !== null) stored = Number(big) / Math.pow(10, d);
      }

      if (stored !== null && Number.isFinite(stored)) {
        const eps = 1 / Math.pow(10, Math.min(d, 6));
        setMismatch(Math.abs(stored - scaled) > eps);
      }

      dbg("live-balance", {
        tokenCid,
        raw: raw.toString(),
        decimalsRawFromMeta: meta.rawDecimals,
        decimalsNormalized: dGuess,
        decimalsUsed: d,
        display,
      });
    })();
  }, [contractId, escrow, network]);

  return { ledgerBalance, decimals, mismatch };
}
