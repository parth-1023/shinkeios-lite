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
        <div className="rounded-xl border border-white/8 bg-[var(--shinkei-ink-2)]/80 overflow-hidden">
            <div className="flex items-baseline justify-between px-5 pt-5 pb-3">
                <div>
                    <div className="shinkei-eyebrow">Inventory & Triage</div>
                    <h3 className="text-[15px] font-semibold mt-1">Active Seafood Batches</h3>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--shinkei-cream-mute)]">
                    Click row · open NERA diagnostics
                </span>
            </div>
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent border-white/8">
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
                    {batches.map((batch) => (
                        <TableRow
                            key={batch.id}
                            onClick={() => onSelectBatch(batch.id)}
                            className="cursor-pointer border-white/[0.06] hover:bg-white/[0.025] transition-colors"
                        >
                            <TableCell className="font-mono text-xs text-[var(--shinkei-orange)]">
                                {batch.id.slice(0, 8)}
                            </TableCell>
                            <TableCell className="text-[var(--shinkei-cream)]">
                                {batch.species}
                            </TableCell>
                            <TableCell className="text-[12px] text-[var(--shinkei-cream-mute)]">
                                <div className="text-[var(--shinkei-cream)] truncate max-w-[200px]">
                                    {batch.currentLocation ?? "—"}
                                </div>
                                <div className="text-[10px] uppercase tracking-[0.14em]">
                                    {batch.currentBizStep ?? ""}
                                </div>
                            </TableCell>
                            <TableCell>
                                <Sparkline data={batch.sparkline} />
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
                                    <span className="text-rose-300">${batch.revenueAtRisk.toLocaleString()}</span>
                                ) : (
                                    <span className="text-[var(--shinkei-cream-mute)]">—</span>
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
            className={`text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--shinkei-cream-mute)] font-semibold border-white/8 ${className}`}
        >
            {children}
        </TableHead>
    );
}

function FreshnessChip({ score }: { score: number }) {
    const tone =
        score >= 80
            ? { fg: "text-emerald-300", bg: "bg-emerald-400/10", bd: "border-emerald-400/20" }
            : score >= 40
            ? { fg: "text-amber-300", bg: "bg-amber-400/10", bd: "border-amber-400/20" }
            : { fg: "text-rose-300", bg: "bg-rose-400/10", bd: "border-rose-400/20" };
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md font-mono text-xs border ${tone.fg} ${tone.bg} ${tone.bd}`}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${tone.fg.replace("text-", "bg-")}`} />
            {score}%
        </span>
    );
}

function HoursCell({ hours, confidence }: { hours: number | null; confidence: number }) {
    if (hours === null) return <span className="text-[var(--shinkei-cream-mute)]">stable</span>;
    const tone = hours < 24 ? "text-rose-300" : hours < 72 ? "text-amber-300" : "text-[var(--shinkei-cream)]";
    return (
        <div className="leading-tight">
            <div className={tone}>{hours}h</div>
            <div className="text-[9px] uppercase tracking-[0.14em] text-[var(--shinkei-cream-mute)]">
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
            ? { fg: "text-[var(--shinkei-orange)]", bg: "bg-[var(--shinkei-orange)]/10", bd: "border-[var(--shinkei-orange)]/30" }
            : recClass === "standard"
            ? { fg: "text-[#88c4d2]", bg: "bg-[#88c4d2]/10", bd: "border-[#88c4d2]/25" }
            : recClass === "process"
            ? { fg: "text-amber-300", bg: "bg-amber-300/10", bd: "border-amber-300/25" }
            : { fg: "text-rose-300", bg: "bg-rose-400/10", bd: "border-rose-400/25" };
    return (
        <span
            className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-[11px] font-medium border ${tone.fg} ${tone.bg} ${tone.bd}`}
        >
            {label}
        </span>
    );
}
