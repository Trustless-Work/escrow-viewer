"use client";

import { Inter } from "next/font/google";
import { NavbarSimple } from "@/components/Navbar";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { NextPage } from "next";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

const Home: NextPage = () => {
  const [contractId, setContractId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus(); // Autofocus input
  }, []);

  const handleFetch = () => {
    if (!contractId) {
      setError("Please enter a contract ID"); // Error handling for empty input
      return;
    }
    setError(null);
    router.push(`/${contractId}`); // Route to dynamic page
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
              ref={inputRef}
              type="text"
              placeholder="Enter your escrow ID"
              value={contractId}
              onChange={(e) => setContractId(e.target.value)}
            />
            <Button onClick={handleFetch}>Fetch</Button>
          </div>
          {error && <p className="text-red-500">{error}</p>}{" "}
          {/* Error display */}
        </section>
      </div>
    </>
  );
};

export default Home;
