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
        <h2 className="mb-3 text-xl font-semibold text-gray-900">Milestones</h2>
        <div className="rounded-xl border bg-white p-6 text-sm text-gray-600">
          No milestones defined for this escrow.
        </div>
      </section>
    );
  }

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Milestones</h2>
        <span className="text-sm text-gray-500">{milestones.length} total</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {milestones.map((m) => {
          const computed = computeStatus(m);
          return (
            <article
              key={m.id}
              className="rounded-2xl border bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="mb-2 flex items-start justify-between">
                <div className="mr-2">
                  <h3 className="text-base font-semibold text-gray-900">
                    {m.title || `Milestone ${m.id + 1}`}
                  </h3>
                  {m.amount && (
                    <div className="mt-0.5 text-sm font-medium text-gray-800">
                      {formatAmount(m.amount)} USDC
                    </div>
                  )}
                </div>
                <StatusBadge status={computed} />
              </div>

              {m.description && (
                <p className="text-sm text-gray-600">{m.description}</p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

/* -------- helpers -------- */

function computeStatus(m: ParsedMilestone): "Disputed" | "Resolved" | "Released" | "Approved" | "Pending" {
  if (m.dispute_flag && !m.resolved_flag) return "Disputed";
  if (m.resolved_flag) return "Resolved";
  if (m.release_flag) return "Released";
  if (m.approved) return "Approved";
  return "Pending";
}

function StatusBadge({ status }: { status: ReturnType<typeof computeStatus> }) {
  const map = {
    Disputed: { class: "bg-rose-50 text-rose-700 border-rose-200", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
    Resolved: { class: "bg-slate-50 text-slate-700 border-slate-200", icon: <BadgeCheck className="h-3.5 w-3.5" /> },
    Released: { class: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: <ArrowUpRight className="h-3.5 w-3.5" /> },
    Approved: { class: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    Pending:  { class: "bg-amber-50 text-amber-700 border-amber-200", icon: <Clock className="h-3.5 w-3.5" /> },
  } as const;

  const v = map[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold ${v.class}`}>
      {v.icon} {status}
    </span>
  );
}

function formatAmount(a: string) {
  const n = Number(a);
  if (!Number.isFinite(n)) return a;
  return Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n);
}
