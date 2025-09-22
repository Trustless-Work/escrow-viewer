// src/utils/explorer.ts
export function contractExplorerUrl(contractId: string, network?: string) {
  // Allow override via env if you prefer another explorer
  const base = process.env.NEXT_PUBLIC_EXPLORER_BASE?.replace(/\/$/, "");
  if (base) return `${base}/contract/${contractId}`;

  // Default to stellar.expert
  const isTest =
    (network || "").toLowerCase().includes("test") ||
    (network || "").toLowerCase() === "testnet";

  const root = isTest
    ? "https://stellar.expert/explorer/testnet"
    : "https://stellar.expert/explorer/public";

  return `${root}/contract/${contractId}`;
}
