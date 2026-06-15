"use client";

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon issue in Next.js
if (typeof window !== 'undefined') {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    });
}

interface Batch {
    id: string;
    species: string;
    originLat: number;
    originLng: number;
    freshnessScore: number;
}

interface DashboardMapProps {
    batches: Batch[];
    onSelectBatch: (id: string) => void;
}

export default function DashboardMap({ batches, onSelectBatch }: DashboardMapProps) {
    // Center map around the Western Pacific Ocean near Japan
    const centerPosition: [number, number] = [35.6, 140.0];

    return (
        <div className="h-[400px] w-full rounded-xl overflow-hidden border border-slate-800 shadow-2xl relative z-10">
            <MapContainer
                center={centerPosition}
                zoom={5}
                scrollWheelZoom={true}
                className="h-full w-full"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" // Dark theme maps
                />
                {batches.map((batch) => (
                    <Marker
                        key={batch.id}
                        position={[batch.originLat, batch.originLng]}
                    >
                        <Popup>
                            <div className="p-1 text-slate-900">
                                <h3 className="font-semibold text-sm">{batch.species} Batch</h3>
                                <p className="text-xs text-slate-500 mt-0.5">ID: {batch.id.slice(0, 8)}...</p>
                                <div className="mt-2 flex items-center justify-between gap-4">
                                    <span className="text-xs text-slate-500">Freshness:</span>
                                    <span className={`text-xs font-bold ${batch.freshnessScore >= 80 ? 'text-emerald-600' :
                                            batch.freshnessScore >= 40 ? 'text-amber-600' : 'text-rose-600'
                                        }`}>{batch.freshnessScore}%</span>
                                </div>
                                <button
                                    onClick={() => onSelectBatch(batch.id)}
                                    className="mt-3 w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-1.5 px-3 rounded font-medium transition-colors"
                                >
                                    View Quality Metrics (NERA)
                                </button>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
