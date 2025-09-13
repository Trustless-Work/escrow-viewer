// src/mappers/escrow-mapper.ts
import { truncateAddress, calculateProgress } from "@/lib/escrow-constants";
import type { EscrowMap, EscrowValue } from "@/utils/ledgerkeycontract";

/**
 * Escrow Data Mapper (pure)
 * - Scales i128 amounts by 10^decimals (from trustline.decimals)
 * - Accepts i128 as {hi,lo} OR decimal string
 * - Clamps decimals for safe toFixed
 */

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

export interface OrganizedEscrowData {
  title: string;
  description: string;
  properties: Record<string, string>;
  roles: Record<string, string>;
  flags: { dispute_flag: string; release_flag: string; resolved_flag: string };
  milestones: ParsedMilestone[];
  progress: number;
  escrowType: EscrowType;
}

type MapEntry = { key: { symbol: string }; val: EscrowValue };
type FlagsMapEntry = { key: { symbol: "approved" | "disputed" | "released" | "resolved" }; val: EscrowValue };

// ---- helpers (typed) ----

function getDecimalsFromEscrowMap(data: EscrowMap | null): number | undefined {
  if (!data) return undefined;
  const tl = data.find((e) => e.key.symbol === "trustline")?.val?.map;
  if (!tl) return undefined;
  const decVal = tl.find((m) => m.key.symbol === "decimals")?.val as { u32?: number } | undefined;
  if (decVal && typeof decVal.u32 === "number") return decVal.u32;
  return undefined;
}

function safeDecimals(decimals?: number): number {
  if (typeof decimals !== "number" || !Number.isFinite(decimals)) return 2;
  if (decimals < 0) return 0;
  if (decimals > 18) return 18;
  return Math.floor(decimals);
}

function formatFixed(n: number, digits: number): string {
  return n.toFixed(digits);
}

/** Has i128-like member (string or {hi,lo}) */
function hasI128Like(val: unknown): val is { i128: unknown } {
  return !!val && typeof val === "object" && "i128" in (val as Record<string, unknown>);
}

/** Accept i128 as {hi,lo} OR as a decimal string */
function i128ToBigIntFlexible(v: EscrowValue | undefined): bigint | null {
  if (!v) return null;
  if (!hasI128Like(v)) return null;

  const raw = (v as { i128: unknown }).i128;
  if (typeof raw === "string") {
    try {
      return BigInt(raw);
    } catch {
      return null;
    }
  }
  if (raw && typeof raw === "object") {
    const obj = raw as { hi?: number | string; lo?: number | string };
    if (obj.hi === undefined || obj.lo === undefined) return null;
    const hi = BigInt(String(obj.hi));
    const lo = BigInt(String(obj.lo));
    return (hi << BigInt(64)) + lo;
  }
  return null;
}

function formatAmountFromI128(
  v: EscrowValue | undefined,
  decimals?: number
): string {
  const big = i128ToBigIntFlexible(v);
  if (big === null) return "N/A";
  const d = safeDecimals(decimals);
  const scaled = Number(big) / Math.pow(10, d);
  return formatFixed(scaled, d);
}

// ---- main ----

export function detectEscrowType(data: EscrowMap | null): EscrowType {
  if (!data) return "single-release";
  const milestonesEntry = data.find((e) => e.key.symbol === "milestones");
  if (!milestonesEntry?.val?.vec) return "single-release";
  const isMulti = milestonesEntry.val.vec.some((m) =>
    m.map?.some(
      (e) =>
        e.key.symbol === "amount" ||
        (typeof e.key.symbol === "string" && e.key.symbol.endsWith("flag")) ||
        e.key.symbol === "flags"
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
  if (!item) return "N/A";

  const val: EscrowValue = item.val;
  if (!val) return "N/A";

  if (typeof val.bool === "boolean") return val.bool ? "True" : "False";
  if (typeof val.string === "string") return val.string;
  if (typeof val.address === "string")
    return isAddress ? truncateAddress(val.address, isMobile) : val.address;

  if (val.map && key === "trustline") {
    const tm = val.map as MapEntry[];
    const address =
      tm.find((e) => e.key.symbol === "address")?.val?.address ??
      tm.find((e) => e.key.symbol === "contract_id")?.val?.string;
    if (typeof address === "string") return address;
    return "N/A";
  }

  // Handle both object and string i128
  if (hasI128Like(val)) {
    if (key === "platform_fee") {
      const big = i128ToBigIntFlexible(val);
      if (big === null) return "N/A";
      const percent = Number(big) / 100; // basis points → percent
      return formatFixed(percent, 2) + "%";
    }
    const decimals = getDecimalsFromEscrowMap(data);
    return formatAmountFromI128(val, decimals);
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

    const mapAsObj = item.map.reduce<Record<string, EscrowValue>>((macc, entry) => {
      if (entry.key?.symbol) macc[entry.key.symbol] = entry.val;
      return macc;
    }, {});

    // flags can be nested (`flags.map[...]`) or flat (`approved_flag`, etc.)
    const nestedFlags = (mapAsObj.flags?.map as FlagsMapEntry[] | undefined) ?? undefined;

    const getNested = (name: FlagsMapEntry["key"]["symbol"]): boolean =>
      !!nestedFlags?.find((f) => f.key.symbol === name)?.val?.bool;

    const approved =
      getNested("approved") ||
      Boolean(mapAsObj.approved?.bool) ||
      Boolean((mapAsObj as Record<string, EscrowValue>)["approved_flag"]?.bool);

    const release_flag =
      getNested("released") ||
      Boolean((mapAsObj as Record<string, EscrowValue>)["release_flag"]?.bool);

    const dispute_flag =
      getNested("disputed") ||
      Boolean((mapAsObj as Record<string, EscrowValue>)["dispute_flag"]?.bool);

    const resolved_flag =
      getNested("resolved") ||
      Boolean((mapAsObj as Record<string, EscrowValue>)["resolved_flag"]?.bool);

    const base: ParsedMilestone = {
      id: index,
      title: mapAsObj.title?.string || `Milestone ${index + 1}`,
      description: mapAsObj.description?.string || `Milestone ${index + 1}`,
      status: mapAsObj.status?.string || "pending",
      approved,
    };

    if (escrowType === "multi-release") {
      const amountStr = mapAsObj.amount
        ? formatAmountFromI128(mapAsObj.amount, decimals)
        : undefined;

      return [
        ...acc,
        {
          ...base,
          amount: amountStr ? formatFixed(Number(amountStr), 2) : undefined, // 2dp display
          release_flag,
          dispute_flag,
          resolved_flag,
          signer: mapAsObj.signer?.address,
          approver: mapAsObj.approver?.address,
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

export const extractFlags = (data: EscrowMap | null): { dispute_flag: string; release_flag: string; resolved_flag: string } => {
  const flags = {
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

  // total amount
  let totalAmount = String(extractValue(escrowData, "amount", isMobile));
  if (escrowType === "multi-release") {
    const sum = milestones.reduce((acc, m) => {
      if (m.amount && !isNaN(parseFloat(m.amount))) acc += parseFloat(m.amount);
      return acc;
    }, 0);
    if (sum > 0) totalAmount = formatFixed(sum, decimals);
  }

  // balance (prefer i128 → scaled) with SAFE guard
  let balance = String(extractValue(escrowData, "balance", isMobile));
  const balanceRaw = escrowData.find((e) => e.key.symbol === "balance")?.val;
  if (hasI128Like(balanceRaw)) {
    const big = i128ToBigIntFlexible(balanceRaw) ?? 0n;
    balance = formatFixed(Number(big) / Math.pow(10, decimals), decimals);
  }

  // display rules
  const displayAmount = formatFixed(Number(totalAmount) || 0, 2);
  const displayBalance = formatFixed(Number(balance) || 0, 2);

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
    flags: {
      dispute_flag: flags.dispute_flag,
      release_flag: flags.release_flag,
      resolved_flag: flags.resolved_flag,
    },
    milestones,
    progress,
    escrowType,
  };
};
