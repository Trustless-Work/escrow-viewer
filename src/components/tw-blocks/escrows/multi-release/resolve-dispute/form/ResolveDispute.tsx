import * as React from "react";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useResolveDispute } from "./useResolveDispute";
import { useEscrowContext } from "@/components/tw-blocks/providers/EscrowProvider";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "../../../../helpers/format.helper";

export const ResolveDisputeForm = ({
  showSelectMilestone = false,
  milestoneIndex,
}: {
  showSelectMilestone?: boolean;
  milestoneIndex?: number | string;
}) => {
  const { form, handleSubmit, isSubmitting, totalAmount } = useResolveDispute();
  const { selectedEscrow } = useEscrowContext();

  React.useEffect(() => {
    if (
      !showSelectMilestone &&
      milestoneIndex !== undefined &&
      milestoneIndex !== null
    ) {
      form.setValue("milestoneIndex", String(milestoneIndex));
    }
  }, [showSelectMilestone, milestoneIndex, form]);

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="flex flex-col space-y-6 w-full">
        {showSelectMilestone && (
          <FormField
            control={form.control}
            name="milestoneIndex"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center">
                  Milestone
                  <span className="text-destructive ml-1">*</span>
                </FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={(e) => {
                      field.onChange(e);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select milestone" />
                    </SelectTrigger>
                    <SelectContent>
                      {(selectedEscrow?.milestones || []).map((m, idx) => (
                        <SelectItem key={`ms-${idx}`} value={String(idx)}>
                          {m?.description || `Milestone ${idx + 1}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="approverFunds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Approver Funds</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="Enter approver funds"
                    value={field.value as unknown as string}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="receiverFunds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Receiver Funds</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="Enter receiver funds"
                    value={field.value as unknown as string}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="mt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="cursor-pointer"
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="ml-2">Resolving...</span>
              </div>
            ) : (
              "Resolve"
            )}
          </Button>

          <p className="text-xs text-muted-foreground">
            <span className="font-bold">Total Amount: </span>
            {formatCurrency(totalAmount, selectedEscrow?.trustline.name || "")}
          </p>

          <p className="text-xs text-muted-foreground">
            <span className="font-bold">Total Balance: </span>
            {formatCurrency(
              selectedEscrow?.balance || 0,
              selectedEscrow?.trustline.name || ""
            )}
          </p>
        </div>
      </form>
    </Form>
  );
};
