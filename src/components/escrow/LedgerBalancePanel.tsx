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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white/80 dark:bg-card backdrop-blur-sm border border-primary/20 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-2 h-8 bg-gradient-to-b from-primary to-accent rounded-full" />
          <div>
            <div className="text-sm text-muted-foreground">
              Ledger balance (from token contract)
            </div>
            <div className="text-xl font-semibold text-foreground">
              {balance}
              {typeof decimals === "number" ? (
                <span className="ml-1 text-muted-foreground text-sm">
                  (d={decimals})
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {mismatch && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
            <span className="text-xs font-semibold">Mismatch</span>
            <span className="text-xs">Stored contract balance differs</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
