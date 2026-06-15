"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import HalftoneFish from "@/components/HalftoneFish";
import Sparkline from "@/components/Sparkline";
import QualityModal from "@/components/QualityModal";
import { useBatches } from "@/lib/useBatches";
import { Batch } from "@/lib/types";

const SPECIES_COPY: Record<string, { tagline: string; note: string; palette: [string, string, string] }> = {
  Mackerel: {
    tagline: "Ice-tolerant. Slow burn.",
    note: "The most forgiving species in the dataset — wide premium window, gentle slope.",
    palette: ["#3a89bf", "#7aa7c2", "#c2a3c9"],
  },
  Tuna: {
    tagline: "Fast curve. Highest margin.",
    note: "Steepest ppm rise per hour and the highest price per kg — every saved hour matters.",
    palette: ["#ff6b1a", "#e8421a", "#c2418b"],
  },
  Tilapia: {
    tagline: "Volume mover.",
    note: "Lower price per kg but reliable. Forecast confidence is typically high.",
    palette: ["#e89c2c", "#ff6b1a", "#c33b2a"],
  },
};

export default function SpeciesPage() {
  const { batches } = useBatches();
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const select = (id: string) => { setSelectedBatchId(id); setOpen(true); };

  const grouped = batches.reduce<Record<string, Batch[]>>((acc, b) => {
    (acc[b.species] ||= []).push(b);
    return acc;
  }, {});

  return (
    <AppShell>
      <div className="max-w-[1500px] mx-auto space-y-5">
        <div className="rounded-2xl border border-[var(--shinkei-rule)] shinkei-paper px-7 py-6 shinkei-rise">
          <div className="shinkei-eyebrow mb-2">Species Profiles</div>
          <h2 className="shinkei-display text-[26px] font-semibold tracking-tight">
            Three species, three signatures.
          </h2>
          <p className="text-[12.5px] text-[var(--shinkei-text-mute)] mt-2 max-w-[64ch]">
            Calibrated baseline and spoiled-threshold ammonia for each species. Adding new species
            is a thresholds row — that's how Shinkei scales Poseidon support.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(grouped).map(([name, list], i) => {
            const copy = SPECIES_COPY[name] ?? {
              tagline: name,
              note: "",
              palette: ["#ff6b1a", "#e8421a", "#3a89bf"] as [string, string, string],
            };
            const avg = Math.round(list.reduce((s, b) => s + b.freshnessScore, 0) / list.length);
            const avgSlope = list.reduce((s, b) => s + b.slopePpmPerHour, 0) / list.length;
            const totalValue = list.reduce((s, b) => s + b.revenueAtRisk, 0);
            return (
              <div
                key={name}
                className="relative overflow-hidden rounded-xl border border-[var(--shinkei-rule)] shinkei-paper p-5 shinkei-rise"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="absolute -top-2 -right-4 opacity-95 shinkei-drift pointer-events-none">
                  <HalftoneFish width={160} colors={copy.palette} />
                </div>
                <div className="relative">
                  <div className="shinkei-eyebrow">{copy.tagline}</div>
                  <h3 className="shinkei-display text-[22px] font-semibold mt-1">{name}</h3>
                  <p className="text-[12px] text-[var(--shinkei-text-mute)] mt-1 max-w-[28ch]">{copy.note}</p>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <Stat label="batches" value={list.length.toString()} />
                    <Stat label="avg fresh" value={`${avg}%`} />
                    <Stat label="ppm/hr" value={`+${avgSlope.toFixed(2)}`} />
                  </div>

                  <div className="mt-4 text-[11px] text-[var(--shinkei-text-mute)]">Recent batches</div>
                  <ul className="mt-2 space-y-1">
                    {list.map((it) => (
                      <li key={it.id}>
                        <button
                          onClick={() => select(it.id)}
                          className="w-full text-left rounded-md border border-[var(--shinkei-rule)]/70 bg-white/50 hover:bg-[var(--shinkei-cream-warm)] transition-colors px-3 py-2 flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <div className="font-mono text-[11px] text-[var(--shinkei-orange)]">
                              {it.id.slice(0, 8)}
                            </div>
                            <div className="text-[10px] text-[var(--shinkei-text-mute)] truncate">
                              {it.recommendation.label}
                            </div>
                          </div>
                          <Sparkline data={it.sparkline} width={70} height={22} stroke="#1c1612" fill="rgba(28,22,18,0.08)" />
                          <div className="font-mono text-[12px] tabular-nums text-[var(--shinkei-text)] shrink-0">
                            {it.freshnessScore}%
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 pt-3 border-t border-[var(--shinkei-rule)] flex items-center justify-between text-[10px] uppercase tracking-[0.16em] font-mono text-[var(--shinkei-text-mute)]">
                    <span>Revenue at risk</span>
                    <span className="text-rose-700">${totalValue.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <QualityModal batchId={selectedBatchId} isOpen={open} onClose={() => setOpen(false)} />
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--shinkei-rule)] bg-white/40 py-2">
      <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--shinkei-text-mute)]">
        {label}
      </div>
      <div className="font-mono text-[13px] tabular-nums text-[var(--shinkei-text)] mt-0.5">
        {value}
      </div>
    </div>
  );
}
