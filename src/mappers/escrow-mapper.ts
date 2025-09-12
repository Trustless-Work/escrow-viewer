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

function i128ToBigIntFlexible(v: EscrowValue | undefined): bigint | null {
  if (!v) return null;

  // { i128: { hi, lo } }
  if ((v as any).i128 && typeof (v as any).i128 === "object") {
    const i = (v as any).i128;
    const hi = BigInt(String(i.hi ?? 0));
    const lo = BigInt(String(i.lo ?? 0));
    return (hi << BigInt(64)) + lo;
  }

  // { i128: "12345" }
  if (typeof (v as any).i128 === "string") {
    try {
      return BigInt((v as any).i128);
    } catch {
      return null;
    }
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
  if (!item) return "N/A";
  const val: EscrowValue = item.val;
  if (!val) return "N/A";

  if (typeof (val as any).bool === "boolean")
    return (val as any).bool ? "True" : "False";
  if (typeof (val as any).string === "string")
    return (val as any).string;
  if (typeof (val as any).address === "string")
    return isAddress
      ? truncateAddress((val as any).address, isMobile)
      : (val as any).address;

  if ((val as any).map && key === "trustline") {
    const tm = (val as any).map as { key: { symbol: string }; val: EscrowValue }[];
    const address =
      tm.find((e) => e.key.symbol === "address")?.val?.address ??
      tm.find((e) => e.key.symbol === "contract_id")?.val?.string;
    return typeof address === "string" ? address : "N/A";
  }

  if ((val as any).i128 !== undefined) {
    if (key === "platform_fee") {
      const big = i128ToBigIntFlexible(val);
      if (big === null) return "N/A";
      const percent = Number(big) / 100; // basis points → percent
      return percent.toFixed(2) + "%";
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

    const milestoneMap = item.map.reduce(
      (macc: Record<string, EscrowValue>, entry) => {
        if (entry.key?.symbol) macc[entry.key.symbol] = entry.val;
        return macc;
      },
      {}
    );

    const base: ParsedMilestone = {
      id: index,
      title: milestoneMap.title?.string || `Milestone ${index + 1}`,
      description: milestoneMap.description?.string || `Milestone ${index + 1}`,
      status: milestoneMap.status?.string || "pending",
      approved: Boolean(milestoneMap.approved_flag?.bool),
    };

    if (escrowType === "multi-release") {
      // Scale on-chain i128 → decimal (using trustline.decimals), then clamp UI to 2 decimals
      const rawAmount = milestoneMap.amount
        ? formatAmountFromI128(milestoneMap.amount, decimals)
        : undefined;

      const displayAmount =
        rawAmount && !Number.isNaN(Number(rawAmount))
          ? Number(rawAmount).toFixed(2) // 👈 UI-friendly formatting here
          : undefined;

      return [
        ...acc,
        {
          ...base,
          amount: displayAmount,
          release_flag: Boolean(milestoneMap.release_flag?.bool),
          dispute_flag: Boolean(milestoneMap.dispute_flag?.bool),
          resolved_flag: Boolean(milestoneMap.resolved_flag?.bool),
          signer: milestoneMap.signer?.address,
          approver: milestoneMap.approver?.address,
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
  if ((balanceRaw as any)?.i128 !== undefined) {
    const big = i128ToBigIntFlexible(balanceRaw) ?? 0n;
    balance = formatFixed(Number(big) / Math.pow(10, decimals), decimals);
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
