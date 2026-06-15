"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import Sparkline from "./Sparkline";
import { Batch } from "@/lib/types";

interface InventoryTableProps {
    batches: Batch[];
    onSelectBatch: (id: string) => void;
}

export default function InventoryTable({ batches, onSelectBatch }: InventoryTableProps) {
    return (
        <div className="rounded-xl border border-[var(--shinkei-rule)] shinkei-paper overflow-hidden shinkei-rise">
            <div className="flex items-baseline justify-between px-5 pt-5 pb-3">
                <div>
                    <div className="shinkei-eyebrow">Inventory & Triage</div>
                    <h3 className="text-[15px] font-semibold mt-1 text-[var(--shinkei-text)]">
                        Active Seafood Batches
                    </h3>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--shinkei-text-mute)]">
                    Click row · open NERA diagnostics
                </span>
            </div>
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent border-[var(--shinkei-rule)]">
                        <Th>Batch</Th>
                        <Th>Species</Th>
                        <Th>Current Stop</Th>
                        <Th>Trend (11d)</Th>
                        <Th className="text-right">Freshness</Th>
                        <Th className="text-right">Hours to Unsellable</Th>
                        <Th>Recommendation</Th>
                        <Th className="text-right">At Risk</Th>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {batches.map((batch, i) => (
                        <TableRow
                            key={batch.id}
                            onClick={() => onSelectBatch(batch.id)}
                            className="cursor-pointer border-[var(--shinkei-rule)]/70 hover:bg-[var(--shinkei-cream-warm)]/60 transition-colors shinkei-rise"
                            style={{ animationDelay: `${i * 60}ms` }}
                        >
                            <TableCell className="font-mono text-xs text-[var(--shinkei-orange)] font-semibold">
                                {batch.id.slice(0, 8)}
                            </TableCell>
                            <TableCell className="text-[var(--shinkei-text)] font-medium">
                                {batch.species}
                            </TableCell>
                            <TableCell className="text-[12px] text-[var(--shinkei-text-mute)]">
                                <div className="text-[var(--shinkei-text)] truncate max-w-[200px]">
                                    {batch.currentLocation ?? "—"}
                                </div>
                                <div className="text-[10px] uppercase tracking-[0.14em]">
                                    {batch.currentBizStep ?? ""}
                                </div>
                            </TableCell>
                            <TableCell>
                                <Sparkline data={batch.sparkline} stroke="#ff6b1a" fill="rgba(255,107,26,0.18)" />
                            </TableCell>
                            <TableCell className="text-right">
                                <FreshnessChip score={batch.freshnessScore} />
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs">
                                <HoursCell hours={batch.hoursToUnsellable} confidence={batch.confidence} />
                            </TableCell>
                            <TableCell>
                                <RoutingChip recClass={batch.recommendation.class} label={batch.recommendation.label} />
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs">
                                {batch.revenueAtRisk > 0 ? (
                                    <span className="text-rose-700">${batch.revenueAtRisk.toLocaleString()}</span>
                                ) : (
                                    <span className="text-[var(--shinkei-text-mute)]">—</span>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <TableHead
            className={`text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--shinkei-text-mute)] font-semibold border-[var(--shinkei-rule)] ${className}`}
        >
            {children}
        </TableHead>
    );
}

function FreshnessChip({ score }: { score: number }) {
    const tone =
        score >= 80
            ? { fg: "text-emerald-800", bg: "bg-emerald-200/60", bd: "border-emerald-400/40", dot: "bg-emerald-600" }
            : score >= 40
            ? { fg: "text-amber-900", bg: "bg-amber-200/60", bd: "border-amber-400/40", dot: "bg-amber-600" }
            : { fg: "text-rose-900", bg: "bg-rose-200/70", bd: "border-rose-400/50", dot: "bg-rose-600" };
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md font-mono text-xs border ${tone.fg} ${tone.bg} ${tone.bd}`}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
            {score}%
        </span>
    );
}

function HoursCell({ hours, confidence }: { hours: number | null; confidence: number }) {
    if (hours === null) return <span className="text-[var(--shinkei-text-mute)]">stable</span>;
    const tone = hours < 24 ? "text-rose-700" : hours < 72 ? "text-amber-700" : "text-[var(--shinkei-text)]";
    return (
        <div className="leading-tight">
            <div className={tone}>{hours}h</div>
            <div className="text-[9px] uppercase tracking-[0.14em] text-[var(--shinkei-text-mute)]">
                R² {confidence.toFixed(2)}
            </div>
        </div>
    );
}

function RoutingChip({
    recClass,
    label,
}: {
    recClass: "premium" | "standard" | "process" | "reject";
    label: string;
}) {
    const tone =
        recClass === "premium"
            ? { fg: "text-[var(--shinkei-orange)]", bg: "bg-[var(--shinkei-orange)]/12", bd: "border-[var(--shinkei-orange)]/40" }
            : recClass === "standard"
            ? { fg: "text-[#1d5b85]", bg: "bg-[#a6cde2]/40", bd: "border-[#3a89bf]/30" }
            : recClass === "process"
            ? { fg: "text-amber-800", bg: "bg-amber-200/60", bd: "border-amber-400/40" }
            : { fg: "text-rose-800", bg: "bg-rose-200/60", bd: "border-rose-400/40" };
    return (
        <span
            className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-[11px] font-medium border ${tone.fg} ${tone.bg} ${tone.bd}`}
        >
            {label}
        </span>
    );
}
