import { motion, AnimatePresence } from "framer-motion"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorDisplayProps {
  error: string | null
  onSwitchNetwork?: (network: 'testnet' | 'mainnet') => void
  onRetry?: () => void
}

export const ErrorDisplay = ({ error, onSwitchNetwork, onRetry }: ErrorDisplayProps) => {
  if (!error) return null;

  const parts = error.split('•').map(part => part.trim()).filter(part => part);

  // Check if error suggests switching networks
  const switchSuggestion = parts.find(part => part.includes('Try switching to'));
  let targetNetwork: 'testnet' | 'mainnet' | null = null;
  if (switchSuggestion) {
    if (switchSuggestion.includes('mainnet')) {
      targetNetwork = 'mainnet';
    } else if (switchSuggestion.includes('testnet')) {
      targetNetwork = 'testnet';
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="max-w-2xl mx-auto mb-6 p-4 bg-red-50 text-red-800 rounded-md shadow-sm border border-red-100"
      >
        <div className="flex items-start gap-2">
          <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            {parts.length > 1 ? (
              <div>
                <p className="font-medium mb-2">{parts[0]}</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {parts.slice(1).map((line, index) => (
                    <li key={index}>{line}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p>{error}</p>
            )}
            {/* Action buttons */}
            <div className="flex gap-2 mt-3">
              {targetNetwork && onSwitchNetwork && (
                <Button
                  onClick={() => onSwitchNetwork(targetNetwork!)}
                  size="sm"
                  variant="outline"
                  className="bg-white hover:bg-gray-50 border-red-200 text-red-700"
                >
                  Switch to {targetNetwork === 'testnet' ? 'Testnet' : 'Mainnet'}
                </Button>
              )}
              {onRetry && (
                <Button
                  onClick={onRetry}
                  size="sm"
                  variant="outline"
                  className="bg-white hover:bg-gray-50 border-red-200 text-red-700"
                >
                  <RefreshCw size={14} className="mr-1" />
                  Retry
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}