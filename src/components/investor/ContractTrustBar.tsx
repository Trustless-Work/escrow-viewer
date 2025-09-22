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
    <div className="mt-4 mb-6 rounded-xl border border-[var(--lux-line)] bg-[var(--lux-panel)] px-4 py-3 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.35)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 text-sm text-[var(--lux-text)]">
            <Shield className="h-4 w-4 text-[var(--lux-gold)]" />
            <span className="font-medium">Smart Contract</span>
          </span>

          <span className="hidden h-3 w-px bg-[var(--lux-line)] md:inline-block" />

          <span className="text-sm text-[var(--lux-muted)]">
            Escrow ID:{" "}
            <span className="font-mono text-[var(--lux-text)]">{shortId}</span>
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={copy}
            className="h-8 px-2 text-[var(--lux-muted)] hover:bg-[var(--lux-elev)]"
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
          <span className="inline-flex items-center rounded-full border border-[var(--lux-line)] bg-[var(--lux-elev)]/60 px-3 py-1 text-xs font-medium text-[var(--lux-muted)]">
            {networkLabel}
          </span>

          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-md border border-[var(--lux-line)] bg-[var(--lux-elev)] px-3 py-1.5 text-sm font-medium text-[var(--lux-text)] hover:bg-[var(--lux-elev)]/70"
          >
            View on Explorer <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
