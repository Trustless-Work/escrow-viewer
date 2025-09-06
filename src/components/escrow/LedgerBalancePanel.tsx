// src/components/escrow/LedgerBalancePanel.tsx
import { motion } from "framer-motion";

export function LedgerBalancePanel({
  balance,
  decimals,
  mismatch,
}: {
  balance: string;
  decimals?: number | null;
  mismatch?: boolean;
}) {
  return (
    <motion.div
      className="mt-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
          <div>
            <div className="text-sm text-gray-600">Ledger balance (from token contract)</div>
            <div className="text-xl font-semibold text-gray-900">
              {balance}
              {typeof decimals === "number" ? (
                <span className="ml-1 text-gray-500 text-sm">(d={decimals})</span>
              ) : null}
            </div>
          </div>
        </div>

        {mismatch && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            <span className="text-xs font-semibold">⚠️ Mismatch</span>
            <span className="text-xs">Stored contract balance differs</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
