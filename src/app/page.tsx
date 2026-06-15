"use client";

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import InventoryTable from '@/components/InventoryTable';

// Dynamically import Leaflet Map with SSR disabled since Leaflet requires the client 'window' object
const DashboardMap = dynamic(() => import('@/components/DashboardMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full bg-slate-900/50 rounded-xl flex items-center justify-center border border-slate-800 animate-pulse">
      <p className="text-slate-400 text-sm font-medium">Initializing Global Ocean Map (CHRN)...</p>
    </div>
  ),
});

interface Batch {
  id: string;
  species: string;
  originLat: number;
  originLng: number;
  catchTime: string;
  freshnessScore: number;
}

export default function Home() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBatches() {
      try {
        const res = await fetch('/batches');
        const data = await res.json();
        if (Array.isArray(data)) {
          setBatches(data);
        }
      } catch (err) {
        console.error('Error loading batches:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchBatches();
  }, []);

  const handleSelectBatch = (id: string) => {
    setSelectedBatchId(id);
    // Temporary alert before we replace it with the detailed NERA biometric modal on Day 6
    alert(`Selected Batch: ${id}\nOpening NERA Biometric Quality Diagnostics...`);
  };

  // Calculate statistics
  const totalBatches = batches.length;
  const avgFreshness = totalBatches
    ? Math.round(batches.reduce((sum, b) => sum + b.freshnessScore, 0) / totalBatches)
    : 0;
  const criticalBatches = batches.filter(b => b.freshnessScore < 40).length;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 selection:bg-indigo-500/30">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-900">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400">
              ShinkeiOS Lite
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Traceability, Logistics (CHRN) & Biometric Quality Engine (NERA)
            </p>
          </div>
          <div className="flex gap-2">
            <span className="bg-indigo-500/10 text-indigo-400 text-xs px-3 py-1.5 rounded-full font-semibold border border-indigo-500/20">
              Poseidon Edge v2.1
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-slate-900/40 border border-slate-900 rounded-xl p-6 shadow-md">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Active Inventory</p>
            <h3 className="text-2xl font-bold text-slate-100 mt-2 font-mono">{totalBatches} Batches</h3>
          </div>
          <div className="bg-slate-900/40 border border-slate-900 rounded-xl p-6 shadow-md">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Fleet Avg Freshness</p>
            <h3 className={`text-2xl font-bold mt-2 font-mono ${avgFreshness >= 80 ? 'text-emerald-400' :
              avgFreshness >= 40 ? 'text-amber-400' : 'text-rose-400'
              }`}>{avgFreshness}%</h3>
          </div>
          <div className="bg-slate-900/40 border border-slate-900 rounded-xl p-6 shadow-md">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Spoilage Risk Alerts</p>
            <h3 className={`text-2xl font-bold mt-2 font-mono ${criticalBatches > 0 ? 'text-rose-400' : 'text-slate-400'
              }`}>{criticalBatches} Critical</h3>
          </div>
        </div>

        {/* Ocean Map (CHRN View) */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-slate-200">Origin Tracking Map (CHRN)</h2>
          <DashboardMap batches={batches} onSelectBatch={handleSelectBatch} />
        </div>

        {/* Inventory Table */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-slate-200">Seafood Inventory Directory</h2>
          {loading ? (
            <div className="h-[200px] w-full bg-slate-900/20 border border-slate-900 rounded-xl flex items-center justify-center animate-pulse">
              <span className="text-slate-500 text-sm">Loading inventory database...</span>
            </div>
          ) : (
            <InventoryTable batches={batches} onSelectBatch={handleSelectBatch} />
          )}
        </div>

      </div>
    </main>
  );
}
