"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useNetwork } from "@/contexts/NetworkContext";
import { NetworkType } from "@/lib/network-config";
import { ChevronDown } from "lucide-react";

interface NetworkToggleProps {
  className?: string;
}

export function NetworkToggle({ className }: NetworkToggleProps) {
  const { currentNetwork, setNetwork } = useNetwork();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const networks: { value: NetworkType; label: string }[] = [
    { value: 'testnet', label: 'Testnet' },
    { value: 'mainnet', label: 'Mainnet' }
  ];

  const handleNetworkSelect = (network: NetworkType) => {
    setNetwork(network);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        {currentNetwork === 'testnet' ? 'Testnet' : 'Mainnet'}
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>
      
      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          {networks.map((network) => (
            <button
              key={network.value}
              onClick={() => handleNetworkSelect(network.value)}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-md last:rounded-b-md ${
                currentNetwork === network.value ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
              }`}
            >
              {network.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 