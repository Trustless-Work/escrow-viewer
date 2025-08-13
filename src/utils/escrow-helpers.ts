import { truncateAddress, calculateProgress } from "../lib/escrow-constants";
import type { EscrowMap, EscrowValue } from "@/utils/ledgerkeycontract";

/**
 * Trustless Work - Escrow Data Helpers
 * 
 * This module transforms low-level `EscrowMap` data retrieved from the Soroban smart contract
 * into a structured and typed format usable by the frontend UI.
 * It handles parsing roles, milestones, flags, amounts, and metadata.
 */

// ----- Types -----

export type EscrowType = "single-release" | "multi-release";

// Values extracted from on-chain that could be a string or a link object
export type EscrowExtractedValue = string | { label: string; url: string };

// Human-friendly milestone object
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

// Structured contract output
export interface OrganizedEscrowData {
  title: string;
  description: string;
  properties: Record<string, string>;
  roles: Record<string, string>;
  flags: {
    dispute_flag: string;
    release_flag: string;
    resolved_flag: string;
  };
  milestones: ParsedMilestone[];
  progress: number;
  escrowType: EscrowType;
}

// ----- Main Helpers -----

/**
 * Determine escrow type based on milestone flags or amounts
 */
export function detectEscrowType(data: EscrowMap | null): EscrowType {
  if (!data) return "single-release";

  const milestonesEntry = data.find((entry) => entry.key.symbol === "milestones");
  if (!milestonesEntry?.val?.vec) return "single-release";

  return milestonesEntry.val.vec.some((m) =>
    m.map?.some((e) =>
      e.key.symbol === "amount" ||
      (typeof e.key.symbol === "string" && e.key.symbol.endsWith("flag"))
    )
  ) ? "multi-release" : "single-release";
}

/**
 * Extract a human-readable value from a contract key.
 */
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


  // show asset code, issuer, decimals
  if (val.map && key === "trustline") {
    const assetCode = val.map.find((e) => e.key.symbol === "asset_code")?.val?.string;
    const issuer = val.map.find((e) => e.key.symbol === "issuer")?.val?.address;
    const decimalsEntry = val.map.find((e) => e.key.symbol === "decimals");
    const decimals = typeof decimalsEntry?.val === "object" && "u32" in decimalsEntry.val ? decimalsEntry.val.u32 : undefined;
    if (assetCode && issuer) {
      return `${assetCode} (${issuer})${typeof decimals === "number" ? `, ${decimals} decimals` : ""}`;
    }
    if (issuer) return issuer;
    return "N/A";
  }

  // Descriptive balance extraction: format using asset decimals
  if (typeof val.i128 === "string") {
    const stroops = BigInt(val.i128);
    let divisor = 1;
    const trustlineEntry = data.find((e) => e.key.symbol === "trustline");
    let decimals;
    if (trustlineEntry?.val?.map) {
      const decimalsEntry = trustlineEntry.val.map.find((m) => m.key.symbol === "decimals");
      decimals = typeof decimalsEntry?.val === "object" && "u32" in decimalsEntry.val ? decimalsEntry.val.u32 : undefined;
    }
    if (typeof decimals === "number" && decimals > 0) {
      divisor = Math.pow(10, decimals);
    }
    if (key === "platform_fee") return `${(Number(stroops) / 100).toFixed(2)}%`;
    return (Number(stroops) / divisor).toFixed(typeof decimals === "number" ? decimals : 2);
  }


  return "N/A";
};

/**
 * Transforms raw milestone entries into parsed milestone objects.
 */
export const extractMilestones = (
  data: EscrowMap | null,
  escrowType: EscrowType
): ParsedMilestone[] => {
  if (!data) return [];

  const milestonesEntry = data.find((entry) => entry.key.symbol === "milestones");
  if (!milestonesEntry?.val?.vec) return [];

  return milestonesEntry.val.vec.reduce<ParsedMilestone[]>((acc, item, index) => {
    if (!item.map) return acc;

    const milestoneMap = item.map.reduce((macc: Record<string, EscrowValue>, entry) => {
      if (entry.key?.symbol) macc[entry.key.symbol] = entry.val;
      return macc;
    }, {});

    const base: ParsedMilestone = {
      id: index,
      title: milestoneMap.title?.string || `Milestone ${index + 1}`,
      description: milestoneMap.description?.string || `Milestone ${index + 1}`,
      status: milestoneMap.status?.string || "pending",
      approved: milestoneMap.approved_flag?.bool || false,
    };

    if (escrowType === "multi-release") {
      return [
        ...acc,
        {
          ...base,
          amount: milestoneMap.amount
            ? String(extractValue([{ key: { symbol: "amount" }, val: milestoneMap.amount }], "amount", false))
            : undefined,
          release_flag: milestoneMap.release_flag?.bool,
          dispute_flag: milestoneMap.dispute_flag?.bool,
          resolved_flag: milestoneMap.resolved_flag?.bool,
          signer: milestoneMap.signer?.address,
          approver: milestoneMap.approver?.address,
        },
      ];
    }

    return [...acc, base];
  }, []);
};

/**
 * Extract all role-address mappings and format them.
 */
export const extractRoles = (
  data: EscrowMap | null,
  isMobile: boolean
): Record<string, string> => {
  if (!data) return {};

  const rolesEntry = data.find((entry) => entry.key.symbol === "roles");
  if (!rolesEntry?.val?.map) return {};

  return rolesEntry.val.map.reduce((acc, entry) => {
    if (entry.key?.symbol && entry.val?.address) {
      acc[entry.key.symbol] = truncateAddress(entry.val.address, isMobile);
    }
    return acc;
  }, {} as Record<string, string>);
};

export const extractFlags = (data: EscrowMap | null): Record<string, string> => {
  const flags: Record<string, string> = {
    dispute_flag: "N/A",
    release_flag: "N/A",
    resolved_flag: "N/A",
  };

  if (!data) return flags;

  const flagsEntry = data.find((entry) => entry.key.symbol === "flags");
  if (!flagsEntry?.val?.map) return flags;

  for (const flag of flagsEntry.val.map) {
    const symbol = flag.key.symbol;
    const boolVal = flag.val?.bool;
    if (symbol === "disputed") flags.dispute_flag = boolVal ? "True" : "False";
    if (symbol === "released") flags.release_flag = boolVal ? "True" : "False";
    if (symbol === "resolved") flags.resolved_flag = boolVal ? "True" : "False";
  }

  return flags;
};



/**
 * Create a fully structured object to be used in UI.
 */
export const organizeEscrowData = (
  escrowData: EscrowMap | null,
  contractId: string,
  isMobile: boolean
): OrganizedEscrowData | null => {
  if (!escrowData) return null;

   console.log("📦 Raw EscrowMap:", JSON.stringify(escrowData, null, 2));

  const escrowType = detectEscrowType(escrowData);
  const milestones = extractMilestones(escrowData, escrowType);
  const progress = calculateProgress(milestones);
  const roles = extractRoles(escrowData, isMobile);
  const flags = extractFlags(escrowData);


  let totalAmount = extractValue(escrowData, "amount", isMobile);

  if (escrowType === "multi-release") {
    const sum = milestones.reduce((acc, m) => {
      if (m.amount && typeof m.amount === "string" && !isNaN(parseFloat(m.amount))) {
        acc += parseFloat(m.amount);
      }
      return acc;
    }, 0);
    if (sum > 0) totalAmount = `${sum.toFixed(2)} units`;
  }

  return {
    title: String(extractValue(escrowData, "title", isMobile)),
    description: String(extractValue(escrowData, "description", isMobile)),
    properties: {
      escrow_id: contractId,
      amount: String(totalAmount),
      balance: String(extractValue(escrowData, "balance", isMobile) || totalAmount),
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
