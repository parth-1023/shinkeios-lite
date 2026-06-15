"use client";

import { Batch } from "@/lib/types";

interface Props {
  batches: Batch[];
}

const LANES: { key: "premium" | "standard" | "process" | "reject"; label: string; sublabel: string }[] = [
  { key: "premium", label: "Premium Direct", sublabel: "Seremoni · D2C" },
  { key: "standard", label: "Standard Wholesale", sublabel: "Tokyo Central" },
  { key: "process", label: "Process Now", sublabel: "Freeze / Can" },
  { key: "reject", label: "Reject", sublabel: "Diverted" },
];

const COLOR: Record<string, string> = {
  premium: "var(--shinkei-orange)",
  standard: "#6db6c9",
  process: "#f5b243",
  reject: "#f56565",
};

export default function TriagePanel({ batches }: Props) {
  const total = batches.length || 1;
  const buckets = LANES.map((lane) => {
    const items = batches.filter((b) => b.recommendation.class === lane.key);
    const value = items.reduce((s, b) => s + (b.revenueAtRisk || 0), 0);
    return { ...lane, count: items.length, value, pct: (items.length / total) * 100 };
  });

  return (
    <div className="rounded-xl border border-white/8 bg-[var(--shinkei-ink-2)]/80 p-5 h-full flex flex-col">
      <div className="flex items-baseline justify-between mb-1">
        <div className="shinkei-eyebrow">Routing Recommendation</div>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--shinkei-cream-mute)]">
          NERA · Live
        </span>
      </div>
      <p className="text-[12px] text-[var(--shinkei-cream-mute)] mb-4 max-w-[42ch]">
        Each batch is auto-assigned a sales lane from its current freshness and
        projected ammonia trend. Reroute before the curve catches up.
      </p>

      {/* Stacked bar */}
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-white/[0.05] mb-5">
        {buckets.map((b) => (
          <div
            key={b.key}
            style={{ width: `${b.pct}%`, background: COLOR[b.key] }}
            className="h-full transition-all"
            title={`${b.label}: ${b.count}`}
          />
        ))}
      </div>

      <div className="space-y-3">
        {buckets.map((b) => (
          <div key={b.key} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span
                className="h-2.5 w-2.5 rounded-sm shrink-0"
                style={{ background: COLOR[b.key] }}
              />
              <div className="min-w-0">
                <div className="text-[13px] text-[var(--shinkei-cream)] truncate">{b.label}</div>
                <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--shinkei-cream-mute)]">
                  {b.sublabel}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[14px] text-[var(--shinkei-cream)]">{b.count}</div>
              <div className="text-[10px] text-[var(--shinkei-cream-mute)]">
                {b.value > 0 ? `$${b.value.toLocaleString()} at risk` : "—"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
