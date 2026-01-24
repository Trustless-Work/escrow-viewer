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
    <motion.div variants={cardVariants} whileHover={{ y: -6, scale: 1.01 }} transition={{ type: "spring", stiffness: 300 }}>
      <Card
  className={`mb-6 shadow-md hover:shadow-lg transition-shadow duration-300 rounded-xl relative hover-lift edge-accent
    ${approved ? "border-green-200 dark:border-green-700/50" : "border-amber-200 dark:border-amber-700/50"}`}
>
  <div className={`absolute top-0 left-0 right-0 h-2 rounded-t-xl ${approved ? "bg-green-500" : "bg-amber-500"}`} />
  <CardHeader className="pt-4 pb-2">
    <div className="flex justify-between items-center">
      <CardTitle className="text-base sm:text-lg flex items-center gap-1.5 font-bold text-card-foreground">
        {title || `Milestone ${index + 1}`}
        <InfoTooltip content={tooltips.milestone_title || "Title of the milestone"} />
      </CardTitle>
      <StatusBadge status={approved ? "approved" : status} />
    </div>
  </CardHeader>
  <CardContent>
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
        <span className="font-medium">Description</span>
        <InfoTooltip
          content={tooltips.milestone_description || "Details of the milestone's deliverable"}
        />
      </div>
      <p className="text-card-foreground text-base">{description}</p>

      {amount && (
        <div className="flex items-center gap-2 text-sm mt-2">
          <span className="font-medium">Amount:</span>
          <span className="text-primary">{amount}</span>
        </div>
      )}

      {(release_flag !== undefined || dispute_flag !== undefined || resolved_flag !== undefined) && (
        <div className="flex flex-wrap gap-2 mt-2 text-xs">
          {release_flag !== undefined && (
            <span className={`px-2 py-0.5 rounded ${release_flag ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
              Release: {release_flag ? "Yes" : "No"}
            </span>
          )}
          {dispute_flag !== undefined && (
            <span className={`px-2 py-0.5 rounded ${dispute_flag ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
              Dispute: {dispute_flag ? "Yes" : "No"}
            </span>
          )}
          {resolved_flag !== undefined && (
            <span className={`px-2 py-0.5 rounded ${resolved_flag ? "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300" : "bg-muted text-muted-foreground"}`}>
              Resolved: {resolved_flag ? "Yes" : "No"}
            </span>
          )}
        </div>
      )}

      {(signer || approver) && (
        <div className="flex flex-col gap-1 mt-2 text-xs text-muted-foreground">
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