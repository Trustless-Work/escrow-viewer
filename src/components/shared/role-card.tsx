import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailRow } from "./detail-row";
import { InfoTooltip } from "./info-tooltip";
import RoleIcon from "./role-icon";
import { motion } from "framer-motion";

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
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 260 }}
    >
      <Card
        className="mb-6 shadow-md hover:shadow-lg transition-shadow duration-300 rounded-xl relative hover-lift edge-accent border-primary/20"
      >
        {/* Top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-2 rounded-t-xl bg-primary" />

        <CardHeader className="pt-4 pb-2">
          <div className="flex items-center gap-3">
            <motion.div whileHover={{ rotate: 10 }} transition={{ duration: 0.2 }}>
              <RoleIcon title={title as any} />
            </motion.div>
            <CardTitle className="text-base sm:text-lg flex items-center gap-1.5 font-bold text-card-foreground">
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
  );
};
