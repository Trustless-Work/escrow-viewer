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
    <div className="w-full max-w-xl rounded-2xl border border-[var(--lux-line)] bg-[var(--lux-panel)] p-5 shadow-[0_14px_36px_-12px_rgba(0,0,0,0.45)]">
      <label
        htmlFor="cid"
        className="mb-2 block text-sm font-medium text-[var(--lux-muted)]"
      >
        Open an escrow by Contract ID
      </label>

      <div className="flex gap-2">
        <Input
          id="cid"
          placeholder="C… (56-char Stellar contract ID)"
          value={id}
          onChange={(e) => setId(e.target.value.toUpperCase())}
          onKeyDown={onKeyDown}
          className={[
            "flex-1 uppercase tracking-wide",
            "border-[var(--lux-line)] bg-[var(--lux-elev)]",
            "text-[var(--lux-text)] placeholder:text-[var(--lux-muted)]",
            "focus-visible:ring-2 focus-visible:ring-[var(--lux-gold)]/40",
          ].join(" ")}
          inputMode="text"
          autoCapitalize="characters"
          spellCheck={false}
        />

        <Button
          onClick={go}
          disabled={!valid}
          className={[
            "whitespace-nowrap rounded-xl px-5",
            "bg-[var(--lux-gold)] text-[#0f0f11] hover:bg-[var(--lux-gold-2)]",
            "disabled:opacity-60 disabled:cursor-not-allowed",
          ].join(" ")}
        >
          Open
        </Button>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={useExample}
          className="cursor-pointer rounded-lg text-[var(--lux-muted)] hover:bg-[var(--lux-elev)] hover:text-[var(--lux-text)]"
        >
          Use example
        </Button>

        {!valid && id.length > 0 && (
          <p className="text-xs text-amber-400">
            Must start with “C” and be 56 base32 chars (A–Z, 2–7).
          </p>
        )}
      </div>
    </div>
  );
}
