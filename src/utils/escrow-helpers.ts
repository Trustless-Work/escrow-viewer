/* eslint-disable @typescript-eslint/no-explicit-any */
import type { JSX } from 'react';
import { truncateAddress, calculateProgress } from '../lib/escrow-constants';
import type { EscrowMap, EscrowValue } from '@/utils/ledgerkeycontract';

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
    const stroops = BigInt(val.i128.lo) + (val.i128.hi ? BigInt(val.i128.hi) * BigInt(2 ** 32) : BigInt(0));
    
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
export const extractMilestones = (data: EscrowMap | null): any[] => {
  if (!data) return [];

  const milestonesEntry = data.find((entry) => entry.key.symbol === "milestones");
  if (!milestonesEntry || !milestonesEntry.val || !milestonesEntry.val.vec) return [];
  
  const milestones = milestonesEntry.val.vec.map((item, index) => {
    if (!item.map || !Array.isArray(item.map)) return null;
    
    const milestoneMap = item.map.reduce((acc, entry) => {
      // biome-ignore lint/complexity/useOptionalChain: <explanation>
      if (entry.key && entry.key.symbol) {
        acc[entry.key.symbol] = entry.val;
      }
      return acc;
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    }, {} as Record<string, any>);
    
    return {
      id: index,
      title: milestoneMap.title?.string || `Milestone ${index + 1}`,
      description: milestoneMap.description?.string || `Milestone ${index + 1}`,
      status: milestoneMap.status?.string || "pending",
      approved: milestoneMap.approved_flag?.bool || false
    };
  }).filter(Boolean);
  
  return milestones;
};

//? Organize escrow data into sections
export const organizeEscrowData = (escrowData: EscrowMap | null, contractId: string, isMobile: boolean) => {
  if (!escrowData) return null;
  
  const milestones = extractMilestones(escrowData);
  const progress = calculateProgress(milestones);
  return {
    title: extractValue(escrowData, "title", isMobile),
    description: extractValue(escrowData, "description", isMobile),
    properties: {
      escrow_id: contractId,
      amount: extractValue(escrowData, "amount", isMobile),
      balance: extractValue(escrowData, "balance", isMobile) || extractValue(escrowData, "amount", isMobile), // If balance not found, use amount
      platform_fee: extractValue(escrowData, "platform_fee", isMobile),
      engagement_id: extractValue(escrowData, "engagement_id", isMobile),
      trustline: extractValue(escrowData, "trustline", isMobile),
    },
    roles: {
      approver: extractValue(escrowData, "approver", isMobile, true),
      service_provider: extractValue(escrowData, "service_provider", isMobile, true),
      release_signer: extractValue(escrowData, "release_signer", isMobile, true),
      dispute_resolver: extractValue(escrowData, "dispute_resolver", isMobile, true),
      platform_address: extractValue(escrowData, "platform_address", isMobile, true),
      receiver: extractValue(escrowData, "receiver", isMobile, true),
    },
    flags: {
      dispute_flag: extractValue(escrowData, "dispute_flag", isMobile),
      release_flag: extractValue(escrowData, "release_flag", isMobile),
      resolved_flag: extractValue(escrowData, "resolved_flag", isMobile),
    },
    milestones,
    progress
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
}