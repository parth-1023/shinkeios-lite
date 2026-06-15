"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import AppShell from "@/components/AppShell";
import QualityModal from "@/components/QualityModal";
import { useBatches } from "@/lib/useBatches";

const DashboardMap = dynamic(() => import("@/components/DashboardMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-[var(--shinkei-ink)] flex items-center justify-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--shinkei-cream-deep)]">
        Initializing CHRN ocean grid…
      </p>
    </div>
  ),
});

export default function FleetPage() {
  const { batches } = useBatches();
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const select = (id: string) => {
    setSelectedBatchId(id);
    setOpen(true);
  };

  return (
    <AppShell>
      <div className="max-w-[1500px] mx-auto space-y-4">
        <Header />
        <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-4">
          <div className="rounded-xl border border-[var(--shinkei-rule)] bg-[var(--shinkei-ink)] overflow-hidden shinkei-rise">
            <div className="h-[640px]">
              <DashboardMap batches={batches} onSelectBatch={select} />
            </div>
          </div>
          <VesselList batches={batches} onSelectBatch={select} />
        </div>
      </div>
      <QualityModal batchId={selectedBatchId} isOpen={open} onClose={() => setOpen(false)} />
    </AppShell>
  );
}

function Header() {
  return (
    <div className="rounded-2xl border border-[var(--shinkei-rule)] shinkei-paper px-7 py-6 shinkei-rise">
      <div className="shinkei-eyebrow mb-2">CHRN · Fleet Map</div>
      <h2 className="shinkei-display text-[26px] font-semibold tracking-tight">
        Vessels at sea, batches in motion.
      </h2>
      <p className="text-[12.5px] text-[var(--shinkei-text-mute)] mt-2 max-w-[64ch]">
        Coordinates seeded from Global Fishing Watch AIS for the Western Pacific. Marker color is
        the routing recommendation; size scales with spoilage urgency.
      </p>
    </div>
  );
}

import { Batch } from "@/lib/types";

function VesselList({
  batches,
  onSelectBatch,
}: {
  batches: Batch[];
  onSelectBatch: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border border-[var(--shinkei-rule)] shinkei-paper p-5 shinkei-rise">
      <div className="shinkei-eyebrow">Active Batches</div>
      <h3 className="text-[15px] font-semibold mt-1 mb-4 text-[var(--shinkei-text)]">
        Click a batch to open NERA
      </h3>
      <div className="space-y-2">
        {batches.map((b, i) => (
          <button
            key={b.id}
            onClick={() => onSelectBatch(b.id)}
            className="w-full text-left rounded-lg border border-[var(--shinkei-rule)] bg-white/40 hover:bg-[var(--shinkei-cream-warm)] transition-colors p-3 shinkei-rise"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[13px] font-medium text-[var(--shinkei-text)]">{b.species}</div>
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--shinkei-text-mute)]">
                  {b.id.slice(0, 8)} · {b.currentLocation ?? "at sea"}
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-[14px] tabular-nums text-[var(--shinkei-text)]">
                  {b.freshnessScore}%
                </div>
                <div className="text-[10px] text-[var(--shinkei-text-mute)]">
                  {b.hoursToUnsellable !== null ? `${b.hoursToUnsellable}h left` : "stable"}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
