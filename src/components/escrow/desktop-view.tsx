import { motion } from "framer-motion";
import { FileText, Users, ListChecks } from "lucide-react";
import type { OrganizedEscrowData } from "@/mappers/escrow-mapper";
import { FIELD_TOOLTIPS, ROLE_MAPPING, ROLE_PERMISSIONS } from "@/lib/escrow-constants";
import { cardVariants } from "@/utils/animations/animation-variants";
import { SectionCard } from "@/components/shared/section-card";
import { DetailRow } from "@/components/shared/detail-row";
import { StatusPanel } from "@/components/shared/status-panel";
import { MilestoneCard } from "@/components/shared/milestone-card";
import { RoleCard } from "@/components/shared/role-card";
import { truncateAddress } from "@/lib/escrow-constants";


interface DesktopViewProps {
  organized: OrganizedEscrowData;
  network: "mainnet" | "testnet";
}


export const DesktopView = ({ organized, network }: DesktopViewProps) => {
  return (
    <div className="hidden md:block space-y-6">
      {/* Details and Status in a 2-column grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Properties Card */}
        <motion.div variants={cardVariants}>
          <SectionCard
            title="Escrow Details"
            icon={FileText}
            className="hover:shadow-lg hover:border-green-300 transition-all duration-300"
          >
            <div className="space-y-1">
              {Object.entries(organized.properties).map(([key, value]) => (
                <DetailRow
                  key={key}
                  label={key}
  value={
key === "trustline" ? (
  <a
    href={`https://stellar.expert/explorer/${network}/contract/${value}`}
    target="_blank"
    rel="noopener noreferrer"
  >
    {truncateAddress(String(value), false)}
  </a>
) : (
  String(value)
)
  }

                  tooltip={FIELD_TOOLTIPS[key] || "No description available"}
                  canCopy={key === "escrow_id"}
                />
              ))}
            </div>
          </SectionCard>
        </motion.div>

        {/* Status Card */}
        <motion.div variants={cardVariants}>
          <StatusPanel
            flags={{
              dispute_flag: String(organized.flags.dispute_flag),
              release_flag: String(organized.flags.release_flag),
              resolved_flag: String(organized.flags.resolved_flag),
            }}
            tooltips={FIELD_TOOLTIPS}
          />
        </motion.div>
      </div>

      {/* Roles Card */}
      <motion.div variants={cardVariants}>
        <SectionCard
          title="Assigned Roles"
          icon={Users}
          className="hover:shadow-lg hover:border-blue-200 transition-all duration-300"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Object.entries(organized.roles).map(([key, value], index) => (
              <motion.div key={key} variants={cardVariants} custom={index}>
                <RoleCard
                  title={ROLE_MAPPING[key] || key.replace(/_/g, " ")}
                  address={String(value)}
                  description={
                    ROLE_PERMISSIONS[ROLE_MAPPING[key]] ||
                    "No description available"
                  }
                  tooltips={FIELD_TOOLTIPS}
                />
              </motion.div>
            ))}
          </div>
        </SectionCard>
      </motion.div>

      {/* Milestones Card */}
      <motion.div variants={cardVariants}>
        <SectionCard
          title="Milestones"
          icon={ListChecks}
          className="hover:shadow-lg hover:border-blue-200 transition-all duration-300"
        >
          {organized.milestones.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {organized.milestones.map((milestone, index) => (
                <motion.div key={index.toString()} variants={cardVariants} custom={index}>
                  <MilestoneCard
                    title={milestone.title}
                    description={milestone.description}
                    status={milestone.status}
                    approved={milestone.approved}
                    tooltips={FIELD_TOOLTIPS}
                    index={index}
                    amount={milestone.amount}
                    release_flag={milestone.release_flag}
                    dispute_flag={milestone.dispute_flag}
                    resolved_flag={milestone.resolved_flag}
                    signer={milestone.signer}
                    approver={milestone.approver}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500">No milestones found</p>
            </div>
          )}
        </SectionCard>
      </motion.div>
    </div>
  );
};
