import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cardVariants } from "@/utils/animations/animation-variants";
import type { LucideIcon } from "lucide-react";

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
  className = "",
}: SectionCardProps) => {
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -4 }}
      className="hover-lift"
    >
      <Card
        className={`transition-shadow duration-300 relative rounded-xl hover:shadow-lg edge-accent border-primary/20 overflow-hidden ${className}`}
      >
        {/* Top accent bar: mismo radio que el card */}
        <div className="absolute top-0 left-0 right-0 h-2 rounded-t-xl bg-primary" />

        <CardHeader className="pt-4 pb-3">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            <CardTitle className="text-card-foreground text-base sm:text-lg font-semibold">
              {title}
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="text-card-foreground">{children}</CardContent>
      </Card>
    </motion.div>
  );
};
