import { motion } from "framer-motion";
import { DollarSign, CheckSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProgressBar } from "@/components/shared/progress-bar";
import { cardVariants } from "@/utils/animations/animation-variants";
import type { EscrowType } from "@/mappers/escrow-mapper";

interface TitleCardProps {
  title: string;
  description: string;
  progress: number;
  escrowType?: EscrowType;
}

export const TitleCard = ({
  title,
  description,
  progress,
  escrowType,
}: TitleCardProps) => {
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ scale: 1.01 }}
      className="transform-gpu"
    >
      <Card className="mb-6 border border-primary/20 shadow-md hover:shadow-lg transition-shadow duration-300 rounded-xl group relative hover-lift edge-accent">
        {/* Top gradient accent bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-primary rounded-t-xl" />

        <CardHeader className="pt-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex items-center gap-3">
              <DollarSign className="h-6 w-6 text-primary" />
              <CardTitle className="text-xl sm:text-2xl text-card-foreground font-bold flex items-center gap-2">
                {title}
                {escrowType && (
                  <Badge
                    variant={escrowType === "multi-release" ? "default" : "secondary"}
                    className={
                      escrowType === "multi-release"
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border border-green-200 dark:border-green-800"
                    }
                  >
                    {escrowType === "multi-release" ? "Multi-Release" : "Single-Release"}
                  </Badge>
                )}
              </CardTitle>
            </div>

            <Badge
              variant="outline"
              className="bg-muted text-muted-foreground py-1 px-3 font-medium border border-border"
            >
              {progress === 100 ? (
                <span className="flex items-center">
                  <CheckSquare className="h-3 w-3 mr-1" />
                  Completed
                </span>
              ) : (
                "In Progress"
              )}
            </Badge>
          </div>

          {/* ✅ Description with theme-aware color */}
          <p className="text-muted-foreground mt-3 text-base">{description}</p>
        </CardHeader>

        <CardContent className="pt-2">
          <ProgressBar value={progress} label="Milestone Progress" />
        </CardContent>
      </Card>
    </motion.div>
  );
};
