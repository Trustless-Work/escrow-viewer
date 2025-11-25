import type { ReactNode } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cardVariants } from "@/utils/animations/animation-variants"
import type { LucideIcon } from "lucide-react"

interface SectionCardProps {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
}

export const SectionCard = ({ 
  title, 
  icon: Icon, 
  children, 
  className = "" 
}: SectionCardProps) => {
  return (
    <motion.div variants={cardVariants} whileHover={{ y: -4 }} className="hover-lift">
      <Card className={`transition-shadow edge-accent ${className}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-blue-500 dark:text-[#6fbfe6]" />
            <CardTitle>{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {children}
        </CardContent>
      </Card>
    </motion.div>
  )
}
