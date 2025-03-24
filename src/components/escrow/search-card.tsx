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
      <Card className={`max-w-2xl mx-auto mb-10 border ${isSearchFocused ? 'border-blue-300 shadow-lg shadow-blue-100' : 'border-blue-100 shadow-md'} rounded-xl transition-all duration-300`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Search className="h-5 w-5 text-blue-500" />
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
                className="pr-10 border-blue-200 focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              />
            </div>
            <Button
              onClick={fetchEscrowData}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 active:scale-95"
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
        <CardFooter className="text-xs text-gray-500 pt-0">
          <div className="flex items-center">
            <span>Example ID:</span>
            <Button
              variant="link"
              size="sm"
              className="text-xs text-blue-600 p-0 pl-1 h-auto"
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