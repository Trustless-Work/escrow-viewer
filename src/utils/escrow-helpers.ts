/* eslint-disable @typescript-eslint/no-explicit-any */
import type { JSX } from "react";
import { truncateAddress, calculateProgress } from "../lib/escrow-constants";
import type { EscrowMap, EscrowValue } from "@/utils/ledgerkeycontract";

export type EscrowType = "single-release" | "multi-release";

export function detectEscrowType(data: EscrowMap | null): EscrowType {
  if (!data) return "single-release";
  const milestonesEntry = data.find((entry) => entry.key.symbol === "milestones");
  if (!milestonesEntry || !milestonesEntry.val || !milestonesEntry.val.vec) return "single-release";
  const milestones = milestonesEntry.val.vec;
  // Multi-release if any milestone has its own amount or flags
  if (milestones.some(m => m.map && Array.isArray(m.map) && m.map.some(e => e.key.symbol === "amount" || e.key.symbol.endsWith("flag")))) {
    return "multi-release";
  }
  return "single-release";
}

// Extract specific values from escrow data
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

  if (val.bool !== undefined) {
    return val.bool ? "True" : "False";
  }

  if (val.string) {
    return val.string;
  }

  if (val.address) {
    return isAddress ? truncateAddress(val.address, isMobile) : val.address;
  }

  if (val.i128) {
    const stroops =
      BigInt(val.i128.lo) +
      (val.i128.hi ? BigInt(val.i128.hi) * BigInt(2 ** 32) : BigInt(0));

    if (key === "platform_fee") {
      const percentage = Number(stroops) / 100; // Assuming fee is stored as basis points
      return `${percentage.toFixed(2)}%`;
    }

    const xlm = Number(stroops) / 10_000_000;
    return `${xlm.toFixed(2)} XLM`;
  }

  return "N/A";
};

// Extract milestones from escrow data
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export const extractMilestones = (data: EscrowMap | null, escrowType: EscrowType): any[] => {
  if (!data) return [];

  const milestonesEntry = data.find(
    (entry) => entry.key.symbol === "milestones"
  );
  if (!milestonesEntry || !milestonesEntry.val || !milestonesEntry.val.vec)
    return [];

  const milestones = milestonesEntry.val.vec
    .map((item, index) => {
      if (!item.map || !Array.isArray(item.map)) return null;

      const milestoneMap = item.map.reduce((acc, entry) => {
        // biome-ignore lint/complexity/useOptionalChain: <explanation>
        if (entry.key && entry.key.symbol) {
          acc[entry.key.symbol] = entry.val;
        }
        return acc;
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      }, {} as Record<string, any>);

      if (escrowType === "multi-release") {
        return {
          id: index,
          title: milestoneMap.title?.string || `Milestone ${index + 1}`,
          description:
            milestoneMap.description?.string || `Milestone ${index + 1}`,
          status: milestoneMap.status?.string || "pending",
          approved: milestoneMap.approved_flag?.bool || false,
          amount: milestoneMap.amount ? extractValue([ { key: { symbol: "amount" }, val: milestoneMap.amount } ], "amount", false) : undefined,
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
          description:
            milestoneMap.description?.string || `Milestone ${index + 1}`,
          status: milestoneMap.status?.string || "pending",
          approved: milestoneMap.approved_flag?.bool || false,
        };
      }
    })
    .filter(Boolean);

  return milestones;
};

// Extract roles from escrow data
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

//? Organize escrow data into sections
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
  if (escrowType === "multi-release") {
    // Sum milestone amounts if available
    const sum = milestones.reduce((acc, m) => {
      if (m.amount && typeof m.amount === "string" && m.amount.endsWith("XLM")) {
        const num = parseFloat(m.amount.replace(" XLM", ""));
        if (!isNaN(num)) acc += num;
      }
      return acc;
    }, 0);
    if (sum > 0) totalAmount = `${sum.toFixed(2)} XLM`;
  }

  return {
    title: extractValue(escrowData, "title", isMobile),
    description: extractValue(escrowData, "description", isMobile),
    properties: {
      escrow_id: contractId,
      amount: totalAmount,
      balance:
        extractValue(escrowData, "balance", isMobile) ||
        totalAmount, // If balance not found, use amount
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

// Type definitions for organized escrow data
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
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  milestones: any[];
  progress: number;
  escrowType: EscrowType;
}
