// Server Component (no "use client" here)
import EscrowDetailsClient from "@/components/escrow/EscrowDetails";

type PageProps = { params: { id: string } };

export default function EscrowDetailsPage({ params }: PageProps) {
  const { id } = params; // not a Promise
  return <EscrowDetailsClient initialEscrowId={id} />;
}
