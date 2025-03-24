import { motion, AnimatePresence } from "framer-motion"
import { AlertCircle } from "lucide-react"

interface ErrorDisplayProps {
  error: string | null
}

export const ErrorDisplay = ({ error }: ErrorDisplayProps) => {
  return (
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="max-w-2xl mx-auto mb-6 p-4 bg-red-50 text-red-800 rounded-md flex items-center gap-2 shadow-sm border border-red-100"
        >
          <AlertCircle size={18} />
          <p>{error}</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}