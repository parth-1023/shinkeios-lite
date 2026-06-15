"use client";

import { Batch } from "@/lib/types";
import { useEffect, useRef, useState } from "react";

interface Props {
  batches: Batch[];
}

export default function MetricsRow({ batches }: Props) {
  const total = batches.length;
  const avgFreshness = total
    ? Math.round(batches.reduce((s, b) => s + b.freshnessScore, 0) / total)
    : 0;
  const critical = batches.filter((b) => b.freshnessScore < 40).length;
  const premium = batches.filter((b) => b.recommendation.class === "premium").length;
  const revenueAtRisk = batches.reduce((s, b) => s + (b.revenueAtRisk || 0), 0);
  const actionable = batches.filter(
    (b) =>
      b.hoursToUnsellable !== null &&
      b.hoursToUnsellable > 0 &&
      b.hoursToUnsellable < 72 &&
      b.recommendation.class !== "reject",
  );
  const wastePreventedUsd = actionable.reduce((s, b) => s + (b.revenueAtRisk || 0), 0);

  const cards = [
    {
      label: "Batches in Flight",
      value: total,
      suffix: "",
      footnote: `${premium} premium · ${critical} critical`,
      tone: "neutral" as const,
    },
    {
      label: "Fleet Avg Freshness",
      value: avgFreshness,
      suffix: "%",
      footnote: avgFreshness >= 70 ? "Above wholesale threshold" : "Below premium grade",
      tone: avgFreshness >= 80 ? "ok" : avgFreshness >= 40 ? "warn" : "bad",
    },
    {
      label: "Active Spoilage Alerts",
      value: critical,
      suffix: "",
      footnote: critical ? "Pull from premium lane now" : "No batches under threshold",
      tone: critical > 0 ? "bad" : "ok",
    },
    {
      label: "Revenue at Risk",
      value: revenueAtRisk,
      money: true,
      footnote: `${formatUsd(wastePreventedUsd)} recoverable via rerouting`,
      tone: revenueAtRisk > 0 ? "warn" : "ok",
    },
  ] as const;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((c, i) => (
        <MetricCard key={c.label} {...c} index={i} />
      ))}
    </div>
  );
}

function MetricCard({
  label,
  value,
  suffix,
  money,
  footnote,
  tone,
  index,
}: {
  label: string;
  value: number;
  suffix?: string;
  money?: boolean;
  footnote: string;
  tone: "ok" | "warn" | "bad" | "neutral";
  index: number;
}) {
  const accent =
    tone === "ok"
      ? "text-emerald-700"
      : tone === "warn"
      ? "text-amber-700"
      : tone === "bad"
      ? "text-rose-700"
      : "text-[var(--shinkei-text)]";
  const stripe =
    tone === "ok"
      ? "bg-emerald-500"
      : tone === "warn"
      ? "bg-amber-500"
      : tone === "bad"
      ? "bg-rose-500"
      : "bg-[var(--shinkei-orange)]";

  const display = useCountUp(value);

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-[var(--shinkei-rule)] shinkei-paper shinkei-card-hover shinkei-rise"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className={`absolute left-0 top-0 h-full w-[3px] ${stripe}`} />
      <div className="p-5">
        <div className="shinkei-eyebrow">{label}</div>
        <div className={`mt-3 text-[34px] font-mono font-semibold tracking-tight tabular-nums ${accent}`}>
          {money ? formatUsd(display) : `${display}${suffix ?? ""}`}
        </div>
        <div className="mt-2 text-[11px] text-[var(--shinkei-text-mute)]">{footnote}</div>
      </div>
    </div>
  );
}

function useCountUp(target: number, duration = 800): number {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    fromRef.current = value;
    startRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const tick = (t: number) => {
      if (startRef.current === null) startRef.current = t;
      const p = Math.min(1, (t - startRef.current) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const next = Math.round(fromRef.current + (target - fromRef.current) * eased);
      setValue(next);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return value;
}

function formatUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n}`;
}
