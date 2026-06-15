"use client";

import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Batch } from "@/lib/types";

interface DashboardMapProps {
    batches: Batch[];
    onSelectBatch: (id: string) => void;
}

const ROUTING_COLOR: Record<string, string> = {
    premium: "#ff7a1f",
    standard: "#6db6c9",
    process: "#f5b243",
    reject: "#f56565",
};

export default function DashboardMap({ batches, onSelectBatch }: DashboardMapProps) {
    const centerPosition: [number, number] = [35.6, 140.0];

    return (
        <div className="h-full w-full relative">
            <MapContainer
                center={centerPosition}
                zoom={5}
                scrollWheelZoom
                className="h-full w-full"
                attributionControl={false}
            >
                <TileLayer
                    attribution='&copy; OpenStreetMap · CartoDB'
                    url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
                />
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
                />
                {batches.map((batch) => {
                    const color = ROUTING_COLOR[batch.recommendation.class] ?? "#ff7a1f";
                    const radius = 6 + (100 - batch.freshnessScore) * 0.12;
                    return (
                        <CircleMarker
                            key={batch.id}
                            center={[batch.originLat, batch.originLng]}
                            radius={radius}
                            pathOptions={{
                                color,
                                fillColor: color,
                                fillOpacity: 0.45,
                                weight: 1.5,
                            }}
                            eventHandlers={{ click: () => onSelectBatch(batch.id) }}
                        >
                            <Tooltip direction="top" offset={[0, -8]} className="!bg-transparent">
                                <span className="text-[11px] font-mono">
                                    {batch.species} · {batch.freshnessScore}%
                                </span>
                            </Tooltip>
                            <Popup>
                                <div className="text-xs space-y-1.5 min-w-[180px]">
                                    <div className="flex items-center justify-between">
                                        <strong className="text-[13px]">{batch.species}</strong>
                                        <span
                                            className="text-[10px] font-mono uppercase tracking-widest"
                                            style={{ color }}
                                        >
                                            {batch.recommendation.label}
                                        </span>
                                    </div>
                                    <div className="opacity-70">ID {batch.id.slice(0, 8)}</div>
                                    <div className="flex justify-between gap-4">
                                        <span className="opacity-70">Freshness</span>
                                        <span className="font-mono">{batch.freshnessScore}%</span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <span className="opacity-70">Unsellable in</span>
                                        <span className="font-mono">
                                            {batch.hoursToUnsellable !== null
                                                ? `${batch.hoursToUnsellable}h`
                                                : "—"}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => onSelectBatch(batch.id)}
                                        className="mt-2 w-full bg-[#ff7a1f] hover:bg-[#ff8b3a] text-black text-[11px] py-1.5 px-3 rounded font-semibold transition-colors uppercase tracking-wider"
                                    >
                                        Open NERA Diagnostics
                                    </button>
                                </div>
                            </Popup>
                        </CircleMarker>
                    );
                })}
            </MapContainer>

            <div className="absolute left-3 bottom-3 z-[400] flex gap-3 rounded-md border border-white/10 bg-black/60 backdrop-blur px-3 py-2 text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--shinkei-cream-mute)]">
                {Object.entries(ROUTING_COLOR).map(([k, c]) => (
                    <span key={k} className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ background: c }} />
                        {k}
                    </span>
                ))}
            </div>
        </div>
    );
}
