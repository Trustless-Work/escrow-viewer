"use client";

import { motion } from "framer-motion";
import { fadeIn } from "@/utils/animations/animation-variants";
import { NetworkToggle } from "../shared/network-toggle";

export const Header = () => {
  return (
    <motion.div
      className="mb-8 flex flex-col-reverse items-center gap-6 md:flex-row md:items-end md:justify-between text-center md:text-left"
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      <div className="flex w-full flex-col md:w-auto">
        <h1 className="font-[var(--font-display)] text-3xl md:text-5xl tracking-tight text-[var(--lux-text)] mb-2 md:mb-3">
          Investor <span className="text-[var(--lux-gold)]">Page</span>
        </h1>
        <p className="mx-auto max-w-2xl text-base md:text-lg text-[var(--lux-muted)] md:mx-0">
          Access information on the investment escrow contract on the Stellar blockchain.
        </p>
      </div>

      <div className="flex w-full justify-center md:w-auto md:justify-end">
        <div className="rounded-xl border border-[var(--lux-line)] bg-[var(--lux-panel)]/70 px-2 py-1">
          <NetworkToggle />
        </div>
      </div>
    </motion.div>
  );
};
