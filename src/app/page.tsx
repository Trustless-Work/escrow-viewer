/* eslint-disable @typescript-eslint/no-explicit-any */
// app/page.tsx
"use client";

import { Inter } from "next/font/google";
import { NavbarSimple } from "@/components/Navbar";
import Image from "next/image";
import {
  getLedgerKeyContractCode,
  type EscrowMap, 
  type EscrowValue,
} from "@/utils/ledgerkeycontract";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { NextPage } from "next";
import { JSX, useState } from "react";

const inter = Inter({ subsets: ["latin"] });

// Mapping contract fields to human-readable role names (based on screenshot)
const ROLE_MAPPING: { [key: string]: string } = {
  "Milestone Approver": "Milestone Approver",
  service_provider: "Service Provider",
  "Release Signer": "Release Signer",
  "Dispute Resolver": "Dispute Resolver",
  "Platform Address": "Platform Address",
  receiver: "Receiver", // Not visible in screenshot, but included for completeness
};

// Permissions based on "Roles in Trustless Work"
const ROLE_PERMISSIONS: { [key: string]: string } = {
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

const Home: NextPage = () => {
  const [contractId, setContractId] = useState<string>("");
  const [escrowData, setEscrowData] = useState<EscrowMap | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEscrowData = async () => {
    if (!contractId) {
      setError("Please enter a contract ID");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getLedgerKeyContractCode(contractId);
      setEscrowData(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch escrow data");
    } finally {
      setLoading(false);
    }
  };



  const renderValue = (val?: EscrowValue): JSX.Element | string => {
    if (!val || Object.keys(val).length === 0) return "N/A"; // Prevents missing values
  
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
    } 
    // ✅ Correctly handle milestones inside `val.vec`
    else if (val.vec && Array.isArray(val.vec) && val.vec.length > 0) {
      return (
        <ul className="list-disc pl-4">
          {val.vec.map((item, index) => (
            <li key={index}>

                {Array.isArray(item.map) ? (
                <ul className="ml-4">
                  {item.map.map((milestone, milestoneIndex) => (
                    <li key={milestoneIndex}>
                      <strong>{milestone.key.symbol}:</strong> {renderValue(milestone.val)}
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
    } 
    else if (val.map) {
      return renderMap(val.map);
    }
  
    return JSON.stringify(val);
  };
  
  
  
  
  const renderMap = (map: EscrowMap): JSX.Element => {
    if (!Array.isArray(map)) {
      console.error("renderMap received non-array:", map);
      return <div className="text-red-500">Error: Invalid escrow data format</div>;
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
  
  
  

  return (
    <>
      <NavbarSimple />
      <div
        className={`relative z-10 flex flex-col lg:flex-row items-center justify-around py-20 gap-2 ${inter.className}`}
      >
        <section className="flex justify-center items-center order-1 lg:order-1">
          <div className="relative w-full max-w-[300px] sm:max-w-[350px] lg:max-w-[450px]">
            <Image
              src="/escrow-background.png"
              alt="Blockchain Network"
              width={450}
              height={450}
              className="relative rounded-lg w-full h-auto"
            />
          </div>
        </section>
        <section className="text-center lg:text-left space-y-8 order-2 lg:order-1">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
            Escrow Data Viewer
          </h1>
          <div className="flex w-full max-w-sm items-center space-x-2">
            <Input
              type="text"
              placeholder="Enter your escrow ID"
              value={contractId}
              onChange={(e) => setContractId(e.target.value)}
            />
            <Button onClick={fetchEscrowData} disabled={loading}>
              {loading ? "Fetching..." : "Fetch"}
            </Button>
          </div>
          {error && <p className="text-red-500">{error}</p>}
          {escrowData && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Escrow Details</CardTitle>
              </CardHeader>
              <CardContent>{renderMap(escrowData)}</CardContent>
            </Card>
          )}
        </section>
      </div>
    </>
  );
};

export default Home;
