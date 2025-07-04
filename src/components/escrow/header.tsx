import { motion } from "framer-motion"
import { fadeIn } from "@/utils/animations/animation-variants"
import { NetworkToggle } from "../shared/network-toggle"

export const Header = () => {
  return (
    <motion.div 
      className="mb-10 flex flex-col-reverse items-center gap-6 md:flex-row md:justify-between md:items-end text-center md:text-left"
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      <div className="flex flex-col w-full md:w-auto">
        <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-2 md:mb-4">
          Escrow Data <span className="text-blue-600">Viewer</span>
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto md:mx-0 text-lg">
          View detailed information about any escrow contract on the Stellar
          blockchain.
        </p>
      </div>
      <div className="w-full flex justify-center md:justify-end md:w-auto">
        <NetworkToggle />
      </div>
    </motion.div>
  )
}