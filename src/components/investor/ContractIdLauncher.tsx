"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNetwork } from "@/contexts/NetworkContext";
import { EXAMPLE_CONTRACT_IDS } from "@/lib/escrow-constants";

const STRKEY_CONTRACT = /^C[A-Z2-7]{55}$/; // Stellar contract ID format

export default function ContractIdLauncher() {
  const router = useRouter();
  const { currentNetwork } = useNetwork();
  const [id, setId] = React.useState("");

  const trimmed = id.trim();
  const valid = STRKEY_CONTRACT.test(trimmed);

  function go() {
    if (!valid) return;
    router.push(`/${trimmed}`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") go();
  }

  function useExample() {
    setId(EXAMPLE_CONTRACT_IDS[currentNetwork] ?? "");
  }

  return (
    <div className="w-full max-w-xl rounded-2xl border bg-white p-4 shadow-sm">
      <label htmlFor="cid" className="block text-sm font-medium text-gray-700 mb-2">
        Open an escrow by Contract ID
      </label>

      <div className="flex gap-2">
        <Input
          id="cid"
          placeholder="C… (56-char Stellar contract ID)"
          value={id}
          onChange={(e) => setId(e.target.value)}
          onKeyDown={onKeyDown}
          className="flex-1"
          inputMode="text"
          autoCapitalize="characters"
          spellCheck={false}
        />
        <Button onClick={go} disabled={!valid} className="whitespace-nowrap">
          Open
        </Button>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={useExample} className="cursor-pointer">
          Use example
        </Button>
        {!valid && id.length > 0 && (
          <p className="text-xs text-amber-700">
            Must start with “C” and be 56 base32 chars (A–Z, 2–7).
          </p>
        )}
      </div>
    </div>
  );
}
