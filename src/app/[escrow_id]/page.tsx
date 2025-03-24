import type { NextPage } from "next";
import type { Metadata } from "next";
import EscrowDetailsClient from "@/components/EscrowDetails";

export const metadata: Metadata = {
  title: "Escrow Details",
  description: "Page to view escrow details",
};

interface EscrowDetailsPageProps {
  params: Promise<{ escrow_id: string }>; // Update type to reflect that params is a Promise
}

const EscrowDetailsPage: NextPage<EscrowDetailsPageProps> = async ({
  params,
}) => {
  const { escrow_id } = await params; // Await the params to resolve the Promise

  return <EscrowDetailsClient initialEscrowId={escrow_id} />;
};

export default EscrowDetailsPage;
