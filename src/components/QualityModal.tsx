"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  ResponsiveContainer,
} from "recharts";
import type { ForecastResult } from "@/lib/freshness";

interface TraceabilityEvent {
  id: string;
  eventTime: string;
  bizStep: string;
  location: string;
}

interface SensorReading {
  id: string;
  recordedAt: string;
  mq135Value: number;
}

interface BatchDetail {
  id: string;
  species: string;
  originLat: number;
  originLng: number;
  catchTime: string;
  traceabilityEvents: TraceabilityEvent[];
  sensorReadings: SensorReading[];
  forecast: ForecastResult;
  revenueAtRisk: number;
  speciesProfile: { baseline: number; maximum: number; pricePerKg: number; batchKg: number };
  _metadata?: { totalReadings: number; returnedReadings: number; downsampled: boolean };
}

interface QualityModalProps {
  batchId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function QualityModal({ batchId, isOpen, onClose }: QualityModalProps) {
  const [data, setData] = useState<BatchDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!batchId || !isOpen) return;
    async function fetchDetail() {
      setLoading(true);
      try {
        const res = await fetch(`/batches/${batchId}`);
        const result = await res.json();
        setData(result);
      } catch (err) {
        console.error("Error fetching batch detail:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [batchId, isOpen]);

  if (!isOpen) return null;

  const chartData = data?.sensorReadings.map((r) => {
    const t = new Date(r.recordedAt);
    return {
      ts: t.getTime(),
      label: `D${Math.max(1, Math.ceil((t.getTime() - new Date(data.catchTime).getTime()) / 86_400_000))} ${t.getHours()}:${String(t.getMinutes()).padStart(2,"0")}`,
      ammonia: Number(r.mq135Value.toFixed(1)),
    };
  }) || [];

  const sellablePpm = data
    ? data.speciesProfile.baseline + 0.6 * (data.speciesProfile.maximum - data.speciesProfile.baseline)
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="!max-w-5xl bg-[var(--shinkei-ink-2)] border border-white/10 text-[var(--shinkei-cream)] p-0 rounded-xl shadow-2xl overflow-y-auto max-h-[92vh]">
        <div className="border-b border-white/8 px-7 py-5 flex flex-wrap items-start justify-between gap-4">
          <DialogHeader className="space-y-1.5 text-left">
            <div className="shinkei-eyebrow">NERA · Biometric Diagnostics</div>
            <DialogTitle className="text-[20px] font-semibold tracking-tight">
              {data?.species ?? "Batch"} <span className="font-mono text-[12px] text-[var(--shinkei-orange)] ml-1">{batchId?.slice(0,8)}</span>
            </DialogTitle>
            <DialogDescription className="text-[12px] text-[var(--shinkei-cream-mute)]">
              Real-time ammonia telemetry, shelf-life forecast, and sales-lane recommendation.
            </DialogDescription>
          </DialogHeader>
          {data && (
            <div className="flex items-center gap-3">
              <Pill label="Freshness" value={`${data.forecast.currentFreshness}%`} tone={data.forecast.currentFreshness >= 80 ? "ok" : data.forecast.currentFreshness >= 40 ? "warn" : "bad"} />
              <Pill label="Unsellable in" value={data.forecast.hoursToUnsellable !== null ? `${data.forecast.hoursToUnsellable}h` : "stable"} tone={data.forecast.hoursToUnsellable !== null && data.forecast.hoursToUnsellable < 24 ? "bad" : data.forecast.hoursToUnsellable !== null && data.forecast.hoursToUnsellable < 72 ? "warn" : "ok"} />
              <Pill label="R²" value={data.forecast.confidence.toFixed(2)} tone="neutral" />
            </div>
          )}
        </div>

        {loading ? (
          <div className="h-[400px] flex items-center justify-center flex-col gap-3">
            <div className="w-6 h-6 border-2 border-[var(--shinkei-orange)] border-t-transparent rounded-full animate-spin" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--shinkei-cream-mute)]">
              Decrypting cold chain sensor data…
            </span>
          </div>
        ) : data ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
            <div className="lg:col-span-2 p-7 space-y-6 border-r border-white/8">
              {/* Recommendation block */}
              <div className="rounded-lg border border-[var(--shinkei-orange)]/25 bg-[var(--shinkei-orange)]/[0.06] p-4">
                <div className="shinkei-eyebrow">Routing Recommendation</div>
                <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <div className="text-[18px] font-semibold text-[var(--shinkei-orange)]">
                      {data.forecast.recommendation.label} — {data.forecast.recommendation.lane}
                    </div>
                    <div className="text-[12px] text-[var(--shinkei-cream-mute)] mt-0.5 max-w-[60ch]">
                      {data.forecast.recommendation.rationale}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="shinkei-eyebrow">At risk</div>
                    <div className="font-mono text-[16px] text-rose-300">
                      {data.revenueAtRisk > 0 ? `$${data.revenueAtRisk.toLocaleString()}` : "—"}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="shinkei-eyebrow">Biometric Degradation Curve · MQ-135 Ammonia</div>
                <p className="text-[12px] text-[var(--shinkei-cream-mute)] mt-1 mb-3 max-w-[60ch]">
                  Slope <span className="font-mono text-[var(--shinkei-orange)]">+{data.forecast.slopePpmPerHour} ppm/hr</span>. Sellable threshold sits at the dashed line.
                </p>
                <div className="h-[280px] w-full bg-[var(--shinkei-ink)]/70 border border-white/8 rounded-lg p-3">
                  {mounted && chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 15, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="ammoniaStroke" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ff7a1f" />
                            <stop offset="100%" stopColor="#ff4d1f" />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="2 4" stroke="#1f242c" />
                        <XAxis dataKey="label" stroke="#7b7466" fontSize={10} tickLine={false} interval="preserveStartEnd" minTickGap={40} />
                        <YAxis stroke="#7b7466" fontSize={10} tickLine={false} domain={["auto", "auto"]} />
                        <ReferenceArea y1={sellablePpm} y2={data.speciesProfile.maximum} fill="#f56565" fillOpacity={0.06} />
                        <ReferenceLine y={sellablePpm} stroke="#f5b243" strokeDasharray="4 4" label={{ value: "Sellable threshold", position: "insideTopRight", fill: "#f5b243", fontSize: 10 }} />
                        <Tooltip contentStyle={{ background: "#0b0d10", border: "1px solid #2a2f38", color: "#f3eee5", fontSize: 11, fontFamily: "var(--font-mono)", borderRadius: 8 }} />
                        <Line type="monotone" dataKey="ammonia" stroke="url(#ammoniaStroke)" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#ff7a1f" }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-[var(--shinkei-cream-mute)] text-xs">No telemetry</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Stat label="Species baseline" value={`${data.speciesProfile.baseline.toFixed(1)} ppm`} />
                <Stat label="Spoiled threshold" value={`${data.speciesProfile.maximum.toFixed(1)} ppm`} />
                <Stat label="Telemetry rows" value={(data._metadata?.totalReadings ?? data.sensorReadings.length).toLocaleString()} />
                <Stat label="Batch value" value={`$${(data.speciesProfile.pricePerKg * data.speciesProfile.batchKg).toLocaleString()}`} />
              </div>
            </div>

            {/* Timeline column */}
            <div className="p-7 space-y-4">
              <div className="shinkei-eyebrow">CHRN · Traceability Log</div>
              <p className="text-[12px] text-[var(--shinkei-cream-mute)]">
                GDST-compatible chain of custody.
              </p>
              <div className="relative border-l border-white/10 ml-2 space-y-5 mt-2 py-1">
                {data.traceabilityEvents.map((event) => (
                  <div key={event.id} className="relative pl-5">
                    <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-[var(--shinkei-orange)] ring-4 ring-[var(--shinkei-ink-2)]" />
                    <div className="space-y-0.5">
                      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--shinkei-cream-mute)]">
                        {event.bizStep}
                      </div>
                      <div className="text-[13px] text-[var(--shinkei-cream)]">{event.location}</div>
                      <div className="text-[10px] text-[var(--shinkei-cream-mute)] font-mono">
                        {new Date(event.eventTime).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-[var(--shinkei-cream-mute)] text-sm">
            Could not resolve batch diagnostics.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Pill({ label, value, tone }: { label: string; value: string; tone: "ok" | "warn" | "bad" | "neutral" }) {
  const colors =
    tone === "ok" ? "border-emerald-400/30 text-emerald-300 bg-emerald-400/10"
    : tone === "warn" ? "border-amber-400/30 text-amber-300 bg-amber-400/10"
    : tone === "bad" ? "border-rose-400/30 text-rose-300 bg-rose-400/10"
    : "border-white/10 text-[var(--shinkei-cream)] bg-white/[0.04]";
  return (
    <div className={`rounded-md border px-3 py-1.5 ${colors}`}>
      <div className="font-mono text-[9px] uppercase tracking-[0.18em] opacity-80">{label}</div>
      <div className="font-mono text-[14px] mt-0.5">{value}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/8 bg-[var(--shinkei-ink)]/60 px-3 py-2">
      <div className="shinkei-eyebrow">{label}</div>
      <div className="font-mono text-[13px] mt-1 text-[var(--shinkei-cream)]">{value}</div>
    </div>
  );
}
