import { motion, AnimatePresence } from "framer-motion"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorDisplayProps {
  error: string | null
  onSwitchNetwork?: () => void
  switchNetworkLabel?: string
}

export const ErrorDisplay = ({ error, onSwitchNetwork, switchNetworkLabel }: ErrorDisplayProps) => {
  const isContractNotFound = error?.includes("Contract not found") && error?.includes("Try switching to")

  return (
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="max-w-2xl mx-auto mb-6 p-4 bg-red-50 text-red-800 rounded-md shadow-sm border border-red-100"
        >
          <div className="flex items-start gap-2">
            <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm">{error}</p>
              {isContractNotFound && onSwitchNetwork && switchNetworkLabel && (
                <div className="mt-3">
                  <Button
                    onClick={onSwitchNetwork}
                    size="sm"
                    variant="outline"
                    className="bg-white hover:bg-gray-50 border-red-300 text-red-700 hover:text-red-800"
                  >
                    <RefreshCw size={14} className="mr-1" />
                    {switchNetworkLabel}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}