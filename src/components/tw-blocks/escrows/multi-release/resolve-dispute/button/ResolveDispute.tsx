import * as React from "react";
import { Button } from "@/components/ui/button";
import { useEscrowsMutations } from "@/components/tw-blocks/tanstack/useEscrowsMutations";
import { useWalletContext } from "@/components/tw-blocks/wallet-kit/WalletProvider";
import {
  MultiReleaseResolveDisputePayload,
  MultiReleaseMilestone,
} from "@trustless-work/escrow/types";
import { toast } from "sonner";
import {
  ErrorResponse,
  handleError,
} from "@/components/tw-blocks/handle-errors/handle";
import { useEscrowContext } from "@/components/tw-blocks/providers/EscrowProvider";
import { Loader2 } from "lucide-react";

type ResolveDisputeButtonProps = {
  approverFunds: number;
  receiverFunds: number;
  milestoneIndex: number | string;
};

export const ResolveDisputeButton = ({
  approverFunds,
  receiverFunds,
  milestoneIndex,
}: ResolveDisputeButtonProps) => {
  const { resolveDispute } = useEscrowsMutations();
  const { selectedEscrow, updateEscrow } = useEscrowContext();
  const { walletAddress } = useWalletContext();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function handleClick() {
    try {
      if (
        approverFunds == null ||
        Number.isNaN(approverFunds) ||
        receiverFunds == null ||
        Number.isNaN(receiverFunds)
      ) {
        toast.error("Both amounts are required");
        return;
      }

      if (approverFunds < 0 || receiverFunds < 0) {
        toast.error("Amounts must be >= 0");
        return;
      }

      setIsSubmitting(true);

      /**
       * Create the payload for the resolve dispute mutation
       *
       * @returns The payload for the resolve dispute mutation
       */
      const payload: MultiReleaseResolveDisputePayload = {
        contractId: selectedEscrow?.contractId || "",
        disputeResolver: walletAddress || "",
        approverFunds: Number(approverFunds),
        receiverFunds: Number(receiverFunds),
        milestoneIndex: String(milestoneIndex),
      };

      /**
       * Call the resolve dispute mutation
       *
       * @param payload - The payload for the resolve dispute mutation
       * @param type - The type of the escrow
       * @param address - The address of the escrow
       */
      await resolveDispute.mutateAsync({
        payload,
        type: "multi-release",
        address: walletAddress || "",
      });

      toast.success("Dispute resolved successfully");
      updateEscrow({
        ...selectedEscrow,
        milestones: selectedEscrow?.milestones.map((milestone, index) => {
          if (index === Number(milestoneIndex)) {
            return {
              ...milestone,
              flags: {
                ...(milestone as MultiReleaseMilestone).flags,
                disputed: false,
                resolved: true,
              },
            };
          }
          return milestone;
        }),
        balance:
          selectedEscrow?.balance ||
          Number(approverFunds) + Number(receiverFunds),
      });
    } catch (error) {
      toast.error(handleError(error as ErrorResponse).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Button
      type="button"
      disabled={isSubmitting}
      onClick={handleClick}
      className="cursor-pointer w-full"
    >
      {isSubmitting ? (
        <div className="flex items-center">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="ml-2">Resolving...</span>
        </div>
      ) : (
        "Resolve Dispute"
      )}
    </Button>
  );
};
