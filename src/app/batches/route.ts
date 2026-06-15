import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { forecastBatch, revenueAtRisk } from '@/lib/freshness';

const SPARKLINE_POINTS = 24;

export async function GET() {
    try {
        const batches = await prisma.batch.findMany({
            include: {
                sensorReadings: {
                    orderBy: { recordedAt: 'asc' },
                    select: { recordedAt: true, mq135Value: true },
                },
                traceabilityEvents: {
                    orderBy: { eventTime: 'desc' },
                    take: 1,
                },
            },
        });

        const augmented = batches.map((batch) => {
            const readings = batch.sensorReadings;
            const latest = readings[readings.length - 1];
            const forecast = forecastBatch(batch.species, readings);

            // Downsample for sparkline rendering on the inventory row.
            const step = Math.max(1, Math.floor(readings.length / SPARKLINE_POINTS));
            const sparkline = readings
                .filter((_, i) => i % step === 0)
                .map((r) => Math.round(r.mq135Value));

            const lastStop = batch.traceabilityEvents[0];

            return {
                id: batch.id,
                species: batch.species,
                originLat: batch.originLat,
                originLng: batch.originLng,
                catchTime: batch.catchTime,
                latestPpm: latest ? Number(latest.mq135Value.toFixed(1)) : null,
                latestReadingAt: latest?.recordedAt ?? null,
                freshnessScore: forecast.currentFreshness,
                hoursToUnsellable: forecast.hoursToUnsellable,
                hoursToSpoil: forecast.hoursToSpoil,
                slopePpmPerHour: forecast.slopePpmPerHour,
                confidence: forecast.confidence,
                recommendation: forecast.recommendation,
                revenueAtRisk: revenueAtRisk(batch.species, forecast.recommendation),
                sparkline,
                currentLocation: lastStop?.location ?? null,
                currentBizStep: lastStop?.bizStep ?? null,
            };
        });

        return NextResponse.json(augmented);
    } catch (error) {
        console.error('Error fetching batches:', error);
        return NextResponse.json({ error: 'Failed to fetch batches' }, { status: 500 });
    }
}
