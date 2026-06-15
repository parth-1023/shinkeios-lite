"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import AppShell from "@/components/AppShell";
import MetricsRow from "@/components/MetricsRow";
import TriagePanel from "@/components/TriagePanel";
import SpeciesBreakdown from "@/components/SpeciesBreakdown";
import InventoryTable from "@/components/InventoryTable";
import QualityModal from "@/components/QualityModal";
import { Batch } from "@/lib/types";

const DashboardMap = dynamic(() => import("@/components/DashboardMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full rounded-xl border border-white/8 bg-[var(--shinkei-ink-2)]/80 flex items-center justify-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--shinkei-cream-mute)]">
        Initializing CHRN ocean grid…
      </p>
    </div>
  ),
});

export default function Home() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function fetchBatches() {
      try {
        const res = await fetch("/batches");
        const data = await res.json();
        if (Array.isArray(data)) setBatches(data);
      } catch (err) {
        console.error("Error loading batches:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchBatches();
  }, []);

  const handleSelectBatch = (id: string) => {
    setSelectedBatchId(id);
    setIsModalOpen(true);
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-[1500px] mx-auto">
        <Tagline />

        <MetricsRow batches={batches} />

        {/* Map + Triage column */}
        <div className="grid grid-cols-1 xl:grid-cols-[1.7fr_1fr] gap-4">
          <div className="rounded-xl border border-white/8 bg-[var(--shinkei-ink-2)]/80 overflow-hidden flex flex-col">
            <div className="px-5 pt-5 pb-3 flex items-baseline justify-between">
              <div>
                <div className="shinkei-eyebrow">CHRN · Origin Tracking</div>
                <h3 className="text-[15px] font-semibold mt-1">
                  North Pacific Harvest Map
                </h3>
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--shinkei-cream-mute)]">
                Source · Global Fishing Watch AIS
              </div>
            </div>
            <div className="h-[420px]">
              <DashboardMap batches={batches} onSelectBatch={handleSelectBatch} />
            </div>
          </div>
          <TriagePanel batches={batches} />
        </div>

        {/* Inventory + species sidebar */}
        <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-4">
          <div>
            {loading ? (
              <div className="h-[280px] rounded-xl border border-white/8 bg-[var(--shinkei-ink-2)]/80 flex items-center justify-center font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--shinkei-cream-mute)]">
                Pulling 14,000+ telemetry rows from Supabase…
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
    <div className="relative overflow-hidden rounded-xl border border-white/8 bg-gradient-to-br from-[var(--shinkei-ink-2)] via-[var(--shinkei-ink-2)] to-[var(--shinkei-ink-3)] p-6 lg:p-8">
      <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[var(--shinkei-orange)]/15 blur-3xl" />
      <div className="absolute right-32 bottom-0 h-32 w-32 rounded-full bg-[var(--shinkei-ember)]/15 blur-3xl" />
      <div className="relative grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-end">
        <div>
          <div className="shinkei-eyebrow">Today · Operations Brief</div>
          <h2 className="shinkei-display text-[22px] lg:text-[26px] font-semibold mt-2 max-w-[36ch]">
            Every batch traced from{" "}
            <span className="text-[var(--shinkei-orange)]">harvest</span> to{" "}
            <span className="text-[var(--shinkei-orange)]">plate</span>, with shelf-life
            forecast in real time.
          </h2>
          <p className="text-[13px] text-[var(--shinkei-cream-mute)] mt-3 max-w-[60ch]">
            CHRN locks the chain-of-custody timeline. NERA reads MQ-135 ammonia telemetry
            from each ice-stored batch and projects the hour it falls below sellable
            grade — so dispatch can re-route before quality is lost, not after.
          </p>
        </div>
        <div className="hidden md:flex flex-col items-end text-right gap-1">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--shinkei-cream-mute)]">
            Inspired by
          </div>
          <a
            href="https://shinkei.systems/"
            target="_blank"
            className="font-mono text-[12px] underline decoration-[var(--shinkei-orange)] underline-offset-4"
            rel="noreferrer"
          >
            shinkei.systems
          </a>
          <div className="text-[11px] text-[var(--shinkei-cream-mute)] mt-1">
            Application portfolio piece
          </div>
        </div>
      </div>
    </div>
  );
}
