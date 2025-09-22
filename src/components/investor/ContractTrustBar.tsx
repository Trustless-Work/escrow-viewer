"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink, Shield } from "lucide-react";
import { contractExplorerUrl } from "@/utils/explorer";
import { Button } from "@/components/ui/button";

type Props = {
  contractId: string;
  networkLabel: string; // e.g., "Testnet" | "Mainnet"
};

export default function ContractTrustBar({ contractId, networkLabel }: Props) {
  const [copied, setCopied] = useState(false);
  const url = contractExplorerUrl(contractId, networkLabel);

  const shortId =
    contractId && contractId.length > 12
      ? `${contractId.slice(0, 6)}…${contractId.slice(-6)}`
      : contractId;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(contractId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* noop */
    }
  };

  return (
    <div className="mt-4 mb-6 rounded-xl border bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 text-sm text-gray-700">
            <Shield className="h-4 w-4 text-emerald-600" />
            <span className="font-medium">Smart Contract</span>
          </span>

          <span className="hidden h-3 w-px bg-gray-200 md:inline-block" />

          <span className="text-sm text-gray-600">
            Escrow ID: <span className="font-mono text-gray-900">{shortId}</span>
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={copy}
            className="h-8 px-2"
            aria-label="Copy escrow id"
          >
            {copied ? (
              <>
                <Check className="mr-1 h-4 w-4" /> Copied
              </>
            ) : (
              <>
                <Copy className="mr-1 h-4 w-4" /> Copy
              </>
            )}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full border bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700">
            {networkLabel}
          </span>

          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-md border bg-white px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
          >
            View on Explorer <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
