"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import InventoryTable from "@/components/InventoryTable";
import MetricsRow from "@/components/MetricsRow";
import QualityModal from "@/components/QualityModal";
import { useBatches } from "@/lib/useBatches";

export default function QualityPage() {
  const { batches, loading } = useBatches();
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <AppShell>
      <div className="max-w-[1500px] mx-auto space-y-5">
        <div className="rounded-2xl border border-[var(--shinkei-rule)] shinkei-paper px-7 py-6 shinkei-rise">
          <div className="shinkei-eyebrow mb-2">NERA · Quality Telemetry</div>
          <h2 className="shinkei-display text-[26px] font-semibold tracking-tight">
            Every batch, every reading, ranked by urgency.
          </h2>
          <p className="text-[12.5px] text-[var(--shinkei-text-mute)] mt-2 max-w-[64ch]">
            14,000+ MQ-135 ammonia readings from the DaFiF dataset, downsampled per row into a
            11-day trend. Sorted by hours-to-unsellable; act on the top of the list first.
          </p>
        </div>

        <MetricsRow batches={batches} />

        {loading ? (
          <div className="h-[280px] rounded-xl border border-[var(--shinkei-rule)] shinkei-paper flex items-center justify-center font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--shinkei-text-mute)] overflow-hidden relative">
            <div className="absolute inset-0 shinkei-shimmer" />
            <span className="relative">Pulling telemetry…</span>
          </div>
        ) : (
          <InventoryTable
            batches={[...batches].sort((a, b) => {
              const ha = a.hoursToUnsellable ?? Number.POSITIVE_INFINITY;
              const hb = b.hoursToUnsellable ?? Number.POSITIVE_INFINITY;
              return ha - hb;
            })}
            onSelectBatch={(id) => {
              setSelectedBatchId(id);
              setOpen(true);
            }}
          />
        )}
      </div>

      <QualityModal batchId={selectedBatchId} isOpen={open} onClose={() => setOpen(false)} />
    </AppShell>
  );
}
