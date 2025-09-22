"use client";

import { ReactNode } from "react";
import { BadgeDollarSign, Target, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  title: string;
  subtitle?: string;
  balanceDisplay: string;      // e.g., “12,345.67 USDC”
  milestonesCount: number;
  status?: string;             // e.g., “Active”
  targetDisplay?: string;      // optional “50,000 USDC”
  cta?: ReactNode;             // usually <FundEscrowDialog />
};

export default function InvestorHero({
  title,
  subtitle,
  balanceDisplay,
  milestonesCount,
  status = "Active",
  targetDisplay,
  cta,
}: Props) {
  return (
    <section className="mb-6 rounded-3xl border bg-white/95 p-6 shadow-xl">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-2 text-gray-600">{subtitle}</p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              Multi-Release
            </span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              {status}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-stretch gap-3 md:min-w-[320px]">
          {/* Primary CTA (Fund) */}
          {cta ? (
            cta
          ) : (
            <Button className="h-10 w-full">Fund with USDC</Button>
          )}

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={<BadgeDollarSign className="h-4 w-4" />}
              label="Pool Balance"
              value={balanceDisplay}
            />
            <StatCard
              icon={<ListChecks className="h-4 w-4" />}
              label="Milestones"
              value={String(milestonesCount)}
            />
            {targetDisplay ? (
              <StatCard
                icon={<Target className="h-4 w-4" />}
                label="Target"
                value={targetDisplay}
              />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border bg-white px-3 py-2">
      <div className="flex items-center gap-2 text-xs text-gray-500">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-1 text-sm font-semibold text-gray-900">{value}</div>
    </div>
  );
}
