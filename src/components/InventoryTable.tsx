"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Batch {
    id: string;
    species: string;
    originLat: number;
    originLng: number;
    catchTime: string;
    freshnessScore: number;
}

interface InventoryTableProps {
    batches: Batch[];
    onSelectBatch: (id: string) => void;
}

export default function InventoryTable({ batches, onSelectBatch }: InventoryTableProps) {
    const getBadgeVariant = (score: number) => {
        if (score >= 80) return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
        if (score >= 40) return "bg-amber-500/15 text-amber-400 border-amber-500/30";
        return "bg-rose-500/15 text-rose-400 border-rose-500/30";
    };

    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-md overflow-hidden shadow-lg">
            <Table>
                <TableHeader className="bg-slate-900/80 border-slate-800">
                    <TableRow className="hover:bg-transparent border-slate-800">
                        <TableHead className="text-slate-400 font-semibold w-[120px]">Batch ID</TableHead>
                        <TableHead className="text-slate-400 font-semibold">Species</TableHead>
                        <TableHead className="text-slate-400 font-semibold">Origin Coordinates</TableHead>
                        <TableHead className="text-slate-400 font-semibold">Catch Date</TableHead>
                        <TableHead className="text-slate-400 font-semibold text-right">Freshness Score</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {batches.map((batch) => (
                        <TableRow
                            key={batch.id}
                            onClick={() => onSelectBatch(batch.id)}
                            className="cursor-pointer border-slate-800 hover:bg-slate-800/30 transition-colors"
                        >
                            <TableCell className="font-mono text-xs text-indigo-400">
                                {batch.id.slice(0, 8)}
                            </TableCell>
                            <TableCell className="font-medium text-slate-200">
                                {batch.species}
                            </TableCell>
                            <TableCell className="text-slate-400 text-xs font-mono">
                                {batch.originLat.toFixed(4)}°N, {batch.originLng.toFixed(4)}°E
                            </TableCell>
                            <TableCell className="text-slate-400 text-xs">
                                {new Date(batch.catchTime).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </TableCell>
                            <TableCell className="text-right">
                                <Badge className={`border font-semibold font-mono ${getBadgeVariant(batch.freshnessScore)}`}>
                                    {batch.freshnessScore}%
                                </Badge>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
