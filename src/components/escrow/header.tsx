import { motion } from "framer-motion"
import { fadeIn } from "@/utils/animations/animation-variants"

export const Header = () => {
  return (
    <motion.div 
      className="mb-10 text-center"
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
        Escrow Data <span className="text-blue-600">Viewer</span>
      </h1>
      <p className="text-gray-600 max-w-2xl mx-auto text-lg">
        View detailed information about any escrow contract on the Stellar
        blockchain.
      </p>
    </motion.div>
  )
}