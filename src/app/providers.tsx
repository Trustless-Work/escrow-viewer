// app/providers.tsx
"use client";

import { ReactNode, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Blocks providers (names/paths from the installation guide)
import { TrustlessWorkProvider } from "@/components/tw-blocks/providers/TrustlessWork";
import { WalletProvider } from "@/components/tw-blocks/wallet-kit/WalletProvider";
import { EscrowProvider } from "@/components/tw-blocks/providers/EscrowProvider";
import { EscrowDialogsProvider } from "@/components/tw-blocks/providers/EscrowDialogsProvider";


export function AppProviders({ children }: { children: ReactNode }) {
  const [qc] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={qc}>
      <TrustlessWorkProvider>
        <WalletProvider>
          <EscrowProvider>
            <EscrowDialogsProvider>
              {children}
            </EscrowDialogsProvider>
          </EscrowProvider>
        </WalletProvider>
      </TrustlessWorkProvider>
    </QueryClientProvider>
  );
}
