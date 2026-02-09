import { motion } from "framer-motion"
import { Search, ChevronRight, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cardVariants } from "@/utils/animations/animation-variants"
import { getStellarLabUrl } from "@/lib/network-config"
import type { NetworkType } from "@/lib/network-config"
import type { OrganizedEscrowData } from "@/mappers/escrow-mapper"
import type { EscrowMap } from "@/utils/ledgerkeycontract"

interface SearchCardProps {
  contractId: string;
  setContractId: (id: string) => void;
  loading: boolean;
  isSearchFocused: boolean;
  setIsSearchFocused: (focused: boolean) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  fetchEscrowData: () => Promise<void>;
  handleUseExample: () => void;
  raw?: EscrowMap | null;
  organized?: OrganizedEscrowData | null;
  initialEscrowId?: string;
  currentNetwork?: NetworkType;
  setShowOnlyTransactions?: (show: boolean) => void;
}

export const SearchCard = ({
  contractId,
  setContractId,
  loading,
  isSearchFocused,
  setIsSearchFocused,
  handleKeyDown,
  fetchEscrowData,
  handleUseExample,
  raw,
  organized,
  initialEscrowId,
  currentNetwork = "testnet",
  setShowOnlyTransactions,
}: SearchCardProps) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={cardVariants}
    >
      <Card className={`mx-auto mb-10 border overflow-hidden ${isSearchFocused ? 'border-primary/50 shadow-lg shadow-primary/10' : 'border-primary/20 shadow-md'} rounded-xl transition-all duration-300 edge-accent`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Search className="h-5 w-5 text-primary" />
            Contract Lookup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {raw && (
            <div className="flex flex-col sm:flex-row gap-2 p-3 rounded-lg">
              <Button
                onClick={() => setShowOnlyTransactions?.(true)}
                aria-label="View Transaction History"
                className="flex-1 min-w-0 inline-flex justify-center items-center gap-2 rounded-lg transition-all duration-200 hover:shadow-sm"
              >
                <ChevronRight className="h-4 w-4 opacity-80" />
                Transaction History
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const escrowIdFromData = organized?.properties?.escrow_id as string | undefined;
                  const idToUse =
                    (escrowIdFromData?.trim()) ||
                    (contractId?.trim()) ||
                    (initialEscrowId?.trim());

                  if (!idToUse) {
                    alert('Error: Contract ID is required to open in Stellar Lab. Please ensure an escrow contract is loaded.');
                    return;
                  }
                  try {
                    window.open(getStellarLabUrl(currentNetwork, idToUse), "_blank");
                  } catch (error) {
                    alert(`Error opening Stellar Lab: ${error instanceof Error ? error.message : 'Unknown error'}`);
                  }
                }}
                className="flex-1 min-w-0 inline-flex justify-center items-center gap-2 rounded-lg border-primary/30 hover:bg-primary/5 hover:border-primary/50"
                title="Open contract in Stellar Lab"
              >
                <ExternalLink className="h-4 w-4 shrink-0" />
                <span className="truncate">Open in Stellar Lab</span>
              </Button>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-grow">
              <Input
                type="text"
                placeholder="Enter escrow contract ID"
                value={contractId}
                onChange={(e) => setContractId(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                disabled={loading}
                className="pr-10 border-primary/30 focus:ring-2 focus:ring-primary/50 transition-all duration-200"
              />
            </div>
            <Button
              onClick={fetchEscrowData}
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>Fetching...</span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span>View Details</span>
                  <ChevronRight className="h-4 w-4" />
                </div>
              )}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground pt-0">
          <div className="flex items-center">
            <span>Example ID:</span>
            <Button
              variant="link"
              size="sm"
              className="text-xs text-primary p-0 pl-1 h-auto"
              onClick={handleUseExample}
            >
              Click to use example
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  )
}