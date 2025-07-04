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

export function NetworkToggle({ className }: NetworkToggleProps) {
  const { currentNetwork, setNetwork } = useNetwork();
  const networks: { value: NetworkType; label: string }[] = [
    { value: "testnet", label: "Testnet" },
    { value: "mainnet", label: "Mainnet" },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`flex items-center gap-2 ${className}`}
        >
          {networks.find((n) => n.value === currentNetwork)?.label}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32">
        {networks.map((network) => (
          <DropdownMenuItem
            key={network.value}
            onClick={() => setNetwork(network.value)}
            className="flex items-center gap-2 cursor-pointer"
          >
            {currentNetwork === network.value && (
              <Check className="h-4 w-4 text-blue-600" />
            )}
            <span>{network.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 