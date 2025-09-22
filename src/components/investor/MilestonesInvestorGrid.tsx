"use client";

import { BadgeCheck, AlertTriangle, CheckCircle2, Clock, ArrowUpRight } from "lucide-react";
import type { ParsedMilestone } from "@/mappers/escrow-mapper";

type Props = {
  milestones: ParsedMilestone[];
};

export default function MilestonesInvestorGrid({ milestones }: Props) {
  if (!milestones?.length) {
    return (
      <section className="mt-8">
        <h2 className="mb-3 font-[var(--font-display)] text-xl tracking-tight text-[var(--lux-text)]">
          Milestones
        </h2>
        <div className="rounded-2xl border border-[var(--lux-line)] bg-[var(--lux-panel)] p-6 text-sm text-[var(--lux-muted)]">
          No milestones defined for this escrow.
        </div>
      </section>
    );
  }

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-[var(--font-display)] text-xl tracking-tight text-[var(--lux-text)]">
          Milestones
        </h2>
        <span className="text-sm text-[var(--lux-muted)]">{milestones.length} total</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {milestones.map((m) => {
          const computed = computeStatus(m);
          return (
            <article
              key={m.id}
              className="rounded-2xl border border-[var(--lux-line)] bg-[var(--lux-panel)] p-4 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.35)] transition-transform hover:translate-y-[-2px] hover:shadow-[0_14px_36px_-12px_rgba(0,0,0,0.45)]"
            >
              <div className="mb-2 flex items-start justify-between">
                <div className="mr-2">
                  <h3 className="text-base font-semibold text-[var(--lux-text)]">
                    {m.title || `Milestone ${m.id + 1}`}
                  </h3>
                  {m.amount && (
                    <div className="mt-0.5 text-sm font-medium text-[var(--lux-text)]">
                      {formatAmount(m.amount)} USDC
                    </div>
                  )}
                </div>
                <StatusBadge status={computed} />
              </div>

              {m.description && (
                <p className="text-sm leading-relaxed text-[var(--lux-muted)]">{m.description}</p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

/* -------- helpers -------- */

function computeStatus(
  m: ParsedMilestone
): "Disputed" | "Resolved" | "Released" | "Approved" | "Pending" {
  if (m.dispute_flag && !m.resolved_flag) return "Disputed";
  if (m.resolved_flag) return "Resolved";
  if (m.release_flag) return "Released";
  if (m.approved) return "Approved";
  return "Pending";
}

function StatusBadge({ status }: { status: ReturnType<typeof computeStatus> }) {
  // neutral lux pill, icon color varies subtly by status
  const map = {
    Disputed: { icon: <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />, text: "text-rose-300" },
    Resolved: { icon: <BadgeCheck className="h-3.5 w-3.5 text-slate-300" />, text: "text-slate-200" },
    Released: { icon: <ArrowUpRight className="h-3.5 w-3.5 text-indigo-300" />, text: "text-indigo-200" },
    Approved: { icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />, text: "text-emerald-200" },
    Pending:  { icon: <Clock className="h-3.5 w-3.5 text-amber-300" />, text: "text-amber-200" },
  } as const;

  const v = map[status];

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border border-[var(--lux-line)] bg-[var(--lux-elev)]/70 px-2 py-1 text-xs font-semibold ${v.text}`}>
      {v.icon} {status}
    </span>
  );
}

function formatAmount(a: string) {
  const n = Number(a);
  if (!Number.isFinite(n)) return a;
  return Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n);
}
