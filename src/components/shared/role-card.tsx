import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DetailRow } from "./detail-row"
import { InfoTooltip } from "./info-tooltip"
import RoleIcon from "./role-icon"
import { motion } from "framer-motion"

interface RoleCardProps {
  title: string;
  address: string;
  description: string;
  tooltips: { [key: string]: string };
}

export const RoleCard = ({
  title,
  address,
  description,
  tooltips
}: RoleCardProps) => {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };
  
  return (
    <motion.div variants={cardVariants}>
      <Card className="mb-6 shadow-md hover:shadow-lg hover:border-blue-400 transition-all duration-300 rounded-xl relative group">        
        <CardHeader className="pt-4 pb-2">
          <div className="flex items-center gap-3">
            <motion.div 
              whileHover={{ rotate: 10 }}
              transition={{ duration: 0.2 }}
            >
              <RoleIcon 
                title={title as "Milestone Approver" | "Service Provider" | "Release Signer" | "Dispute Resolver" | "Platform Address" | "Receiver"} 
              />
            </motion.div>
            <CardTitle className="text-base sm:text-lg flex items-center gap-1.5 font-bold text-gray-800">
              {title}
              <InfoTooltip content={description} />
            </CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="pt-2">
          <DetailRow 
            label="Address" 
            value={address} 
            tooltip={tooltips.address || "Blockchain address assigned to this role"} 
            canCopy={true}
            isAddress={true}
          />
        </CardContent>
      </Card>
    </motion.div>
  )
}