"use client";

import { Inter } from "next/font/google";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { NavbarSimple } from "@/components/Navbar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LoadingLogo } from "@/components/shared/loading-logo";
import { useNetwork } from "@/contexts/NetworkContext";
import { Header } from "@/components/escrow/header";
import { ErrorDisplay } from "@/components/escrow/error-display";
import { useEscrowContext } from "@/components/tw-blocks/providers/EscrowProvider";
import { useRef } from "react";

// ⬇️ New hooks
import { useEscrowData } from "@/hooks/useEscrowData";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { FundEscrowDialog } from "@/components/tw-blocks/escrows/single-multi-release/fund-escrow/dialog/FundEscrow";
import ContractTrustBar from "@/components/investor/ContractTrustBar";
import InvestorHero from "@/components/investor/InvestorHero";
import MilestonesInvestorGrid from "@/components/investor/MilestonesInvestorGrid";
import FAQAccordion from "@/components/investor/FAQAccordion";
import RaiseProgress from "@/components/investor/RaiseProgress";

const inter = Inter({ subsets: ["latin"] });
const TARGET_USDC = 5000; // <- your client’s raise goal
const EscrowDetailsClient: React.FC = () => {
const params = useParams<{ id: string }>();
const initialEscrowId = params?.id as string;
  const { currentNetwork } = useNetwork();
const { setSelectedEscrowId } = useEscrowContext();
const lastPushedIdRef = useRef<string | null>(null);
  // Input / responsive state
  const [contractId] = useState<string>(initialEscrowId);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Escrow data hook (raw + organized)
  const { raw, organized, loading, error} = useEscrowData(
    contractId,
    currentNetwork,
    isMobile
  );
const shortId = `${contractId.slice(0, 6)}…${contractId.slice(-6)}`;

  // Live token balance hook
  const { ledgerBalance, decimals, mismatch } = useTokenBalance(
    contractId,
    raw,
    currentNetwork
  );


// balance display (prefer live)
const balanceNumber = Number(ledgerBalance ?? organized?.properties?.balance ?? 0);
const balanceDisplay = `${Intl.NumberFormat().format(balanceNumber)} USDC`;

// simple network badge
const networkLabel = /test/i.test(currentNetwork) ? "Testnet" : "Mainnet";

  // Check if viewport is mobile
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

// Initial + network-change fetch (escrow + txs) + push id into Blocks context once per id
  useEffect(() => {
    if (!contractId) return;
      if (lastPushedIdRef.current !== contractId) {
        setSelectedEscrowId(contractId);
        lastPushedIdRef.current = contractId;
 }
    // eslint-disable-next-line react-hooks/exhaustive-deps

}, [contractId, currentNetwork, setSelectedEscrowId]);



useEffect(() => {
  if (process.env.NODE_ENV === "production") return;
  console.log("[DBG][EscrowDetails] network:", currentNetwork);
  console.log("[DBG][EscrowDetails] contractId:", contractId);
}, [currentNetwork, contractId]);

useEffect(() => {
  if (process.env.NODE_ENV === "production") return;
  console.log("[DBG][EscrowDetails] raw escrow map:", raw);
}, [raw]);

useEffect(() => {
  if (process.env.NODE_ENV === "production") return;
  console.log("[DBG][EscrowDetails] organized data:", organized);
}, [organized]);

useEffect(() => {
  if (process.env.NODE_ENV === "production") return;
  console.log("[DBG][EscrowDetails] token live balance:", {
    ledgerBalance,
    decimals,
    mismatch,
  });
}, [ledgerBalance, decimals, mismatch]);


  return (
    <TooltipProvider>
      <div className={`min-h-screen bg-transparent ${inter.className}`}>
        <NavbarSimple />

        <main className="container mx-auto px-4 py-6 md:py-10 max-w-7xl">
          {/* Header Section */}
          <Header />

{/* Primary investor hero with CTA + stats */}
{organized ? (
  <InvestorHero
    title={organized.title?.trim() || `Escrow ${shortId}`}
    subtitle={organized.description ?? undefined}
    balanceDisplay={balanceDisplay}
    milestonesCount={organized.milestones?.length ?? 0}
    cta={<FundEscrowDialog />}
  />
) : null}
{organized && (
  <div className="mt-2">
    <RaiseProgress
      raised={Number(ledgerBalance ?? organized.properties.balance ?? 0)}
      target={TARGET_USDC}
      currency="USDC"
      size="lg"
    />
  </div>
)}
{/* Smart-contract trust bar */}
<ContractTrustBar contractId={contractId} networkLabel={networkLabel} />



          {/* Logo display (only on initial screen) */}
          {!raw && !loading && !error && (
            <motion.div
              className="flex justify-center mb-8"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <LoadingLogo loading={false} />
            </motion.div>
          )}

          {/* Error Display */}
          <ErrorDisplay error={error} />


{/* Milestones (investor read-only) */}
{organized && (
  <MilestonesInvestorGrid milestones={organized.milestones} />
)}

{/* FAQ */}
<FAQAccordion />


        </main>
      </div>
    </TooltipProvider>
  );
};

export default EscrowDetailsClient;
