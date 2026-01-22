import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { generateEscrowPdf } from "@/utils/pdf-export";
import type { OrganizedEscrowData } from "@/mappers/escrow-mapper";
import type { NetworkType } from "@/lib/network-config";

interface ExportPdfButtonProps {
  organized: OrganizedEscrowData;
  network: NetworkType;
  contractId?: string;
  initialEscrowId?: string;
}

export function ExportPdfButton({
  organized,
  network,
  contractId,
  initialEscrowId,
}: ExportPdfButtonProps) {
  const handleExport = async () => {
    const contractIdToUse =
      organized.properties.escrow_id ||
      contractId ||
      initialEscrowId;

    if (!contractIdToUse) {
      alert("Error: Contract ID is required to export PDF.");
      return;
    }

    try {
      await generateEscrowPdf({
        organized,
        network,
        contractId: contractIdToUse,
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    }
  };

  return (
    <Button
      onClick={handleExport}
      variant="outline"
      className="w-full inline-flex justify-center items-center gap-2"
      title="Export escrow data to PDF"
    >
      <FileDown className="h-4 w-4" />
      Export to PDF
    </Button>
  );
}
