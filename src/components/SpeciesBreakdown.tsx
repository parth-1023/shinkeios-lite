"use client";

import { Batch } from "@/lib/types";

interface Props {
  batches: Batch[];
}

export default function SpeciesBreakdown({ batches }: Props) {
  const grouped = batches.reduce<Record<string, Batch[]>>((acc, b) => {
    (acc[b.species] ||= []).push(b);
    return acc;
  }, {});

  const species = Object.entries(grouped).map(([name, list]) => {
    const avg = Math.round(list.reduce((s, b) => s + b.freshnessScore, 0) / list.length);
    const avgSlope = list.reduce((s, b) => s + b.slopePpmPerHour, 0) / list.length;
    const fastest = list.reduce(
      (acc, b) =>
        b.hoursToUnsellable !== null && (acc === null || b.hoursToUnsellable < acc)
          ? b.hoursToUnsellable
          : acc,
      null as number | null,
    );
    return { name, count: list.length, avg, avgSlope, fastest };
  });

  return (
    <div className="rounded-xl border border-[var(--shinkei-rule)] shinkei-paper p-5 shinkei-rise">
      <div className="flex items-baseline justify-between mb-1">
        <div className="shinkei-eyebrow">Species Profile</div>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--shinkei-text-mute)]">
          DaFiF · Calibrated
        </span>
      </div>
      <p className="text-[12px] text-[var(--shinkei-text-mute)] mb-4 max-w-[42ch]">
        Each species has a distinct ammonia signature. Tuna degrades fastest by absolute ppm, but its
        sellable window is the widest. Mackerel is the most ice-tolerant.
      </p>

      <div className="space-y-4">
        {species.map((s, i) => (
          <div key={s.name} className="shinkei-rise" style={{ animationDelay: `${i * 90}ms` }}>
            <div className="flex items-baseline justify-between mb-1.5">
              <div className="text-[13px] font-medium text-[var(--shinkei-text)]">{s.name}</div>
              <div className="text-[10px] text-[var(--shinkei-text-mute)] font-mono">
                {s.count} batch{s.count === 1 ? "" : "es"}
              </div>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--shinkei-cream-deep)] overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${s.avg}%`,
                  background:
                    s.avg >= 80
                      ? "linear-gradient(90deg,#ff6b1a,#ffb37a)"
                      : s.avg >= 40
                      ? "linear-gradient(90deg,#e89c2c,#f5cf91)"
                      : "linear-gradient(90deg,#c33b2a,#e98b80)",
                  transition: "width 700ms cubic-bezier(0.2,0.7,0.3,1)",
                }}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5 text-[10px] text-[var(--shinkei-text-mute)] font-mono">
              <span>avg freshness {s.avg}%</span>
              <span>+{s.avgSlope.toFixed(2)} ppm/hr</span>
              <span>{s.fastest !== null ? `${s.fastest}h to unsellable` : "trend stable"}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
