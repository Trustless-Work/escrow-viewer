/* eslint-disable @typescript-eslint/no-explicit-any */
import type { JSX } from "react";
import { truncateAddress, calculateProgress } from "../lib/escrow-constants";
import type { EscrowMap, EscrowValue } from "@/utils/ledgerkeycontract";

export type EscrowType = "single-release" | "multi-release";


// ─────────────────────────────────────────────────────────────
// 🧠 1. Detect Escrow Type
// ─────────────────────────────────────────────────────────────
export function detectEscrowType(data: EscrowMap | null): EscrowType {
  if (!data) return "single-release";

  const milestonesEntry = data.find((entry) => entry.key.symbol === "milestones");
  if (!milestonesEntry || !milestonesEntry.val || !milestonesEntry.val.vec) return "single-release";

  const milestones = milestonesEntry.val.vec;
  if (milestones.some(m =>
    m.map && Array.isArray(m.map) &&
    m.map.some(e => e.key.symbol === "amount" || e.key.symbol.endsWith("flag"))
  )) {
    return "multi-release";
  }

  return "single-release";
}


// ─────────────────────────────────────────────────────────────
// 🔍 2. Extract Individual Escrow Field
// ─────────────────────────────────────────────────────────────
export const extractValue = (
  data: EscrowMap | null,
  key: string,
  isMobile: boolean,
  isAddress = false
): string | JSX.Element => {
  if (!data) return "N/A";

  const item = data.find((entry) => entry.key.symbol === key);
  if (!item) return "N/A";

  const val: EscrowValue = item.val;
  if (!val) return "N/A";

  // Boolean
  if (typeof val.bool === "boolean") {
    return val.bool ? "True" : "False";
  }

  // String
  if (typeof val.string === "string") {
    return val.string;
  }

  // Address
  if (typeof val.address === "string") {
    return isAddress ? truncateAddress(val.address, isMobile) : val.address;
  }

  // i128 (amounts)
  if (val.i128) {
    let stroops: bigint;

    if (typeof val.i128 === "string") {
      stroops = BigInt(val.i128);
    } else if (
      typeof val.i128 === "object" &&
      typeof val.i128.lo === "number"
    ) {
      const lo = BigInt(val.i128.lo);
      const hi = val.i128.hi ? BigInt(val.i128.hi) * BigInt(2 ** 32) : BigInt(0);
      stroops = lo + hi;
    } else {
      return "N/A";
    }

    // Handle divisor from trustline
    const trustlineEntry = data.find((entry) => entry.key.symbol === "trustline");
    const decimalsEntry = trustlineEntry?.val?.map?.find((e) => e.key.symbol === "decimals");

    const divisor =
      typeof decimalsEntry?.val?.u32 === "number" && decimalsEntry.val.u32 > 0
        ? decimalsEntry.val.u32
        : 1;

    if (key === "platform_fee") {
      return `${(Number(stroops) / 100).toFixed(2)}%`;
    }

    const units = Number(stroops) / divisor;
    return `${units.toFixed(2)}`;
  }

  // Fallback for unknown types
  return "N/A";
};


// ─────────────────────────────────────────────────────────────
// 📦 3. Extract Milestones (multi-release or not)
// ─────────────────────────────────────────────────────────────
export const extractMilestones = (
  data: EscrowMap | null,
  escrowType: EscrowType
): any[] => {
  if (!data) return [];

  const milestonesEntry = data.find((entry) => entry.key.symbol === "milestones");
  if (!milestonesEntry || !milestonesEntry.val || !milestonesEntry.val.vec) return [];

  const milestones = milestonesEntry.val.vec.map((item, index) => {
    if (!item.map || !Array.isArray(item.map)) return null;

    const milestoneMap = item.map.reduce((acc, entry) => {
      if (entry.key && entry.key.symbol) {
        acc[entry.key.symbol] = entry.val;
      }
      return acc;
    }, {} as Record<string, any>);

    if (escrowType === "multi-release") {
      return {
        id: index,
        title: milestoneMap.title?.string || `Milestone ${index + 1}`,
        description: milestoneMap.description?.string || `Milestone ${index + 1}`,
        status: milestoneMap.status?.string || "pending",
        approved: milestoneMap.approved_flag?.bool || false,
        amount: milestoneMap.amount
          ? extractValue([{ key: { symbol: "amount" }, val: milestoneMap.amount }], "amount", false)
          : undefined,
        release_flag: milestoneMap.release_flag?.bool,
        dispute_flag: milestoneMap.dispute_flag?.bool,
        resolved_flag: milestoneMap.resolved_flag?.bool,
        signer: milestoneMap.signer?.address,
        approver: milestoneMap.approver?.address,
      };
    } else {
      return {
        id: index,
        title: milestoneMap.title?.string || `Milestone ${index + 1}`,
        description: milestoneMap.description?.string || `Milestone ${index + 1}`,
        status: milestoneMap.status?.string || "pending",
        approved: milestoneMap.approved_flag?.bool || false,
      };
    }
  });

  return milestones.filter(Boolean);
};


// ─────────────────────────────────────────────────────────────
// 🙋 4. Extract Escrow Roles
// ─────────────────────────────────────────────────────────────
export const extractRoles = (
  data: EscrowMap | null,
  isMobile: boolean
): Record<string, string | JSX.Element> => {
  if (!data) return {};

  const rolesEntry = data.find((entry) => entry.key.symbol === "roles");
  if (!rolesEntry || !rolesEntry.val || !rolesEntry.val.map) return {};

  const rolesMap = rolesEntry.val.map.reduce((acc, entry) => {
    if (entry.key && entry.key.symbol && entry.val && entry.val.address) {
      acc[entry.key.symbol] = truncateAddress(entry.val.address, isMobile);
    }
    return acc;
  }, {} as Record<string, string | JSX.Element>);

  return rolesMap;
};


// ─────────────────────────────────────────────────────────────
// 🧩 5. Organize All Escrow Data into a Structured Object
// ─────────────────────────────────────────────────────────────
export const organizeEscrowData = (
  escrowData: EscrowMap | null,
  contractId: string,
  isMobile: boolean
) => {
  if (!escrowData) return null;

  const escrowType = detectEscrowType(escrowData);
  const milestones = extractMilestones(escrowData, escrowType);
  const progress = calculateProgress(milestones);
  const roles = extractRoles(escrowData, isMobile);

  let totalAmount = extractValue(escrowData, "amount", isMobile);

  // Sum milestone amounts in multi-release escrows
if (escrowType === "multi-release") {
  const sum = milestones.reduce((acc, m) => {
    if (m.amount && typeof m.amount === "string") {
      const num = parseFloat(m.amount.replace(/[^\d.]/g, ""));
      if (!isNaN(num)) acc += num;
    }
    return acc;
  }, 0);
  if (sum > 0) totalAmount = `${sum.toFixed(2)} units`; // Optional: swap with assetCode
}


  return {
    title: extractValue(escrowData, "title", isMobile),
    description: extractValue(escrowData, "description", isMobile),
    properties: {
      escrow_id: contractId,
      amount: totalAmount,
      balance: extractValue(escrowData, "balance", isMobile) || totalAmount,
      platform_fee: extractValue(escrowData, "platform_fee", isMobile),
      engagement_id: extractValue(escrowData, "engagement_id", isMobile),
      trustline: extractValue(escrowData, "trustline", isMobile),
    },
    roles,
    flags: {
      dispute_flag: extractValue(escrowData, "dispute_flag", isMobile),
      release_flag: extractValue(escrowData, "release_flag", isMobile),
      resolved_flag: extractValue(escrowData, "resolved_flag", isMobile),
    },
    milestones,
    progress,
    escrowType,
  };
};


// ─────────────────────────────────────────────────────────────
// 🧾 6. Organized Escrow Data Type
// ─────────────────────────────────────────────────────────────
export interface OrganizedEscrowData {
  title: string | JSX.Element;
  description: string | JSX.Element;
  properties: {
    [key: string]: string | JSX.Element;
  };
  roles: {
    [key: string]: string | JSX.Element;
  };
  flags: {
    dispute_flag: string | JSX.Element;
    release_flag: string | JSX.Element;
    resolved_flag: string | JSX.Element;
  };
  milestones: any[];
  progress: number;
  escrowType: EscrowType;
}
