"use client";

import { Batch } from "@/lib/types";

interface Props {
  batches: Batch[];
  expanded?: boolean;
}

const LANES: { key: "premium" | "standard" | "process" | "reject"; label: string; sublabel: string }[] = [
  { key: "premium", label: "Premium Direct", sublabel: "Seremoni · D2C" },
  { key: "standard", label: "Standard Wholesale", sublabel: "Tokyo Central" },
  { key: "process", label: "Process Now", sublabel: "Freeze / Can" },
  { key: "reject", label: "Reject", sublabel: "Diverted" },
];

const COLOR: Record<string, string> = {
  premium: "#ff6b1a",
  standard: "#3a89bf",
  process: "#e89c2c",
  reject: "#c33b2a",
};

export default function TriagePanel({ batches, expanded = false }: Props) {
  const total = batches.length || 1;
  const buckets = LANES.map((lane) => {
    const items = batches.filter((b) => b.recommendation.class === lane.key);
    const value = items.reduce((s, b) => s + (b.revenueAtRisk || 0), 0);
    return { ...lane, items, count: items.length, value, pct: (items.length / total) * 100 };
  });

  return (
    <div className="rounded-xl border border-[var(--shinkei-rule)] shinkei-paper p-5 h-full flex flex-col shinkei-rise">
      <div className="flex items-baseline justify-between mb-1">
        <div className="shinkei-eyebrow">Routing Recommendation</div>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--shinkei-text-mute)]">
          NERA · Live
        </span>
      </div>
      <p className="text-[12px] text-[var(--shinkei-text-mute)] mb-4 max-w-[42ch]">
        Each batch is auto-assigned a sales lane from its current freshness and
        projected ammonia trend. Reroute before the curve catches up.
      </p>

      {/* Stacked bar */}
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-[var(--shinkei-cream-deep)] mb-5">
        {buckets.map((b) => (
          <div
            key={b.key}
            style={{ width: `${b.pct}%`, background: COLOR[b.key], transition: "width 700ms cubic-bezier(0.2,0.7,0.3,1)" }}
            className="h-full"
            title={`${b.label}: ${b.count}`}
          />
        ))}
      </div>

      <div className="space-y-3">
        {buckets.map((b, i) => (
          <div key={b.key}>
            <div
              className="flex items-center justify-between gap-4 shinkei-rise"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="h-2.5 w-2.5 rounded-sm shrink-0"
                  style={{ background: COLOR[b.key] }}
                />
                <div className="min-w-0">
                  <div className="text-[13px] text-[var(--shinkei-text)] truncate">{b.label}</div>
                  <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--shinkei-text-mute)]">
                    {b.sublabel}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-[14px] tabular-nums text-[var(--shinkei-text)]">{b.count}</div>
                <div className="text-[10px] text-[var(--shinkei-text-mute)]">
                  {b.value > 0 ? `$${b.value.toLocaleString()} at risk` : "—"}
                </div>
              </div>
            </div>
            {expanded && b.items.length > 0 && (
              <ul className="mt-2 ml-6 space-y-1 text-[11px] text-[var(--shinkei-text-mute)]">
                {b.items.map((it) => (
                  <li key={it.id} className="flex items-center justify-between">
                    <span className="font-mono">
                      {it.id.slice(0, 8)} · {it.species}
                    </span>
                    <span>
                      {it.hoursToUnsellable !== null ? `${it.hoursToUnsellable}h left` : "stable"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
