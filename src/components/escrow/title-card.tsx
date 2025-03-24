import { motion } from "framer-motion"
import { DollarSign, CheckSquare } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ProgressBar } from "@/components/shared/progress-bar"
import { cardVariants } from "@/utils/animations/animation-variants"

interface TitleCardProps {
  title: string;
  description: string;
  progress: number;
}

export const TitleCard = ({ 
  title, 
  description, 
  progress 
}: TitleCardProps) => {
  return (
    <motion.div variants={cardVariants}>
      <Card className="mb-6 border-blue-100 shadow-md hover:shadow-lg transition-shadow duration-300 rounded-xl group relative">
        {/* Fixed gradient line that spans the full width */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-blue-500 rounded-t-xl" />
        <CardHeader className="pt-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex items-center gap-3">
              <DollarSign className="text-blue-500 h-6 w-6" />
              <CardTitle className="text-xl sm:text-2xl text-blue-600 font-bold">
                {title}
              </CardTitle>
            </div>
            <Badge
              variant="outline"
              className="bg-gray-50 text-gray-700 py-1 px-3 font-medium border-gray-200"
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
          <p className="text-gray-600 mt-3 text-base">
            {description}
          </p>
        </CardHeader>
        <CardContent className="pt-2">
          <ProgressBar
            value={progress}
            label="Milestone Progress"
          />
        </CardContent>
      </Card>
    </motion.div>
  )
}