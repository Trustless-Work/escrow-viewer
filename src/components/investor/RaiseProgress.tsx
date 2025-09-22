"use client";

import * as React from "react";
import clsx from "clsx";

type Props = {
  raised: number | string;
  target: number | string;
  currency?: string;
  showNumbers?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export default function RaiseProgress({
  raised,
  target,
  currency = "USDC",
  showNumbers = true,
  size = "md",
  className,
}: Props) {
  const r = toNumber(raised);
  const t = Math.max(0, toNumber(target));

  const percent = React.useMemo(() => {
    if (!t) return 0;
    return clamp((r / t) * 100, 0, 100);
  }, [r, t]);

  const remaining = Math.max(t - r, 0);
  const height = size === "sm" ? "h-2" : size === "lg" ? "h-4" : "h-3";

  return (
    <section className={clsx("w-full", className)}>
      {showNumbers && (
        <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
          <div className="text-sm text-[var(--lux-muted)]">
            <span className="font-semibold text-[var(--lux-text)]">Raised:</span>{" "}
            <span className="font-mono text-[var(--lux-text)]">
              {fmt(r)} {currency}
            </span>
            {" / "}
            <span className="font-semibold text-[var(--lux-text)]">Target:</span>{" "}
            <span className="font-mono text-[var(--lux-text)]">
              {fmt(t)} {currency}
            </span>
          </div>
          <div className="text-xs text-[var(--lux-muted)]">
            <span className="font-medium">Remaining:</span>{" "}
            <span className="font-mono">{fmt(remaining)} {currency}</span>
          </div>
        </div>
      )}

      <div
        className={clsx(
          "relative w-full overflow-hidden rounded-full border border-[var(--lux-line)] bg-[var(--lux-elev)]",
          height
        )}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Number(percent.toFixed(2))}
        aria-label="Funding progress"
        title={`${percent.toFixed(1)}% funded`}
      >
        <div
          className={clsx(
            "h-full transition-[width] duration-500 ease-out",
            "bg-[var(--lux-gold)]"
          )}
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="mt-1 text-right text-xs text-[var(--lux-muted)]">
        {percent.toFixed(1)}% funded
      </div>
    </section>
  );
}

/* helpers */
function toNumber(v: number | string | null | undefined): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const n = Number(v.replace(/,/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}
function fmt(n: number): string {
  return Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n);
}
function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
