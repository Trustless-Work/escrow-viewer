import Link from "next/link";

type Props = {
  contractId: string;
  children?: React.ReactNode;
  className?: string;
  titlePrefix?: string; // e.g., "Escrow"
};

export default function ContractLink({
  contractId,
  children = "Open escrow",
  className,
  titlePrefix = "Escrow",
}: Props) {
  const short = `${contractId.slice(0, 6)}…${contractId.slice(-6)}`;
  return (
    <Link
      href={`/${contractId}`}
      className={className ?? "text-blue-600 hover:underline"}
      aria-label={`${titlePrefix} ${contractId}`}
    >
      {children} <span className="text-gray-500">({short})</span>
    </Link>
  );
}
