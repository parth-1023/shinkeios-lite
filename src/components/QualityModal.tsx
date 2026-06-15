"use client";

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { calculateFreshness } from '@/lib/freshness';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

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
  _metadata?: {
    totalReadings: number;
    returnedReadings: number;
    downsampled: boolean;
  };
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

  // Fix Recharts hydration warnings in Next.js
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!batchId || !isOpen) return;

    async function fetchDetail() {
      setLoading(true);
      try {
        const res = await fetch(`/batches/${batchId}`);
        const result = await res.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching batch detail:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDetail();
  }, [batchId, isOpen]);

  if (!isOpen) return null;

  // Get current freshness from latest reading in the detail payload
  const latestReading = data?.sensorReadings[data.sensorReadings.length - 1];
  const currentFreshness = latestReading && data 
    ? calculateFreshness(latestReading.mq135Value, data.species)
    : 100;

  const getFreshnessColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10';
    if (score >= 40) return 'text-amber-400 border-amber-500/20 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/20 bg-rose-500/10';
  };

  const getFreshnessDescription = (score: number) => {
    if (score >= 80) return 'Excellent Quality - Premium Grade';
    if (score >= 40) return 'Moderate Quality - Standard Grade';
    return 'Critical Degradation - Unfit for Sale';
  };

  // Format chart data
  const chartData = data?.sensorReadings.map((r) => {
    const date = new Date(r.recordedAt);
    return {
      name: `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`,
      ammonia: r.mq135Value,
    };
  }) || [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl bg-slate-900 border border-slate-800 text-slate-100 p-6 md:p-8 rounded-xl shadow-2xl overflow-y-auto max-h-[90vh]">
        <DialogHeader className="border-b border-slate-800 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <DialogTitle className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <span>NERA Biometric Diagnostics</span>
                <span className="font-mono text-xs text-indigo-400">({batchId?.slice(0, 8)})</span>
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-sm mt-1">
                Real-time biological sensor logging and cold chain verification.
              </DialogDescription>
            </div>
            {data && (
              <Badge className={`border px-3 py-1 font-semibold ${getFreshnessColor(currentFreshness)}`}>
                Freshness: {currentFreshness}%
              </Badge>
            )}
          </div>
        </DialogHeader>

        {loading ? (
          <div className="h-[400px] flex items-center justify-center flex-col gap-2">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-slate-500 text-sm">Decrypting cold chain sensor data...</span>
          </div>
        ) : data ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-6">
            
            {/* Left: Chart area (takes 2 columns) */}
            <div className="md:col-span-2 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Biometric Degradation Curve (Ammonia MQ135)
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Ammonia emissions tracked over the 11-day ice storage period. Rising ammonia indicates protein breakdown.
                </p>
                
                {/* Recharts Container */}
                <div className="h-[250px] w-full bg-slate-950/50 border border-slate-800 rounded-xl p-4">
                  {mounted && chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis 
                          dataKey="name" 
                          stroke="#64748b" 
                          fontSize={10}
                          tickLine={false}
                          dy={10}
                        />
                        <YAxis 
                          stroke="#64748b" 
                          fontSize={10} 
                          tickLine={false}
                          domain={['auto', 'auto']}
                          dx={-10}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#0f172a', 
                            borderColor: '#334155', 
                            color: '#f8fafc',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontFamily: 'monospace'
                          }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="ammonia" 
                          stroke="#6366f1" 
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-600 text-xs">
                      Loading chart module...
                    </div>
                  )}
                </div>
              </div>

              {/* Quality diagnostics table summary */}
              <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Biological Species:</span>
                  <span className="font-semibold text-slate-200">{data.species}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Total Telemetry Readings:</span>
                  <span className="font-semibold text-slate-200 font-mono">
                    {data._metadata?.totalReadings || data.sensorReadings.length}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Quality Index Assessment:</span>
                  <span className={`font-semibold ${
                    currentFreshness >= 80 ? 'text-emerald-400' :
                    currentFreshness >= 40 ? 'text-amber-400' : 'text-rose-400'
                  }`}>{getFreshnessDescription(currentFreshness)}</span>
                </div>
              </div>
            </div>

            {/* Right: Supply Chain Timeline (takes 1 column) */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                Traceability Log (CHRN)
              </h3>
              <div className="relative border-l border-slate-800 ml-3 space-y-6 py-2">
                {data.traceabilityEvents.map((event) => (
                  <div key={event.id} className="relative pl-6">
                    {/* Circle timeline indicator */}
                    <span className="absolute -left-[5px] top-1.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-indigo-500 ring-4 ring-slate-900"></span>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] font-mono capitalize py-0 px-1.5 border-slate-700 text-indigo-400 bg-indigo-500/5">
                          {event.bizStep}
                        </Badge>
                      </div>
                      <p className="text-xs font-semibold text-slate-200">{event.location}</p>
                      <p className="text-[10px] text-slate-500">
                        {new Date(event.eventTime).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : (
          <div className="h-[400px] flex items-center justify-center text-slate-500 text-sm">
            Could not resolve batch diagnostics.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
