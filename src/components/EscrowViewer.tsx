"use client";

import { FC, JSX, useState } from "react";
import { type EscrowMap, type EscrowValue } from "@/utils/ledgerkeycontract";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const ROLE_MAPPING: { [key: string]: string } = {
  "Milestone Approver": "Milestone Approver",
  service_provider: "Service Provider",
  "Release Signer": "Release Signer",
  "Dispute Resolver": "Dispute Resolver",
  "Platform Address": "Platform Address",
  receiver: "Receiver",
};

export const ROLE_PERMISSIONS: { [key: string]: string } = {
  "Milestone Approver": "Approves or disputes milestones marked as completed.",
  "Service Provider":
    "Delivers the product/service, marks milestones as completed.",
  "Release Signer":
    "Approves the release of funds after all milestones are approved.",
  "Dispute Resolver":
    "Resolves disputes by adjusting amounts, updating status, or canceling.",
  "Platform Address":
    "Receives platform fees and can update pending milestones.",
  Receiver:
    "Final recipient of funds after conditions are met or disputes resolved.",
};

interface EscrowViewerProps {
  escrowData: EscrowMap | null;
  contractId: string;
}

export const renderValue = (val?: EscrowValue): JSX.Element | string => {
  if (!val || Object.keys(val).length === 0) return "N/A";

  if (val.bool !== undefined) {
    return val.bool ? "True" : "False";
  } else if (val.string) {
    return val.string;
  } else if (val.address) {
    return val.address;
  } else if (val.i128) {
    const stroops =
      BigInt(val.i128.lo) +
      (val.i128.hi ? BigInt(val.i128.hi) * BigInt(2 ** 32) : BigInt(0));
    const xlm = Number(stroops) / 10_000_000;
    return `${xlm.toFixed(2)} XLM`;
  } else if (val.vec && Array.isArray(val.vec) && val.vec.length > 0) {
    return (
      <ul className="list-disc pl-4">
        {val.vec.map((item, index) => (
          <li key={index}>
            {Array.isArray(item.map) ? (
              <ul className="ml-4">
                {item.map.map((milestone, milestoneIndex) => (
                  <li key={milestoneIndex}>
                    <strong>{milestone.key.symbol}:</strong>{" "}
                    {renderValue(milestone.val)}
                  </li>
                ))}
              </ul>
            ) : (
              "N/A"
            )}
          </li>
        ))}
      </ul>
    );
  } else if (val.map) {
    return renderMap(val.map);
  }
  return JSON.stringify(val);
};

export const renderMap = (map: EscrowMap): JSX.Element => {
  if (!Array.isArray(map)) {
    console.error("renderMap received non-array:", map);
    return (
      <div className="text-red-500">Error: Invalid escrow data format</div>
    );
  }

  return (
    <div className="space-y-2">
      {map.map(({ key, val }, index) => {
        const displayRole = ROLE_MAPPING[key.symbol] || key.symbol;
        return (
          <div key={index} className="flex space-x-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <strong className="underline cursor-help">
                  {displayRole}:
                </strong>
              </TooltipTrigger>
              <TooltipContent>
                {ROLE_PERMISSIONS[displayRole] || "No description available"}
              </TooltipContent>
            </Tooltip>
            <span>{renderValue(val)}</span>
          </div>
        );
      })}
    </div>
  );
};

const EscrowViewer: FC<EscrowViewerProps> = ({ escrowData, contractId }) => {
  const [copied, setCopied] = useState<boolean>(false);

  const copyLink = () => {
    const url = `${window.location.origin}/${contractId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
  };

  return escrowData ? (
    <Card className="mt-4">
      <CardContent>
        {renderMap(escrowData)}
        <div className="mt-4 flex items-center space-x-2">
          <Button onClick={copyLink}>
            {copied ? "Copied!" : "Copy Contract Link"}
          </Button>
        </div>
      </CardContent>
    </Card>
  ) : null;
};

export default EscrowViewer;
