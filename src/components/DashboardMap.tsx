"use client";

import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Batch } from "@/lib/types";

interface DashboardMapProps {
    batches: Batch[];
    onSelectBatch: (id: string) => void;
}

const ROUTING_COLOR: Record<string, string> = {
    premium: "#ff6b1a",
    standard: "#3a89bf",
    process: "#e89c2c",
    reject: "#c33b2a",
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
                    const color = ROUTING_COLOR[batch.recommendation.class] ?? "#ff6b1a";
                    const radius = 7 + (100 - batch.freshnessScore) * 0.14;
                    return (
                        <CircleMarker
                            key={batch.id}
                            center={[batch.originLat, batch.originLng]}
                            radius={radius}
                            pathOptions={{
                                color,
                                fillColor: color,
                                fillOpacity: 0.55,
                                weight: 2,
                            }}
                            eventHandlers={{ click: () => onSelectBatch(batch.id) }}
                        >
                            <Tooltip
                                direction="top"
                                offset={[0, -10]}
                                opacity={1}
                                className="shinkei-tip"
                            >
                                <div style={{ minWidth: 200 }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                                        <strong style={{ fontSize: 13, color: "#f3eee5" }}>
                                            {batch.species}
                                        </strong>
                                        <span
                                            style={{
                                                fontFamily: "var(--font-mono)",
                                                fontSize: 9,
                                                letterSpacing: "0.16em",
                                                textTransform: "uppercase",
                                                color,
                                            }}
                                        >
                                            {batch.recommendation.label}
                                        </span>
                                    </div>
                                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, opacity: 0.75, marginTop: 2, color: "#d8cdb5" }}>
                                        {batch.id.slice(0, 8)} · {batch.currentLocation ?? "at sea"}
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 6, fontSize: 11, color: "#f3eee5" }}>
                                        <span style={{ color: "#d8cdb5" }}>Freshness</span>
                                        <span style={{ fontFamily: "var(--font-mono)" }}>{batch.freshnessScore}%</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 2, fontSize: 11, color: "#f3eee5" }}>
                                        <span style={{ color: "#d8cdb5" }}>Unsellable in</span>
                                        <span style={{ fontFamily: "var(--font-mono)" }}>
                                            {batch.hoursToUnsellable !== null ? `${batch.hoursToUnsellable}h` : "stable"}
                                        </span>
                                    </div>
                                    <div
                                        style={{
                                            marginTop: 8,
                                            background: "#ff6b1a",
                                            color: "#14110f",
                                            fontSize: 10,
                                            fontWeight: 700,
                                            letterSpacing: "0.16em",
                                            textTransform: "uppercase",
                                            padding: "6px 10px",
                                            borderRadius: 6,
                                            textAlign: "center",
                                        }}
                                    >
                                        Click marker → Open NERA
                                    </div>
                                </div>
                            </Tooltip>
                        </CircleMarker>
                    );
                })}
            </MapContainer>

            <div className="absolute left-3 bottom-3 z-[400] flex gap-3 rounded-md border border-white/10 bg-black/60 backdrop-blur px-3 py-2 text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--shinkei-cream-deep)]">
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
