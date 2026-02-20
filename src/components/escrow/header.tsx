import { motion } from "framer-motion";
import { fadeIn } from "@/utils/animations/animation-variants";
// Network toggle moved to the Navbar

export const Header = () => {
  return (
    <motion.div
      className="mb-10 flex flex-col items-center gap-6 text-center"
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      <div className="flex flex-col w-full items-center">
        <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-2 md:mb-4">
          Escrow Data <span className="text-primary">Viewer</span>
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-center text-lg">
          View detailed information about any escrow contract on the Stellar
          blockchain.
        </p>
      </div>
    </motion.div>
  );
};
