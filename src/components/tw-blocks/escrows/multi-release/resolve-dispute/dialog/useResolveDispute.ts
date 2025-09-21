import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resolveDisputeSchema, type ResolveDisputeValues } from "./schema";
import { toast } from "sonner";
import {
  MultiReleaseResolveDisputePayload,
  MultiReleaseMilestone,
} from "@trustless-work/escrow";
import { useEscrowContext } from "@/components/tw-blocks/providers/EscrowProvider";
import { useEscrowsMutations } from "@/components/tw-blocks/tanstack/useEscrowsMutations";
import {
  ErrorResponse,
  handleError,
} from "@/components/tw-blocks/handle-errors/handle";
import { useWalletContext } from "@/components/tw-blocks/wallet-kit/WalletProvider";

export function useResolveDispute() {
  const { resolveDispute } = useEscrowsMutations();
  const { selectedEscrow, updateEscrow } = useEscrowContext();
  const { walletAddress } = useWalletContext();

  const form = useForm<ResolveDisputeValues>({
    resolver: zodResolver(resolveDisputeSchema),
    defaultValues: {
      approverFunds: 0,
      receiverFunds: 0,
      milestoneIndex: "0",
    },
    mode: "onChange",
  });

  const totalAmount = React.useMemo(() => {
    if (selectedEscrow?.type !== "multi-release") return 0;
    const milestones = selectedEscrow.milestones as MultiReleaseMilestone[];
    return milestones.reduce(
      (acc, milestone) => acc + Number(milestone.amount),
      0
    );
  }, [selectedEscrow]);

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = form.handleSubmit(async (payload) => {
    try {
      setIsSubmitting(true);

      /**
       * Create the final payload for the resolve dispute mutation
       *
       * @param payload - The payload from the form
       * @returns The final payload for the resolve dispute mutation
       */
      const finalPayload: MultiReleaseResolveDisputePayload = {
        contractId: selectedEscrow?.contractId || "",
        disputeResolver: walletAddress || "",
        approverFunds: Number(payload.approverFunds),
        receiverFunds: Number(payload.receiverFunds),
        milestoneIndex: String(payload.milestoneIndex),
      };

      /**
       * Call the resolve dispute mutation
       *
       * @param payload - The final payload for the resolve dispute mutation
       * @param type - The type of the escrow
       * @param address - The address of the escrow
       */
      await resolveDispute.mutateAsync({
        payload: finalPayload,
        type: "multi-release",
        address: walletAddress || "",
      });

      toast.success("Dispute resolved successfully");

      updateEscrow({
        ...selectedEscrow,
        milestones: selectedEscrow?.milestones.map((milestone, index) => {
          if (index === Number(payload.milestoneIndex)) {
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
          Number(payload.approverFunds) + Number(payload.receiverFunds),
      });
    } catch (error) {
      toast.error(handleError(error as ErrorResponse).message);
    } finally {
      setIsSubmitting(false);
      form.reset();
    }
  });

  return { form, handleSubmit, isSubmitting, totalAmount };
}
