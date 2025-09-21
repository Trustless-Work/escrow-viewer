import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUpdateEscrowSchema } from "./schema";
import { z } from "zod";
import {
  UpdateMultiReleaseEscrowPayload,
  UpdateMultiReleaseEscrowResponse,
  MultiReleaseMilestone,
} from "@trustless-work/escrow/types";
import { toast } from "sonner";
import { useEscrowContext } from "@/components/tw-blocks/providers/EscrowProvider";
import { useWalletContext } from "@/components/tw-blocks/wallet-kit/WalletProvider";
import { useEscrowsMutations } from "@/components/tw-blocks/tanstack/useEscrowsMutations";
import {
  ErrorResponse,
  handleError,
} from "@/components/tw-blocks/handle-errors/handle";
import { GetEscrowsFromIndexerResponse } from "@trustless-work/escrow/types";

export function useUpdateEscrow() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const { getMultiReleaseFormSchema } = useUpdateEscrowSchema();
  const formSchema = getMultiReleaseFormSchema();

  const { walletAddress } = useWalletContext();
  const { selectedEscrow, setSelectedEscrow } = useEscrowContext();
  const { updateEscrow } = useEscrowsMutations();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      engagementId: selectedEscrow?.engagementId || "",
      title: selectedEscrow?.title || "",
      description: selectedEscrow?.description || "",
      platformFee: selectedEscrow?.platformFee as unknown as
        | number
        | string
        | undefined,
      receiverMemo: selectedEscrow?.receiverMemo
        ? String(selectedEscrow.receiverMemo)
        : "",
      trustline: {
        address: selectedEscrow?.trustline?.address || "",
        decimals: 10000000,
      },
      roles: {
        approver: selectedEscrow?.roles?.approver || "",
        serviceProvider: selectedEscrow?.roles?.serviceProvider || "",
        platformAddress: selectedEscrow?.roles?.platformAddress || "",
        receiver: selectedEscrow?.roles?.receiver || "",
        releaseSigner: selectedEscrow?.roles?.releaseSigner || "",
        disputeResolver: selectedEscrow?.roles?.disputeResolver || "",
      },
      milestones: (
        (selectedEscrow?.milestones as MultiReleaseMilestone[]) ?? []
      ).map((m) => ({
        description: m?.description || "",
        amount: m?.amount ?? 0,
      })) || [
        {
          description: "",
          amount: 0,
        },
      ],
    },
    mode: "onChange",
  });

  React.useEffect(() => {
    if (!selectedEscrow) return;
    form.reset({
      engagementId: selectedEscrow?.engagementId || "",
      title: selectedEscrow?.title || "",
      description: selectedEscrow?.description || "",
      platformFee:
        (selectedEscrow?.platformFee as unknown as
          | number
          | string
          | undefined) || "",
      receiverMemo: selectedEscrow?.receiverMemo
        ? String(selectedEscrow.receiverMemo)
        : "",
      trustline: {
        address: selectedEscrow?.trustline?.address || "",
        decimals: 10000000,
      },
      roles: {
        approver: selectedEscrow?.roles?.approver || "",
        serviceProvider: selectedEscrow?.roles?.serviceProvider || "",
        platformAddress: selectedEscrow?.roles?.platformAddress || "",
        receiver: selectedEscrow?.roles?.receiver || "",
        releaseSigner: selectedEscrow?.roles?.releaseSigner || "",
        disputeResolver: selectedEscrow?.roles?.disputeResolver || "",
      },
      milestones: (
        (selectedEscrow?.milestones as MultiReleaseMilestone[]) ?? []
      ).map((m) => ({
        description: m?.description || "",
        amount: m?.amount ?? "",
      })) || [
        {
          description: "",
          amount: "",
        },
      ],
    });
  }, [selectedEscrow, form]);

  const milestones = form.watch("milestones");
  const isAnyMilestoneEmpty = milestones.some((m) => m.description === "");

  const handleAddMilestone = () => {
    const current = form.getValues("milestones");
    const updated = [...current, { description: "", amount: "" }];
    form.setValue("milestones", updated);
  };

  const handleRemoveMilestone = (index: number) => {
    const current = form.getValues("milestones");
    const updated = current.filter((_, i) => i !== index);
    form.setValue("milestones", updated);
  };

  const handleMilestoneAmountChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    let rawValue = e.target.value;
    rawValue = rawValue.replace(/[^0-9.]/g, "");

    if (rawValue.split(".").length > 2) {
      rawValue = rawValue.slice(0, -1);
    }

    // Limit to 2 decimal places
    if (rawValue.includes(".")) {
      const parts = rawValue.split(".");
      if (parts[1] && parts[1].length > 2) {
        rawValue = parts[0] + "." + parts[1].slice(0, 2);
      }
    }

    // Always keep as string to allow partial input like "0." or "0.5"
    const updatedMilestones = [...milestones];
    updatedMilestones[index] = {
      ...updatedMilestones[index],
      amount: rawValue,
    };
    form.setValue("milestones", updatedMilestones);
  };

  const handlePlatformFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value;
    rawValue = rawValue.replace(/[^0-9.]/g, "");
    if (rawValue.split(".").length > 2) rawValue = rawValue.slice(0, -1);
    if (rawValue.includes(".")) {
      const parts = rawValue.split(".");
      if (parts[1] && parts[1].length > 2) {
        rawValue = parts[0] + "." + parts[1].slice(0, 2);
      }
    }
    form.setValue("platformFee", rawValue);
  };

  const handleSubmit = form.handleSubmit(async (payload) => {
    try {
      setIsSubmitting(true);

      /**
       * Create the final payload for the update escrow mutation
       *
       * @param payload - The payload from the form
       * @returns The final payload for the update escrow mutation
       */
      const finalPayload: UpdateMultiReleaseEscrowPayload = {
        contractId: selectedEscrow?.contractId || "",
        signer: walletAddress || "",
        escrow: {
          engagementId: payload.engagementId,
          title: payload.title,
          description: payload.description,
          platformFee:
            typeof payload.platformFee === "string"
              ? Number(payload.platformFee)
              : payload.platformFee,
          receiverMemo: payload.receiverMemo
            ? Number(payload.receiverMemo)
            : undefined,
          trustline: {
            address: payload.trustline.address,
            decimals: 10000000,
          },
          roles: payload.roles,
          milestones: payload.milestones.map((milestone) => ({
            ...milestone,
            amount:
              typeof milestone.amount === "string"
                ? Number(milestone.amount)
                : milestone.amount,
          })),
        },
      };

      /**
       * Call the update escrow mutation
       *
       * @param payload - The final payload for the update escrow mutation
       * @param type - The type of the escrow
       * @param address - The address of the escrow
       */
      (await updateEscrow.mutateAsync({
        payload: finalPayload,
        type: "multi-release",
        address: walletAddress || "",
      })) as UpdateMultiReleaseEscrowResponse;

      if (!selectedEscrow) return;

      const nextSelectedEscrow: GetEscrowsFromIndexerResponse = {
        ...selectedEscrow,
        ...finalPayload.escrow,
        trustline: {
          name:
            selectedEscrow.trustline?.name ||
            (selectedEscrow.trustline?.address as string) ||
            "",
          address: finalPayload.escrow.trustline.address,
          decimals: finalPayload.escrow.trustline.decimals,
        },
      };

      setSelectedEscrow(nextSelectedEscrow);
      toast.success("Escrow updated successfully");
    } catch (error) {
      toast.error(handleError(error as ErrorResponse).message);
    } finally {
      setIsSubmitting(false);
    }
  });

  return {
    form,
    isSubmitting,
    milestones,
    isAnyMilestoneEmpty,
    handleSubmit,
    handleAddMilestone,
    handleRemoveMilestone,
    handleMilestoneAmountChange,
    handlePlatformFeeChange,
  };
}
