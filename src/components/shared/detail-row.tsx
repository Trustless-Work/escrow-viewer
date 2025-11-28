import { InfoTooltip } from "./info-tooltip";
import { Copy, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface DetailRowProps {
  label: string;
  value: string | React.ReactNode;
  tooltip: string;
  canCopy?: boolean;
  isAddress?: boolean;
}

export const DetailRow = ({
  label,
  value,
  tooltip,
  canCopy = false,
  isAddress = false,
}: DetailRowProps) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    if (typeof value === "string") {
      navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formattedLabel = label.replace(/_/g, " ");

  return (
    <div className="flex flex-col sm:flex-row py-2 border-b border-border last:border-0">
      {/* Label + Tooltip */}
      <div className="flex items-center gap-1.5 w-full sm:w-2/5 mb-1 sm:mb-0">
        <span className="text-muted-foreground font-medium capitalize">
          {formattedLabel}
        </span>
        <InfoTooltip content={tooltip} />
      </div>

      {/* Value + Optional Copy Button */}
      <div className="flex items-center w-full sm:w-3/5">
        <div
          className={`
            truncate flex-grow 
            ${isAddress
              ? "font-mono text-xs px-2 py-1 rounded border border-border bg-muted text-card-foreground"
              : "font-medium text-card-foreground"
            }
          `}
        >
          {value || "N/A"}
        </div>

        {canCopy && typeof value === "string" && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-1 h-7 w-7 p-0 text-muted-foreground hover:text-card-foreground"
            onClick={copyToClipboard}
            title="Copy to clipboard"
          >
            {copied ? (
              <CheckCircle size={14} className="text-green-500" />
            ) : (
              <Copy size={14} className="opacity-70" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
};
