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
  amount?: string;
  release_flag?: boolean;
  dispute_flag?: boolean;
  resolved_flag?: boolean;
  signer?: string;
  approver?: string;
}

export const MilestoneCard = ({
  index,
  title,
  description,
  status,
  approved,
  tooltips,
  amount,
  release_flag,
  dispute_flag,
  resolved_flag,
  signer,
  approver,
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
            {amount && (
              <div className="flex items-center gap-2 text-sm mt-2">
                <span className="font-medium">Amount:</span>
                <span className="text-blue-700">{amount}</span>
              </div>
            )}
            {(release_flag !== undefined || dispute_flag !== undefined || resolved_flag !== undefined) && (
              <div className="flex flex-wrap gap-2 mt-2">
                {release_flag !== undefined && (
                  <span className={`px-2 py-0.5 rounded text-xs ${release_flag ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>Release: {release_flag ? "Yes" : "No"}</span>
                )}
                {dispute_flag !== undefined && (
                  <span className={`px-2 py-0.5 rounded text-xs ${dispute_flag ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"}`}>Dispute: {dispute_flag ? "Yes" : "No"}</span>
                )}
                {resolved_flag !== undefined && (
                  <span className={`px-2 py-0.5 rounded text-xs ${resolved_flag ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>Resolved: {resolved_flag ? "Yes" : "No"}</span>
                )}
              </div>
            )}
            {(signer || approver) && (
              <div className="flex flex-col gap-1 mt-2 text-xs text-gray-700">
                {signer && <span><span className="font-medium">Signer:</span> {signer}</span>}
                {approver && <span><span className="font-medium">Approver:</span> {approver}</span>}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}