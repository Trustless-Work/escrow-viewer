import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "./status-badge"
import { InfoTooltip } from "./info-tooltip"
import { motion } from "framer-motion"

interface MilestoneProps {
  index: number;
  title?: string;
  description: string;
  status: string;
  approved: boolean;
  tooltips: { [key: string]: string };
}

export const MilestoneCard = ({
  index,
  title,
  description,
  status,
  approved,
  tooltips,
}: MilestoneProps) => {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <motion.div variants={cardVariants}>
      <Card
        className={`mb-6 shadow-md hover:shadow-lg transition-shadow duration-300 rounded-xl relative
          ${approved ? "border-green-100" : "border-amber-100"}`}
      >
        {/* Fixed top line that respects border radius */}
        <div className={`absolute top-0 left-0 right-0 h-2 rounded-t-xl ${approved ? "bg-green-500" : "bg-amber-500"}`} />
        <CardHeader className="pt-4 pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base sm:text-lg flex items-center gap-1.5 font-bold text-gray-800">
              {title || `Milestone ${index + 1}`}
              <InfoTooltip
                content={tooltips.milestone_title || "Title of the milestone"}
              />
            </CardTitle>
            <StatusBadge status={approved ? "approved" : status} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-1">
              <span className="font-medium">Description</span>
              <InfoTooltip
                content={
                  tooltips.milestone_description ||
                  "Details of the milestone's deliverable"
                }
              />
            </div>
            <p className="text-gray-800 text-base">{description}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}