import { Flag } from "lucide-react";
import { SectionCard } from "./section-card";
import { DetailRow } from "./detail-row";
import { StatusBadge } from "./status-badge";

interface StatusPanelProps {
  flags: {
    dispute_flag: string;
    release_flag: string;
    resolved_flag: string;
  };
  tooltips: { [key: string]: string };
}

export const StatusPanel = ({ flags, tooltips }: StatusPanelProps) => {
  return (
    <SectionCard
      title="Escrow Status"
      icon={Flag}
      className="hover:shadow-lg hover:border-red-300 dark:hover:border-red-700/50 transition-all duration-300"
    >
      <div className="space-y-4">
        <DetailRow
          label="Dispute Flag"
          value={<StatusBadge status={flags.dispute_flag} type="dispute" />}
          tooltip={
            tooltips.dispute_flag || "Set to true if a dispute is raised"
          }
        />

        <DetailRow
          label="Release Flag"
          value={<StatusBadge status={flags.release_flag} type="release" />}
          tooltip={
            tooltips.release_flag || "Set to true when funds have been released"
          }
        />

        <DetailRow
          label="Resolved Flag"
          value={<StatusBadge status={flags.resolved_flag} type="resolve" />}
          tooltip={
            tooltips.resolved_flag ||
            "Set to true when the dispute resolver takes action"
          }
        />
      </div>
    </SectionCard>
  );
};
