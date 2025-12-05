// src/mappers/escrow-mapper.ts
import { truncateAddress, calculateProgress } from "@/lib/escrow-constants";
import type { EscrowMap, EscrowValue } from "@/utils/ledgerkeycontract";

export type EscrowType = "single-release" | "multi-release";
export type EscrowExtractedValue = string | { label: string; url: string };

export interface ParsedMilestone {
  id: number;
  title: string;
  description: string;
  status: string;
  approved: boolean;
  amount?: string;
  release_flag?: boolean;
  dispute_flag?: boolean;
  resolved_flag?: boolean;
  signer?: string;
  approver?: string;
}

export type EscrowFlags = {
  dispute_flag: string;
  release_flag: string;
  resolved_flag: string;
};

export interface OrganizedEscrowData {
  title: string;
  description: string;
  properties: Record<string, string>;
  roles: Record<string, string>;
  flags: EscrowFlags;
  milestones: ParsedMilestone[];
  progress: number;
  escrowType: EscrowType;
}

/* ---------------- helpers ---------------- */
function getStr(m: Record<string, EscrowValue>, k: string): string | undefined {
  const v = m[k] as unknown;
  return isStrLike(v) ? v.string : undefined;
}
function getAddr(m: Record<string, EscrowValue>, k: string): string | undefined {
  const v = m[k] as unknown;
  return isAddrLike(v) ? v.address : undefined;
}
function getBool(m: Record<string, EscrowValue>, k: string): boolean | undefined {
  const v = m[k] as unknown;
  return isBoolLike(v) ? v.bool : undefined;
}
function getMap(m: Record<string, EscrowValue>, k: string): MapEntry[] | undefined {
  const v = m[k] as unknown;
  return isMapLike(v) ? v.map : undefined;
}
function getI128(m: Record<string, EscrowValue>, k: string): I128Like | undefined {
  const v = m[k] as unknown;
  return isI128Like(v) ? (v as I128Like) : undefined;
}


type BoolLike        = { bool: boolean };
type StrLikePresent  = { string: string };
type AddrLikePresent = { address: string };
type MapEntry        = { key: { symbol: string }; val: EscrowValue };
type MapLikePresent  = { map: MapEntry[] };
type I128Parts       = { hi?: number | string; lo?: number | string };
type I128Like        = { i128: string | I128Parts };

function isBoolLike(v: unknown): v is BoolLike {
  return !!v && typeof (v as Record<"bool", unknown>).bool === "boolean";
}
function isStrLike(v: unknown): v is StrLikePresent {
  return !!v && typeof (v as Record<"string", unknown>).string === "string";
}
function isAddrLike(v: unknown): v is AddrLikePresent {
  return !!v && typeof (v as Record<"address", unknown>).address === "string";
}
function isMapLike(v: unknown): v is MapLikePresent {
  const m = v as { map?: unknown };
  return !!v && Array.isArray(m.map);
}
// (If you don’t use isVecLike anywhere, delete it entirely to fix the unused error)

function isI128Parts(v: unknown): v is I128Parts {
  if (!v || typeof v !== "object") return false;
  const r = v as Record<string, unknown>;
  return ("hi" in r || "lo" in r); // presence indicates the {hi,lo} form
}

function isI128Like(v: unknown): v is I128Like {
  if (!v || typeof v !== "object") return false;
  const r = v as Record<string, unknown>;
  if (!("i128" in r)) return false;
  const raw = (r as { i128: unknown }).i128;
  return typeof raw === "string" || isI128Parts(raw);
}

function i128ToBigIntFlexibleSafe(v: I128Like): bigint | null {
  const raw = v.i128;
  if (typeof raw === "string") {
    try { return BigInt(raw); } catch { return null; }
  }
  if (isI128Parts(raw)) {
    const hi = BigInt(String(raw.hi ?? 0));
    const lo = BigInt(String(raw.lo ?? 0));
    return (hi << BigInt(64)) + lo;
  }
  return null;
}



function getDecimalsFromEscrowMap(data: EscrowMap | null): number | undefined {
  if (!data) return undefined;
  const tl = data.find((e) => e.key.symbol === "trustline")?.val?.map;
  if (!tl) return undefined;
  const decVal = tl.find((m) => m.key.symbol === "decimals")?.val as
    | { u32?: number }
    | undefined;
  if (decVal && typeof decVal.u32 === "number") return decVal.u32;
  return undefined;
}

function safeDecimals(decimals?: number): number {
  if (typeof decimals !== "number" || !Number.isFinite(decimals)) return 7; // Stellar default
  if (decimals < 0) return 0;
  if (decimals > 18) return 7; // clamp outliers
  return Math.floor(decimals);
}

function formatFixed(n: number, digits: number): string {
  return n.toFixed(digits);
}





/* ---------------- main ---------------- */

export function detectEscrowType(data: EscrowMap | null): EscrowType {
  if (!data) return "single-release";
  const milestonesEntry = data.find((e) => e.key.symbol === "milestones");
  if (!milestonesEntry?.val?.vec) return "single-release";
  const isMulti = milestonesEntry.val.vec.some((m) =>
    m.map?.some(
      (e) =>
        e.key.symbol === "amount" ||
        (typeof e.key.symbol === "string" && e.key.symbol.endsWith("flag"))
    )
  );
  return isMulti ? "multi-release" : "single-release";
}

export const extractValue = (
  data: EscrowMap | null,
  key: string,
  isMobile: boolean,
  isAddress = false
): EscrowExtractedValue => {
  if (!data) return "N/A";
  const item = data.find((entry) => entry.key.symbol === key);
  if (!item) {
    // Log when platform_fee is not found
    if (key === "platform_fee") {
      console.warn("[DEBUG] Platform fee entry not found. Available keys:", 
        data.map(e => e.key.symbol));
    }
    return "N/A";
  }
 const val: unknown = item.val;   // ⬅️ was EscrowValue
if (val == null) return "N/A";

// Handle platform_fee with multiple possible formats
if (key === "platform_fee") {
  console.log("[DEBUG] Platform fee raw value from RPC:", JSON.stringify(val, null, 2));
  
  // Check if it's a string (might already be formatted)
  if (isStrLike(val)) {
    const str = val.string.trim();
    // If it already has %, return as-is
    if (str.includes('%')) {
      return str;
    }
    // Otherwise, try to parse as number
    const num = parseFloat(str);
    if (!isNaN(num)) {
      // If > 100, treat as basis points; otherwise as percentage
      return (num > 100 ? num / 100 : num).toFixed(2) + "%";
    }
    return str;
  }
  
  // Check for u32 format
  const u32Val = val as { u32?: number };
  if (u32Val && typeof u32Val.u32 === "number") {
    console.log("[DEBUG] Platform fee as u32:", u32Val.u32);
    const num = u32Val.u32;
    return (num > 100 ? num / 100 : num).toFixed(2) + "%";
  }
  
  // Check for u64 format
  const u64Val = val as { u64?: string | number };
  if (u64Val && u64Val.u64 !== undefined) {
    const num = typeof u64Val.u64 === "string" ? parseInt(u64Val.u64, 10) : u64Val.u64;
    if (!isNaN(num)) {
      console.log("[DEBUG] Platform fee as u64:", num);
      return (num > 100 ? num / 100 : num).toFixed(2) + "%";
    }
  }
}

if (isBoolLike(val)) return val.bool ? "True" : "False";
if (isStrLike(val)) return val.string;  // ✅ no more "never"
if (isAddrLike(val)) return isAddress ? truncateAddress(val.address, isMobile) : val.address;

if (isMapLike(val) && key === "trustline") {
  const tm: MapEntry[] = (val.map ?? []);
  const addrVal = tm.find(e => e.key.symbol === "address")?.val;
  const cidVal  = tm.find(e => e.key.symbol === "contract_id")?.val;
  const addr = isAddrLike(addrVal) ? addrVal.address : undefined;
  const cid  = isStrLike(cidVal)  ? cidVal.string      : undefined;
  return addr ?? cid ?? "N/A";
}

if (isI128Like(val)) {
  if (key === "platform_fee") {
    const big = i128ToBigIntFlexibleSafe(val);
    if (big === null) return "N/A";
    
    // Log the raw value to understand the format
    console.log("[DEBUG] Platform fee raw i128 value:", {
      raw: val,
      bigInt: big.toString(),
      number: Number(big)
    });
    
    // Platform fee might come as:
    // - Basis points (500 = 5%) - divide by 100
    // - Direct percentage (5 = 5%) - use as-is
    // - Percentage with decimals (500 = 5.00%) - divide by 100
    // Let's check the actual value to determine the format
    const numValue = Number(big);
    
    // If value is > 100, it's likely basis points (divide by 100)
    // If value is <= 100, it might be direct percentage
    if (numValue > 100) {
      return (numValue / 100).toFixed(2) + "%";
    } else {
      // Value is <= 100, treat as direct percentage
      return numValue.toFixed(2) + "%";
    }
  }
  const d = safeDecimals(getDecimalsFromEscrowMap(data));
  const big = i128ToBigIntFlexibleSafe(val);
  if (big === null) return "N/A";
  return (Number(big) / Math.pow(10, d)).toFixed(d);
}

  return "N/A";
};

export const extractMilestones = (
  data: EscrowMap | null,
  escrowType: EscrowType
): ParsedMilestone[] => {
  if (!data) return [];

  const decimals = getDecimalsFromEscrowMap(data);
  const milestonesEntry = data.find((entry) => entry.key.symbol === "milestones");
  if (!milestonesEntry?.val?.vec) return [];

  return milestonesEntry.val.vec.reduce<ParsedMilestone[]>((acc, item, index) => {
    if (!item.map) return acc;

    // Collapse the milestone's map into a key->EscrowValue object
    const milestoneMap = item.map.reduce<Record<string, EscrowValue>>((macc, entry) => {
      if (entry.key?.symbol) macc[entry.key.symbol] = entry.val;
      return macc;
    }, {});

    // --- NEW: handle nested flags map ---
    // either flags live under milestoneMap.flags.map[...] or as flat *_flag keys
 // nested flags map (if present)
// --- flags: nested or flat ---
const nestedFlags: MapEntry[] | undefined = getMap(milestoneMap, "flags");

const getNestedFlag = (name: "approved" | "released" | "disputed" | "resolved"): boolean =>
  !!nestedFlags?.find((f: MapEntry) => f.key.symbol === name)?.val?.bool;

const approved =
  getNestedFlag("approved") ||
  !!getBool(milestoneMap, "approved") ||
  !!getBool(milestoneMap, "approved_flag");

const release_flag =
  getNestedFlag("released") || !!getBool(milestoneMap, "release_flag");

const dispute_flag =
  getNestedFlag("disputed") || !!getBool(milestoneMap, "dispute_flag");

const resolved_flag =
  getNestedFlag("resolved") || !!getBool(milestoneMap, "resolved_flag");

// --- required strings (ensure plain string, not string|undefined) ---
const title = getStr(milestoneMap, "title") ?? `Milestone ${index + 1}`;
const description = getStr(milestoneMap, "description") ?? `Milestone ${index + 1}`;
const status = getStr(milestoneMap, "status") ?? "pending";

const base: ParsedMilestone = {
  id: index,
  title,
  description,
  status,
  approved,
};

if (escrowType === "multi-release") {
  let amountStr: string | undefined;
  const i128 = getI128(milestoneMap, "amount");
  if (i128) {
    const big = i128ToBigIntFlexibleSafe(i128);
    if (big !== null) {
      const d = safeDecimals(decimals);
      amountStr = (Number(big) / Math.pow(10, d)).toFixed(2);
    }
  }

  return [
    ...acc,
    {
      ...base,
      amount: amountStr,
      release_flag,
      dispute_flag,
      resolved_flag,
      signer: getAddr(milestoneMap, "signer"),
      approver: getAddr(milestoneMap, "approver"),
    },
  ];
}



    return [...acc, base];
  }, []);
};


export const extractRoles = (
  data: EscrowMap | null,
  isMobile: boolean
): Record<string, string> => {
  if (!data) return {};
  const rolesEntry = data.find((entry) => entry.key.symbol === "roles");
  if (!rolesEntry?.val?.map) return {};
  return rolesEntry.val.map.reduce((acc, entry) => {
    const addr = entry.val?.address;
    if (entry.key?.symbol && typeof addr === "string") {
      acc[entry.key.symbol] = truncateAddress(addr, isMobile);
    }
    return acc;
  }, {} as Record<string, string>);
};

export const extractFlags = (data: EscrowMap | null): EscrowFlags => {
  const flags: EscrowFlags = {
    dispute_flag: "N/A",
    release_flag: "N/A",
    resolved_flag: "N/A",
  };
  if (!data) return flags;

  const flagsEntry = data.find((entry) => entry.key.symbol === "flags");
  if (!flagsEntry?.val?.map) return flags;

  for (const flag of flagsEntry.val.map) {
    const symbol = flag.key.symbol;
    const boolVal = flag.val?.bool === true;
    if (symbol === "disputed" || symbol === "dispute_flag")
      flags.dispute_flag = boolVal ? "True" : "False";
    if (symbol === "released" || symbol === "release_flag")
      flags.release_flag = boolVal ? "True" : "False";
    if (symbol === "resolved" || symbol === "resolved_flag")
      flags.resolved_flag = boolVal ? "True" : "False";
  }
  return flags;
};

export const organizeEscrowData = (
  escrowData: EscrowMap | null,
  contractId: string,
  isMobile: boolean
): OrganizedEscrowData | null => {
  if (!escrowData) return null;

  const decimals = safeDecimals(getDecimalsFromEscrowMap(escrowData));
  const escrowType = detectEscrowType(escrowData);
  const milestones = extractMilestones(escrowData, escrowType);
  const progress = calculateProgress(milestones);
  const roles = extractRoles(escrowData, isMobile);
  const flags = extractFlags(escrowData);

  // amount
  let totalAmount: string = String(extractValue(escrowData, "amount", isMobile));
  if (escrowType === "multi-release") {
    const sum = milestones.reduce((acc, m) => {
      if (m.amount && !isNaN(parseFloat(m.amount))) acc += parseFloat(m.amount);
      return acc;
    }, 0);
    if (sum > 0) totalAmount = formatFixed(sum, decimals);
  }

  // balance
let balance = String(extractValue(escrowData, "balance", isMobile));
const balanceRaw = escrowData.find((e) => e.key.symbol === "balance")?.val;
if (isI128Like(balanceRaw)) {
  const big = i128ToBigIntFlexibleSafe(balanceRaw);
  const d = safeDecimals(getDecimalsFromEscrowMap(escrowData));
  balance = big === null ? balance : (Number(big) / Math.pow(10, d)).toFixed(d);
}


// total amount (UI-friendly → 2 decimals)
const displayAmount = Number(totalAmount) ? Number(totalAmount).toFixed(2) : "0.00";

// balance (UI-friendly → 2 decimals)
const displayBalance = Number(balance) ? Number(balance).toFixed(2) : "0.00";
  return {
    title: String(extractValue(escrowData, "title", isMobile)),
    description: String(extractValue(escrowData, "description", isMobile)),
    properties: {
      escrow_id: contractId,
      amount: displayAmount,
      balance: displayBalance,
      platform_fee: String(extractValue(escrowData, "platform_fee", isMobile)),
      engagement_id: String(extractValue(escrowData, "engagement_id", isMobile)),
      trustline: String(extractValue(escrowData, "trustline", isMobile)),
    },
    roles,
    flags, // <-- now correctly typed
    milestones,
    progress,
    escrowType,
  };
};
