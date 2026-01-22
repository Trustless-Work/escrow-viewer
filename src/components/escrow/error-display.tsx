import { motion, AnimatePresence } from "framer-motion"
import { AlertCircle } from "lucide-react"

interface ErrorDisplayProps {
  error: string | null
}

export const ErrorDisplay = ({ error }: ErrorDisplayProps) => {
  if (!error) return null;

  const parts = error.split('•').map(part => part.trim()).filter(part => part);

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
          <div>
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
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}