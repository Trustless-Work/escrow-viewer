// app/[id]/page.tsx — Server Component (no "use client")
import EscrowDetailsClient from "@/components/escrow/EscrowDetails";

export default function Page({ params }: { params: { id: string } }) {
  return <EscrowDetailsClient initialEscrowId={params.id} />;
}
