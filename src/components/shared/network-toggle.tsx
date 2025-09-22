"use client";

import { Button } from "@/components/ui/button";
import { useNetwork } from "@/contexts/NetworkContext";
import { NetworkType } from "@/lib/network-config";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Check, ChevronDown } from "lucide-react";

interface NetworkToggleProps {
  className?: string;
}

const networks: { value: NetworkType; label: string }[] = [
  { value: "testnet", label: "Testnet" },
  { value: "mainnet", label: "Mainnet" },
];

export function NetworkToggle({ className }: NetworkToggleProps) {
  const { currentNetwork, setNetwork } = useNetwork();

  const label = networks.find((n) => n.value === currentNetwork)?.label ?? "Network";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={[
            "flex items-center gap-2 rounded-xl",
            "border border-[var(--lux-line)] bg-[var(--lux-panel)]/80",
            "text-[var(--lux-text)] hover:bg-[var(--lux-elev)]/70",
            "hover:border-[var(--lux-gold)]/30 data-[state=open]:border-[var(--lux-gold)]/40",
            "px-3 py-2",
            className || "",
          ].join(" ")}
          aria-label="Select network"
        >
          <span className="text-sm">{label}</span>
          <ChevronDown className="h-4 w-4 text-[var(--lux-muted)]" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-40 rounded-xl border border-[var(--lux-line)] bg-[var(--lux-elev)] p-1 shadow-[0_14px_36px_-12px_rgba(0,0,0,0.45)]"
      >
        {networks.map((network) => {
          const isActive = currentNetwork === network.value;
          return (
            <DropdownMenuItem
              key={network.value}
              onClick={() => setNetwork(network.value)}
              className={[
                "flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2",
                "text-[var(--lux-text)] focus:bg-[var(--lux-panel)] focus:text-[var(--lux-text)]",
                "hover:bg-[var(--lux-panel)]",
              ].join(" ")}
            >
              {isActive ? (
                <Check className="h-4 w-4 text-[var(--lux-gold)]" />
              ) : (
                <span className="h-4 w-4" />
              )}
              <span className={isActive ? "text-[var(--lux-gold-2)]" : ""}>
                {network.label}
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
