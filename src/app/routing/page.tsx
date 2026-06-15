"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import TriagePanel from "@/components/TriagePanel";
import QualityModal from "@/components/QualityModal";
import { useBatches } from "@/lib/useBatches";
import { Batch } from "@/lib/types";

const LANE_COPY: Record<string, { headline: string; detail: string }> = {
  premium: {
    headline: "Reserve for Seremoni Direct-to-Consumer",
    detail:
      "These batches are at premium freshness and stable enough to hold the lane through retail packing.",
  },
  standard: {
    headline: "Route to Tokyo Central Wholesale",
    detail:
      "Healthy curve, on time. Standard wholesale pricing applies; reassess if slope steepens.",
  },
  process: {
    headline: "Process within the next shift",
    detail:
      "Forecast says these will cross the unsellable threshold soon. Flash freeze or can to lock in value.",
  },
  reject: {
    headline: "Diverted from food channels",
    detail: "Quality has degraded past safe sale. Reroute to rendering or compost.",
  },
};

const LANE_COLOR: Record<string, string> = {
  premium: "#ff6b1a",
  standard: "#3a89bf",
  process: "#e89c2c",
  reject: "#c33b2a",
};

export default function RoutingPage() {
  const { batches } = useBatches();
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const select = (id: string) => {
    setSelectedBatchId(id);
    setOpen(true);
  };

  const byLane: Record<string, Batch[]> = batches.reduce((acc, b) => {
    (acc[b.recommendation.class] ||= []).push(b);
    return acc;
  }, {} as Record<string, Batch[]>);

  return (
    <AppShell>
      <div className="max-w-[1500px] mx-auto space-y-5">
        <div className="relative overflow-hidden rounded-2xl border border-[var(--shinkei-rule)] shinkei-paper px-7 py-6 shinkei-rise">
          <div className="relative max-w-[64ch]">
            <div className="shinkei-eyebrow mb-2">Routing & Triage</div>
            <h2 className="shinkei-display text-[26px] font-semibold tracking-tight">
              Reroute before the curve catches up.
            </h2>
            <p className="text-[12.5px] text-[var(--shinkei-text-mute)] mt-2">
              Each batch is assigned a sales lane from its current freshness and ammonia trend.
              Open any batch to see the forecast that drove the call.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_2fr] gap-5">
          <TriagePanel batches={batches} expanded />

          <div className="space-y-4">
            {(["premium", "standard", "process", "reject"] as const).map((k) => (
              <LaneCard
                key={k}
                color={LANE_COLOR[k]}
                title={LANE_COPY[k].headline}
                detail={LANE_COPY[k].detail}
                items={byLane[k] ?? []}
                onSelect={select}
              />
            ))}
          </div>
        </div>
      </div>
      <QualityModal batchId={selectedBatchId} isOpen={open} onClose={() => setOpen(false)} />
    </AppShell>
  );
}

function LaneCard({
  title,
  detail,
  items,
  color,
  onSelect,
}: {
  title: string;
  detail: string;
  items: Batch[];
  color: string;
  onSelect: (id: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div
      className="rounded-xl border border-[var(--shinkei-rule)] shinkei-paper p-5 shinkei-rise relative overflow-hidden"
    >
      <span
        className="absolute left-0 top-0 h-full w-[3px]"
        style={{ background: color }}
      />
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
        <h3 className="text-[15px] font-semibold text-[var(--shinkei-text)]">{title}</h3>
        <span
          className="font-mono text-[10px] uppercase tracking-[0.16em]"
          style={{ color }}
        >
          {items.length} batch{items.length === 1 ? "" : "es"}
        </span>
      </div>
      <p className="text-[12px] text-[var(--shinkei-text-mute)] mb-4">{detail}</p>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={it.id}>
            <button
              onClick={() => onSelect(it.id)}
              className="w-full text-left rounded-md border border-[var(--shinkei-rule)]/70 bg-white/40 hover:bg-[var(--shinkei-cream-warm)] transition-colors p-3 flex items-center justify-between gap-4 shinkei-rise"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="min-w-0">
                <div className="text-[13px] font-medium text-[var(--shinkei-text)]">
                  {it.species} ·{" "}
                  <span className="font-mono text-[12px] text-[var(--shinkei-text-mute)]">
                    {it.id.slice(0, 8)}
                  </span>
                </div>
                <div className="text-[11px] text-[var(--shinkei-text-mute)] mt-0.5 truncate">
                  {it.currentLocation ?? "—"} · {it.recommendation.rationale}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-mono text-[14px] tabular-nums text-[var(--shinkei-text)]">
                  {it.freshnessScore}%
                </div>
                <div className="text-[10px] text-[var(--shinkei-text-mute)]">
                  {it.hoursToUnsellable !== null ? `${it.hoursToUnsellable}h left` : "stable"} · $
                  {it.revenueAtRisk.toLocaleString()} risk
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
