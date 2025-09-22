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
    <section className="mb-6 rounded-2xl border border-[var(--lux-line)] bg-[var(--lux-panel)] p-6 shadow-[0_14px_36px_-12px_rgba(0,0,0,0.45)]">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <h1 className="font-[var(--font-display)] text-2xl tracking-tight text-[var(--lux-text)] md:text-3xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-2 text-[var(--lux-muted)]">{subtitle}</p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--lux-line)] bg-[var(--lux-elev)]/60 px-3 py-1 text-xs font-medium text-[var(--lux-muted)]">
              Multi-Release
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--lux-line)] bg-[var(--lux-elev)]/60 px-3 py-1 text-xs font-medium text-[var(--lux-muted)]">
              {status}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-stretch gap-3 md:min-w-[320px]">
          {/* Primary CTA (Fund) */}
          {cta ? (
            cta
          ) : (
            <Button className="h-10 w-full rounded-xl bg-[var(--lux-gold)] text-black hover:bg-[var(--lux-gold-2)]">
              Fund with USDC</Button>
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
    <div className="rounded-xl border border-[var(--lux-line)] bg-[var(--lux-elev)] px-3 py-2">
      <div className="flex items-center gap-2 text-xs text-gray-500">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-1 text-sm font-semibold text-[var(--lux-text)]">
        {value}</div>
    </div>
  );
}
