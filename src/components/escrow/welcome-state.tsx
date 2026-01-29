import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { EXAMPLE_CONTRACT_IDS } from "@/lib/escrow-constants"
import type { NetworkType } from "@/lib/network-config"

interface WelcomeStateProps {
  showWelcome: boolean;
  handleUseExample?: () => void;
  network?: NetworkType;
}

export const WelcomeState = ({
  showWelcome,
  handleUseExample,
  network = 'mainnet'
}: WelcomeStateProps) => {
  const useExample = handleUseExample || (() => {});
  const exampleId = EXAMPLE_CONTRACT_IDS[network];

  return (
    <AnimatePresence>
      {showWelcome && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center justify-center py-12"
        >
          <div className="text-center max-w-md">
            <motion.h2 
              className="text-xl font-semibold mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Welcome to Escrow Data Viewer
            </motion.h2>
            <motion.p 
              className="text-muted-foreground mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Enter an escrow contract ID above to view its details,
              milestones, and assigned roles.
            </motion.p>
            <motion.div 
              className="bg-primary/5 dark:bg-primary/10 p-4 rounded-md border border-primary/20 hover:bg-primary/10 dark:hover:bg-primary/20 hover:shadow-md transition-all duration-300"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <p className="text-sm text-foreground">
                Example ID:{" "}
                <Button
                  variant="link"
                  size="sm"
                  className="text-sm text-primary p-0 h-auto"
                  onClick={useExample}
                >
                  {exampleId}
                </Button>
              </p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}