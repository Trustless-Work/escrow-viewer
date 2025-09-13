// lib/amount-format.ts

/** 2^64 as BigInt, computed once */
const TWO_POW_64 = BigInt(2) ** BigInt(64);

/** Combine i128 hi/lo parts into a single bigint (non-negative expected). */
export function parseI128(hi: number | string, lo: number | string): bigint {
  const HI = BigInt(String(hi));
  const LO = BigInt(String(lo));
  return HI * TWO_POW_64 + LO;
}

/** 10^decimals as number (UI-safe). */
export function pow10(decimals: number): number {
  return Math.pow(10, decimals);
}

/** Convert a bigint integer with token decimals into a JS number. */
export function scaleBigintToNumber(v: bigint, decimals: number): number {
  return Number(v) / pow10(decimals);
}

/** Format a number to a fixed number of decimal places. */
export function toFixedPlaces(n: number, decimals: number): string {
  return n.toFixed(decimals);
}
