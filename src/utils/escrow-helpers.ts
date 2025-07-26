import type { JSX } from "react";
import { truncateAddress, calculateProgress } from "../lib/escrow-constants";
import type { EscrowMap, EscrowValue } from "@/utils/ledgerkeycontract";

export type EscrowType = "single-release" | "multi-release";

export function detectEscrowType(data: EscrowMap | null): EscrowType {
  if (!data) return "single-release";
  const milestonesEntry = data.find((entry) => entry.key.symbol === "milestones");
  if (!milestonesEntry?.val?.vec) return "single-release";

  const milestones = milestonesEntry.val.vec;
  if (
    milestones.some(
      (m) =>
        m.map &&
        Array.isArray(m.map) &&
        m.map.some(
          (e) =>
            e.key.symbol === "amount" ||
            (typeof e.key.symbol === "string" && e.key.symbol.endsWith("flag"))
        )
    )
  ) {
    return "multi-release";
  }
  return "single-release";
}

export const extractValue = (
  data: EscrowMap | null,
  key: string,
  isMobile: boolean,
  isAddress = false
): string | { label: string; url: string } => {
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

  // Trustline → return link metadata
  if (val.map && key === "trustline") {
    const address = val.map.find((e) => e.key.symbol === "address")?.val?.address;
    if (typeof address === "string") {
      const network = isMobile ? "testnet" : "public";
      const url = `https://stellar.expert/explorer/${network}/account/${address}`;
      const label = typeof truncateAddress(address, isMobile) === "string"
        ? truncateAddress(address, isMobile)
        : address;

      return { label, url };
    }
    return "N/A";
  }

  // i128 Amounts
  if (
    val.i128 &&
    typeof val.i128.lo === "number" &&
    (typeof val.i128.hi === "number" || typeof val.i128.hi === "undefined")
  ) {
    const lo = BigInt(val.i128.lo);
    const hi = val.i128.hi ? BigInt(val.i128.hi) * BigInt(2 ** 32) : BigInt(0);
    const stroops = lo + hi;

    if (key === "platform_fee") {
      return `${(Number(stroops) / 100).toFixed(2)}%`;
    }

    let divisor = 1;
    const trustlineEntry = data.find((e) => e.key.symbol === "trustline");
    const decimalsEntry = trustlineEntry?.val?.map?.find((m) => m.key.symbol === "decimals");
    const decimals = decimalsEntry?.val?.u32;

    if (typeof decimals === "number" && decimals > 0) {
      divisor = decimals;
    }

    const units = Number(stroops) / divisor;
    return units.toFixed(2);
  }

  return "N/A";
};



// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export const extractMilestones = (data: EscrowMap | null, escrowType: EscrowType): any[] => {
  if (!data) return [];

  const milestonesEntry = data.find((entry) => entry.key.symbol === "milestones");
  if (!milestonesEntry?.val?.vec) return [];

  const milestones = milestonesEntry.val.vec
    .map((item, index) => {
      if (!item.map || !Array.isArray(item.map)) return null;

      const milestoneMap = item.map.reduce((acc, entry) => {
        if (entry.key?.symbol) {
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
    })
    .filter(Boolean);

  return milestones;
};

export const extractRoles = (
  data: EscrowMap | null,
  isMobile: boolean
): Record<string, string | JSX.Element> => {
  if (!data) return {};

  const rolesEntry = data.find((entry) => entry.key.symbol === "roles");
  if (!rolesEntry?.val?.map) return {};

  return rolesEntry.val.map.reduce((acc, entry) => {
    if (entry.key?.symbol && entry.val?.address) {
      acc[entry.key.symbol] = truncateAddress(entry.val.address, isMobile);
    }
    return acc;
  }, {} as Record<string, string | JSX.Element>);
};

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
    const sum = milestones.reduce((acc, m) => {
      if (m.amount && typeof m.amount === "string" && !isNaN(parseFloat(m.amount))) {
        acc += parseFloat(m.amount);
      }
      return acc;
    }, 0);
    if (sum > 0) totalAmount = `${sum.toFixed(2)} units`;
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
