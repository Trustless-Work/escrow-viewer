"use client";

import { Inter } from "next/font/google";
import { NavbarSimple } from "@/components/Navbar";
import Image from "next/image";
import {
  getLedgerKeyContractCode,
  type EscrowMap,
} from "@/utils/ledgerkeycontract";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { NextPage } from "next";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import EscrowViewer from "@/components/EscrowViewer";

const inter = Inter({ subsets: ["latin"] });

export const MetaData = {
  title: "Escrow Details",
  description: "Escrow Details",
};

const EscrowDetailsPage: NextPage = () => {
  const pathname = usePathname();
  const initialEscrowId = pathname.replace("/", "");
  const [contractId, setContractId] = useState<string>(initialEscrowId);
  const [escrowData, setEscrowData] = useState<EscrowMap | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [hasFetchedInitial, setHasFetchedInitial] = useState<boolean>(false);

  useEffect(() => {
    if (initialEscrowId && !hasFetchedInitial) {
      fetchEscrowData(initialEscrowId); // Fetch initial ID from URL only once
      setHasFetchedInitial(true);
    }
  }, [initialEscrowId, hasFetchedInitial]);

  const fetchEscrowData = async (id: string) => {
    if (!id) {
      setError("Please enter a contract ID");
      return;
    }
    setError(null);
    try {
      const data = await getLedgerKeyContractCode(id);
      setEscrowData(data);
      router.push(`/${id}`); // Update URL
    } catch (err: any) {
      setError(err.message || "Failed to fetch escrow data");
    }
  };

  const handleFetch = () => {
    if (contractId === initialEscrowId && escrowData) return; // Skip if same ID already fetched
    fetchEscrowData(contractId);
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
            <Button onClick={handleFetch}>Fetch</Button>
          </div>
          {error && <p className="text-red-500">{error}</p>}
          <EscrowViewer escrowData={escrowData} contractId={contractId} />
        </section>
      </div>
    </>
  );
};

export default EscrowDetailsPage;
