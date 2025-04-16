import type { NextPage } from "next";
import EscrowDetailsClient from "../../components/escrow/EscrowDetails";

interface EscrowDetailsPageProps {
  params: Promise<{ id: string }>;
}

const EscrowDetailsPage: NextPage<EscrowDetailsPageProps> = async ({
  params,
}) => {
  const { id } = await params;
  return <EscrowDetailsClient initialEscrowId={id} />;
};

export default EscrowDetailsPage;
