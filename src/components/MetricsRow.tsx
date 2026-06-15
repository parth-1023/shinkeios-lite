"use client";

import { Batch } from "@/lib/types";

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
  // Project a "waste prevented" figure: batches we still have time to reroute
  // before the sellable threshold.
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
      value: total.toString(),
      footnote: `${premium} premium · ${critical} critical`,
      tone: "neutral" as const,
    },
    {
      label: "Fleet Avg Freshness",
      value: `${avgFreshness}%`,
      footnote: avgFreshness >= 70 ? "Above wholesale threshold" : "Below premium grade",
      tone: avgFreshness >= 80 ? "ok" : avgFreshness >= 40 ? "warn" : "bad",
    },
    {
      label: "Active Spoilage Alerts",
      value: critical.toString(),
      footnote: critical ? "Pull from premium lane now" : "No batches under threshold",
      tone: critical > 0 ? "bad" : "ok" as const,
    },
    {
      label: "Revenue at Risk",
      value: usd(revenueAtRisk),
      footnote: `${usd(wastePreventedUsd)} recoverable via rerouting`,
      tone: revenueAtRisk > 0 ? "warn" : "ok" as const,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((c) => (
        <MetricCard key={c.label} {...c} />
      ))}
    </div>
  );
}

function MetricCard({
  label,
  value,
  footnote,
  tone,
}: {
  label: string;
  value: string;
  footnote: string;
  tone: "ok" | "warn" | "bad" | "neutral";
}) {
  const accent =
    tone === "ok"
      ? "text-emerald-300"
      : tone === "warn"
      ? "text-amber-300"
      : tone === "bad"
      ? "text-rose-300"
      : "text-[var(--shinkei-cream)]";
  const stripe =
    tone === "ok"
      ? "bg-emerald-400/60"
      : tone === "warn"
      ? "bg-amber-400/60"
      : tone === "bad"
      ? "bg-rose-400/70"
      : "bg-[var(--shinkei-orange)]";

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/8 bg-[var(--shinkei-ink-2)]/80 p-5">
      <div className={`absolute left-0 top-0 h-full w-[3px] ${stripe}`} />
      <div className="shinkei-eyebrow">{label}</div>
      <div className={`mt-3 text-3xl font-semibold font-mono tracking-tight ${accent}`}>
        {value}
      </div>
      <div className="mt-2 text-[11px] text-[var(--shinkei-cream-mute)]">{footnote}</div>
    </div>
  );
}

function usd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n}`;
}
