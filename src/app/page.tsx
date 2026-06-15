"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import AppShell from "@/components/AppShell";
import MetricsRow from "@/components/MetricsRow";
import TriagePanel from "@/components/TriagePanel";
import SpeciesBreakdown from "@/components/SpeciesBreakdown";
import InventoryTable from "@/components/InventoryTable";
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

export default function Home() {
  const { batches, loading } = useBatches();
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelectBatch = (id: string) => {
    setSelectedBatchId(id);
    setIsModalOpen(true);
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-[1500px] mx-auto">
        <Tagline />

        <MetricsRow batches={batches} />

        <div className="grid grid-cols-1 xl:grid-cols-[1.7fr_1fr] gap-4">
          <div className="rounded-xl border border-[var(--shinkei-rule)] bg-[var(--shinkei-ink)] overflow-hidden flex flex-col shinkei-rise">
            <div className="px-5 pt-5 pb-3 flex items-baseline justify-between border-b border-white/8 bg-[var(--shinkei-ink-2)]">
              <div>
                <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--shinkei-cream-deep)]">
                  CHRN · Origin Tracking
                </div>
                <h3 className="text-[15px] font-semibold mt-1 text-[var(--shinkei-cream)]">
                  North Pacific Harvest Map
                </h3>
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--shinkei-cream-deep)]/70">
                Source · Global Fishing Watch AIS
              </div>
            </div>
            <div className="h-[420px]">
              <DashboardMap batches={batches} onSelectBatch={handleSelectBatch} />
            </div>
          </div>
          <TriagePanel batches={batches} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-4">
          <div>
            {loading ? (
              <div className="h-[280px] rounded-xl border border-[var(--shinkei-rule)] shinkei-paper flex items-center justify-center font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--shinkei-text-mute)] overflow-hidden relative">
                <div className="absolute inset-0 shinkei-shimmer" />
                <span className="relative">Pulling 14,000+ telemetry rows from Supabase…</span>
              </div>
            ) : (
              <InventoryTable batches={batches} onSelectBatch={handleSelectBatch} />
            )}
          </div>
          <SpeciesBreakdown batches={batches} />
        </div>
      </div>

      <QualityModal
        batchId={selectedBatchId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </AppShell>
  );
}

function Tagline() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--shinkei-rule)] shinkei-paper">
      <div className="absolute inset-0 shinkei-halftone-soft opacity-50 pointer-events-none" />

      <div className="relative p-7 lg:p-10 max-w-[60ch] shinkei-rise">
        <div className="shinkei-eyebrow mb-3">Today · Operations Brief</div>
        <h2 className="shinkei-display text-[26px] lg:text-[34px] font-semibold leading-[0.96] tracking-tight">
          Every batch traced from{" "}
          <span className="text-[var(--shinkei-orange)]">harvest</span> to{" "}
          <span className="text-[var(--shinkei-orange)]">plate</span>, with shelf-life
          forecast in real time.
        </h2>
        <p className="text-[13.5px] text-[var(--shinkei-text-mute)] mt-4 max-w-[55ch] leading-relaxed">
          CHRN locks the chain-of-custody timeline. NERA reads MQ-135 ammonia telemetry from each
          ice-stored batch and projects the hour it falls below sellable grade — so dispatch can
          re-route before quality is lost, not after.
        </p>
        <div className="mt-5 flex items-center gap-3 text-[11px] font-mono uppercase tracking-[0.16em] text-[var(--shinkei-text-mute)]">
          <span className="inline-flex h-2 w-2 rounded-full bg-[var(--shinkei-orange)] shinkei-pulse" />
          Live · 5 vessels · 14,000+ telemetry rows
        </div>
      </div>
    </div>
  );
}
