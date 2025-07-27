import { motion } from "framer-motion";
import { FileText, Flag, Users, ListChecks } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { OrganizedEscrowData } from "@/utils/escrow-helpers";
import { FIELD_TOOLTIPS, ROLE_MAPPING, ROLE_PERMISSIONS } from "@/lib/escrow-constants";
import { cardVariants } from "@/utils/animations/animation-variants";
import { SectionCard } from "@/components/shared/section-card";
import { DetailRow } from "@/components/shared/detail-row";
import { StatusPanel } from "@/components/shared/status-panel";
import { MilestoneCard } from "@/components/shared/milestone-card";
import { truncateAddress } from "@/lib/escrow-constants";


interface TabViewProps {
  organized: OrganizedEscrowData;
    network: "mainnet" | "testnet";

}

export const TabView = ({ organized,  network }: TabViewProps) => {
  return (
    <div className="block md:hidden mb-6">
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid grid-cols-4 w-full mb-6 bg-blue-50">
          <TabsTrigger
            value="details"
            className="flex items-center gap-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            <FileText className="h-3 w-3" />
            <span>Details</span>
          </TabsTrigger>
          <TabsTrigger
            value="status"
            className="flex items-center gap-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            <Flag className="h-3 w-3" />
            <span>Status</span>
          </TabsTrigger>
          <TabsTrigger
            value="roles"
            className="flex items-center gap-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            <Users className="h-3 w-3" />
            <span>Roles</span>
          </TabsTrigger>
          <TabsTrigger
            value="milestones"
            className="flex items-center gap-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            <ListChecks className="h-3 w-3" />
            <span>Tasks</span>
          </TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details">
          <motion.div variants={cardVariants}>
            <SectionCard title="Escrow Details" icon={FileText}>
              <div className="space-y-1">
                {Object.entries(organized.properties).map(([key, value]) => (
                  <DetailRow
                    key={key}
                    label={key}
value={
  key === "trustline" && typeof value === "string" ? (
    <a
      href={`https://stellar.expert/explorer/${network}/account/${value}`}
      target="_blank"
      rel="noopener noreferrer"
      className="underline text-blue-600"
    >
 {truncateAddress(value, true)} // or `false` depending on the desired truncation style

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
        </TabsContent>

        {/* Status Tab */}
        <TabsContent value="status">
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
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles">
          <motion.div variants={cardVariants}>
            <SectionCard title="Assigned Roles" icon={Users}>
              <div className="space-y-4">
                {Object.entries(organized.roles).map(([key, value]) => (
                  <div
                    key={key}
                    className="border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                  >
                    <DetailRow
                      label={ROLE_MAPPING[key] || key.replace(/_/g, " ")}
                      value={value}
                      tooltip={
                        ROLE_PERMISSIONS[ROLE_MAPPING[key]] ||
                        "No description available"
                      }
                      canCopy={true}
                      isAddress={true}
                    />
                  </div>
                ))}
              </div>
            </SectionCard>
          </motion.div>
        </TabsContent>

        {/* Milestones Tab */}
        <TabsContent value="milestones">
          <motion.div variants={cardVariants}>
            <SectionCard title="Milestones" icon={ListChecks}>
              {organized.milestones.length > 0 ? (
                <div className="space-y-4">
                  {organized.milestones.map((milestone, index) => (
                    <MilestoneCard
                      key={index}
                      index={index}
                      title={milestone.title}
                      description={milestone.description}
                      status={milestone.status}
                      approved={milestone.approved}
                      tooltips={FIELD_TOOLTIPS}
                      amount={milestone.amount}
                      release_flag={milestone.release_flag}
                      dispute_flag={milestone.dispute_flag}
                      resolved_flag={milestone.resolved_flag}
                      signer={milestone.signer}
                      approver={milestone.approver}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500">No milestones found</p>
                </div>
              )}
            </SectionCard>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
