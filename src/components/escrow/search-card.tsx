import { motion } from "framer-motion"
import { Search, ChevronRight } from "lucide-react"
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

interface SearchCardProps {
  contractId: string;
  setContractId: (id: string) => void;
  loading: boolean;
  isSearchFocused: boolean;
  setIsSearchFocused: (focused: boolean) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  fetchEscrowData: () => Promise<void>;
  handleUseExample: () => void;
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
}: SearchCardProps) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={cardVariants}
    >
      <Card className={`max-w-2xl mx-auto mb-10 border overflow-hidden ${isSearchFocused ? 'border-primary/50 shadow-lg shadow-primary/10' : 'border-primary/20 shadow-md'} rounded-xl transition-all duration-300 edge-accent`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Search className="h-5 w-5 text-primary" />
            Contract Lookup
          </CardTitle>
        </CardHeader>
        <CardContent>
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