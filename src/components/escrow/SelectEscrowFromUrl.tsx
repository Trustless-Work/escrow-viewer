// components/escrow/SelectEscrowFromUrl.tsx
"use client";

import { useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useEscrowContext } from "@/components/tw-blocks/providers/EscrowProvider";

type Props = { type?: "single-release" | "multi-release" };

export function SelectEscrowFromUrl({ type = "multi-release" }: Props) {
  const params = useParams<{ id?: string }>();
  const escrowId = (params?.id as string) || "";

  const { selectedEscrow, setSelectedEscrowId, setSelectedEscrow } =
    useEscrowContext() as any;

  const lastIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!escrowId) return;

    // Avoid redundant sets
    if (lastIdRef.current === escrowId) return;
    if (selectedEscrow?.contractId === escrowId) {
      lastIdRef.current = escrowId;
      return;
    }

    if (typeof setSelectedEscrowId === "function") {
      setSelectedEscrowId(escrowId);
      lastIdRef.current = escrowId;
      return;
    }

    if (typeof setSelectedEscrow === "function") {
      // Types in some builds expect a full payload; for Fund, id+type is sufficient.
      setSelectedEscrow({ contractId: escrowId, type } as any);
      lastIdRef.current = escrowId;
    }
  }, [escrowId, type, selectedEscrow?.contractId, setSelectedEscrowId, setSelectedEscrow]);

  return null;
}
